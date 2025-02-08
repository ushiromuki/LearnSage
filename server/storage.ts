import session from "express-session";
import { users, courses, enrollments, files, tenants, groups,
  quizQuestions, quizAttempts, learningProgress, achievements, userAchievements,
  type User, type Course, type Enrollment, type InsertUser,
  type File, type InsertFile, type Tenant, type InsertTenant,
  type Group, type InsertGroup, type QuizQuestion, type InsertQuizQuestion,
  type QuizAttempt, type InsertQuizAttempt, type LearningProgress,
  type InsertLearningProgress, type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByTenant(tenantId: number): Promise<User[]>;
  getUsersByGroup(groupId: number): Promise<User[]>;
  importUsers(users: InsertUser[]): Promise<User[]>;

  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  updateUserAchievementProgress(data: InsertUserAchievement): Promise<UserAchievement>;

  // Tenant operations
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByCode(code: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;

  // Group operations
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupByCode(tenantId: number, code: string): Promise<Group | undefined>;
  getGroupsByTenant(tenantId: number): Promise<Group[]>;

  // Course operations
  createCourse(course: Course): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByInstructor(instructorId: number): Promise<Course[]>;
  getCoursesByTenant(tenantId: number): Promise<Course[]>;
  getCoursesByGroup(groupId: number): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;

  // Enrollment operations
  createEnrollment(enrollment: Enrollment): Promise<Enrollment>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  updateEnrollmentProgress(id: number, progress: number): Promise<void>;
  getAllEnrollments(): Promise<Enrollment[]>;

  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFilesByCourse(courseId: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;

  // Quiz関連の操作
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  getQuizQuestionsByCourse(courseId: number): Promise<QuizQuestion[]>;
  submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]>;

  // 学習進捗関連の操作
  updateLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress>;
  getLearningProgressByUser(userId: number): Promise<LearningProgress[]>;
  getLearningProgressByCourse(courseId: number): Promise<LearningProgress[]>;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Achievement operations
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async updateUserAchievementProgress(data: InsertUserAchievement): Promise<UserAchievement> {
    const [existingProgress] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, data.userId),
          eq(userAchievements.achievementId, data.achievementId)
        )
      );

    if (existingProgress) {
      const [updatedProgress] = await db
        .update(userAchievements)
        .set(data)
        .where(eq(userAchievements.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      const [newProgress] = await db
        .insert(userAchievements)
        .values(data)
        .returning();
      return newProgress;
    }
  }

  // Tenant operations
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByCode(code: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.code, code));
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants);
  }

  // Group operations
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupByCode(tenantId: number, code: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups)
      .where(and(
        eq(groups.tenantId, tenantId),
        eq(groups.code, code)
      ));
    return group;
  }

  async getGroupsByTenant(tenantId: number): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.tenantId, tenantId));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsersByTenant(tenantId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async getUsersByGroup(groupId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.groupId, groupId));
  }

  async importUsers(usersToImport: InsertUser[]): Promise<User[]> {
    return await db.insert(users).values(usersToImport).returning();
  }

  // Course operations
  async createCourse(course: Course): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.instructorId, instructorId));
  }

  async getCoursesByTenant(tenantId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.tenantId, tenantId));
  }

  async getCoursesByGroup(groupId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.groupId, groupId));
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  // Enrollment operations
  async createEnrollment(enrollment: Enrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async updateEnrollmentProgress(id: number, progress: number): Promise<void> {
    await db.update(enrollments)
      .set({ progress })
      .where(eq(enrollments.id, id));
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }

  // File operations
  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async getFilesByCourse(courseId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.courseId, courseId));
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  // Quiz関連のメソッド
  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  async getQuizQuestionsByCourse(courseId: number): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions).where(eq(quizQuestions.courseId, courseId));
  }

  async submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
  }

  // 学習進捗関連のメソッド
  async updateLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress> {
    const [existingProgress] = await db
      .select()
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, progress.userId),
          eq(learningProgress.courseId, progress.courseId),
          eq(learningProgress.sectionIndex, progress.sectionIndex)
        )
      );

    if (existingProgress) {
      const [updatedProgress] = await db
        .update(learningProgress)
        .set({
          timeSpent: existingProgress.timeSpent + (progress.timeSpent || 0),
          lastAccessedAt: new Date(),
          ...(progress.timeSpent === 0 ? { completedAt: new Date() } : {})
        })
        .where(eq(learningProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      const [newProgress] = await db
        .insert(learningProgress)
        .values(progress)
        .returning();
      return newProgress;
    }
  }

  async getLearningProgressByUser(userId: number): Promise<LearningProgress[]> {
    return await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId));
  }

  async getLearningProgressByCourse(courseId: number): Promise<LearningProgress[]> {
    return await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.courseId, courseId));
  }
}

export const storage = new DatabaseStorage();