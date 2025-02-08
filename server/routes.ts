import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertCourseSchema,
  insertEnrollmentSchema,
  insertTenantSchema,
  insertGroupSchema,
  insertUserSchema,
  csvUserImportSchema,
  insertQuizQuestionSchema,
  insertQuizAttemptSchema,
  insertLearningProgressSchema,
} from "@shared/schema";
import { upload, saveFileMetadata } from "./upload";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { hashPassword } from "./auth";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // テナント関連のエンドポイント
  app.post("/api/tenants", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Only administrators can create tenants");
    }

    const tenantData = insertTenantSchema.parse(req.body);
    const tenant = await storage.createTenant(tenantData);
    res.status(201).json(tenant);
  });

  app.get("/api/tenants", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Only administrators can view tenants");
    }

    const tenants = await storage.getAllTenants();
    res.json(tenants);
  });

  // グループ関連のエンドポイント
  app.post("/api/tenants/:tenantId/groups", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Only administrators can create groups");
    }

    const tenantId = parseInt(req.params.tenantId);
    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).send("Tenant not found");
    }

    const groupData = insertGroupSchema.parse({ ...req.body, tenantId });
    const group = await storage.createGroup(groupData);
    res.status(201).json(group);
  });

  app.get("/api/tenants/:tenantId/groups", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to view groups");
    }

    const tenantId = parseInt(req.params.tenantId);
    const groups = await storage.getGroupsByTenant(tenantId);
    res.json(groups);
  });

  // ユーザー管理エンドポイント
  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Only administrators can create users");
    }

    const userData = insertUserSchema.parse(req.body);
    const hashedPassword = await hashPassword(userData.password);
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    res.status(201).json(user);
  });

  // CSVによるユーザー一括インポート
  app.post("/api/users/import", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Only administrators can import users");
    }

    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded");
    }

    try {
      const fileContent = file.buffer.toString();
      const records: any[] = [];

      const parser = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      for await (const record of parser) {
        const validatedRecord = csvUserImportSchema.parse(record);
        const tenant = await storage.getTenantByCode(validatedRecord.tenantCode);
        if (!tenant) {
          throw new Error(`Tenant not found: ${validatedRecord.tenantCode}`);
        }

        let groupId = undefined;
        if (validatedRecord.groupCode) {
          const group = await storage.getGroupByCode(tenant.id, validatedRecord.groupCode);
          if (!group) {
            throw new Error(`Group not found: ${validatedRecord.groupCode}`);
          }
          groupId = group.id;
        }

        records.push({
          username: validatedRecord.username,
          password: await hashPassword(validatedRecord.password),
          name: validatedRecord.name,
          role: validatedRecord.role,
          tenantId: tenant.id,
          groupId,
        });
      }

      const users = await storage.importUsers(records);
      res.status(201).json(users);
    } catch (error) {
      console.error("CSV import error:", error);
      res.status(400).json({
        message: "Failed to import users",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // テナントに属するユーザー一覧
  app.get("/api/tenants/:tenantId/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Only administrators can view tenant users");
    }

    const tenantId = parseInt(req.params.tenantId);
    const users = await storage.getUsersByTenant(tenantId);
    res.json(users);
  });

  // グループに属するユーザー一覧
  app.get("/api/groups/:groupId/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Only administrators can view group users");
    }

    const groupId = parseInt(req.params.groupId);
    const users = await storage.getUsersByGroup(groupId);
    res.json(users);
  });

  // Courses
  app.get("/api/courses", async (_req, res) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  });

  app.post("/api/courses", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== "instructor" && req.user.role !== "admin")) {
      return res.status(403).send("Only instructors and administrators can create courses");
    }

    const courseData = insertCourseSchema.parse(req.body);
    const course = await storage.createCourse({
      ...courseData,
      instructorId: req.user.id,
      tags: courseData.tags || [],
      content: courseData.content || { sections: [] },
    });
    res.status(201).json(course);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) {
      return res.status(404).send("Course not found");
    }

    // テナントとグループのアクセス制御
    if (req.user?.tenantId !== course.tenantId) {
      return res.status(403).send("Access denied: Course not available for your tenant");
    }

    if (course.groupId && req.user?.groupId !== course.groupId) {
      return res.status(403).send("Access denied: Course not available for your group");
    }

    res.json(course);
  });

  // Enrollments
  app.post("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to enroll");
    }

    const enrollmentData = insertEnrollmentSchema.parse(req.body);

    // コースのアクセス制御チェック
    const course = await storage.getCourse(enrollmentData.courseId);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    if (req.user.tenantId !== course.tenantId) {
      return res.status(403).send("Access denied: Course not available for your tenant");
    }

    if (course.groupId && req.user.groupId !== course.groupId) {
      return res.status(403).send("Access denied: Course not available for your group");
    }

    const enrollment = await storage.createEnrollment({
      ...enrollmentData,
      userId: req.user.id,
      courseId: enrollmentData.courseId,
      progress: 0,
      completed: false,
      createdAt: new Date(),
    });
    res.status(201).json(enrollment);
  });

  app.get("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to view enrollments");
    }

    const enrollments = await storage.getEnrollmentsByUser(req.user.id);
    res.json(enrollments);
  });

  app.patch("/api/enrollments/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to update progress");
    }

    const { progress } = req.body;
    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return res.status(400).send("Invalid progress value");
    }

    await storage.updateEnrollmentProgress(parseInt(req.params.id), progress);
    res.sendStatus(200);
  });

  app.get("/api/enrollments/all", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "instructor") {
      return res.status(403).send("Only instructors can view all enrollments");
    }

    const enrollments = await storage.getAllEnrollments();
    res.json(enrollments);
  });

  // File upload endpoints
  app.post("/api/courses/:courseId/files", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to upload files");
    }

    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    if (course.instructorId !== req.user.id) {
      return res.status(403).send("Only course instructors can upload files");
    }

    try {
      const file = req.file as Express.MulterS3.File;
      if (!file) {
        return res.status(400).send("No file uploaded");
      }

      const savedFile = await saveFileMetadata(file, courseId, req.user.id);
      res.status(201).json(savedFile);
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).send("Failed to upload file");
    }
  });

  app.get("/api/courses/:courseId/files", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to view files");
    }

    const courseId = parseInt(req.params.courseId);
    const files = await storage.getFilesByCourse(courseId);
    res.json(files);
  });

  // クイズ関連のエンドポイント
  app.post("/api/courses/:courseId/quiz-questions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "instructor") {
      return res.status(403).send("Only instructors can create quiz questions");
    }

    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    if (course.instructorId !== req.user.id) {
      return res.status(403).send("Only course instructors can create quiz questions");
    }

    const questionData = insertQuizQuestionSchema.parse({
      ...req.body,
      courseId,
    });

    const question = await storage.createQuizQuestion(questionData);
    res.status(201).json(question);
  });

  app.get("/api/courses/:courseId/quiz-questions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to view quiz questions");
    }

    const courseId = parseInt(req.params.courseId);
    const questions = await storage.getQuizQuestionsByCourse(courseId);
    res.json(questions);
  });

  app.post("/api/quiz-attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to submit quiz attempts");
    }

    const attemptData = insertQuizAttemptSchema.parse({
      ...req.body,
      userId: req.user.id,
    });

    const attempt = await storage.submitQuizAttempt(attemptData);
    res.status(201).json(attempt);
  });

  app.get("/api/quiz-attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to view quiz attempts");
    }

    const attempts = await storage.getQuizAttemptsByUser(req.user.id);
    res.json(attempts);
  });

  // 学習進捗関連のエンドポイント
  app.post("/api/courses/:courseId/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to update progress");
    }

    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    const progressData = insertLearningProgressSchema.parse({
      ...req.body,
      userId: req.user.id,
      courseId,
    });

    const progress = await storage.updateLearningProgress(progressData);
    res.status(201).json(progress);
  });

  app.get("/api/courses/:courseId/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to view progress");
    }

    const courseId = parseInt(req.params.courseId);
    const progress = await storage.getLearningProgressByCourse(courseId);

    // 現在のユーザーの進捗のみを返す
    const userProgress = progress.find(p => p.userId === req.user.id);
    res.json(userProgress || null);
  });

  const httpServer = createServer(app);
  return httpServer;
}