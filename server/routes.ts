import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCourseSchema, insertEnrollmentSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Courses
  app.get("/api/courses", async (_req, res) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  });

  app.post("/api/courses", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "instructor") {
      return res.status(403).send("Only instructors can create courses");
    }

    const courseData = insertCourseSchema.parse(req.body);
    const course = await storage.createCourse({
      ...courseData,
      instructorId: req.user.id,
      id: undefined, // Let the database generate the ID
      tags: courseData.tags || null,
      content: courseData.content || null,
    });
    res.status(201).json(course);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) {
      return res.status(404).send("Course not found");
    }
    res.json(course);
  });

  // Enrollments
  app.post("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Must be logged in to enroll");
    }

    const enrollmentData = insertEnrollmentSchema.parse(req.body);
    const enrollment = await storage.createEnrollment({
      ...enrollmentData,
      id: undefined, // Let the database generate the ID
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

  const httpServer = createServer(app);
  return httpServer;
}