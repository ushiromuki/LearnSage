import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// テナントテーブル
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// グループテーブル
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 既存のusersテーブルを更新
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "instructor", "student"] }).notNull().default("student"),
  tenantId: integer("tenant_id").references(() => tenants.id),
  groupId: integer("group_id").references(() => groups.id),
});

// 既存のcoursesテーブルを更新
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructorId: integer("instructor_id").references(() => users.id),
  tenantId: integer("tenant_id").references(() => tenants.id),
  groupId: integer("group_id").references(() => groups.id),
  tags: text("tags").array(),
  content: jsonb("content").$type<{
    sections: Array<{
      title: string;
      type: "text" | "quiz";
      content: string;
    }>;
  }>(),
});

// リレーションの定義
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  groups: many(groups),
  courses: many(courses),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [groups.tenantId],
    references: [tenants.id],
  }),
  users: many(users),
  courses: many(courses),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  group: one(groups, {
    fields: [users.groupId],
    references: [groups.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [courses.tenantId],
    references: [tenants.id],
  }),
  group: one(groups, {
    fields: [courses.groupId],
    references: [groups.id],
  }),
}));

// 既存のスキーマを保持
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  uploaderId: integer("uploader_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// クイズの問題テーブル
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  sectionIndex: integer("section_index").notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  points: integer("points").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// ユーザーの回答履歴テーブル
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  questionId: integer("question_id").references(() => quizQuestions.id),
  selectedAnswer: integer("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

// 詳細な学習進捗テーブル
export const learningProgress = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  sectionIndex: integer("section_index").notNull(),
  timeSpent: integer("time_spent").default(0), // 秒単位
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Gamification tables
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["course_completion", "quiz_score", "time_spent"] }).notNull(),
  requiredValue: integer("required_value").notNull(), // e.g., number of courses completed, quiz score percentage
  imageUrl: text("image_url"), // Achievement badge image
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  progress: integer("progress").default(0), // Current progress towards achievement
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add relations
export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

// リレーションの追加
export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  course: one(courses, {
    fields: [quizQuestions.courseId],
    references: [courses.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  question: one(quizQuestions, {
    fields: [quizAttempts.questionId],
    references: [quizQuestions.id],
  }),
}));

export const learningProgressRelations = relations(learningProgress, ({ one }) => ({
  user: one(users, {
    fields: [learningProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [learningProgress.courseId],
    references: [courses.id],
  }),
}));

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants);
export const insertGroupSchema = createInsertSchema(groups);

// 既存のinsertUserSchemaを更新
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  tenantId: true,
  groupId: true,
});

// CSVインポート用のスキーマ
export const csvUserImportSchema = z.object({
  username: z.string(),
  password: z.string(),
  name: z.string(),
  role: z.enum(["admin", "instructor", "student"]),
  tenantCode: z.string(),
  groupCode: z.string().optional(),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  tags: true,
  content: true,
  tenantId: true,
  groupId: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  userId: true,
  courseId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  url: true,
  courseId: true,
});

// Insert Schemas for Gamification
export const insertAchievementSchema = createInsertSchema(achievements).pick({
  title: true,
  description: true,
  type: true,
  requiredValue: true,
  imageUrl: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  progress: true,
  completed: true,
});


export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).pick({
  courseId: true,
  sectionIndex: true,
  question: true,
  options: true,
  correctAnswer: true,
  points: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  userId: true,
  questionId: true,
  selectedAnswer: true,
  isCorrect: true,
});

export const insertLearningProgressSchema = createInsertSchema(learningProgress).pick({
  userId: true,
  courseId: true,
  sectionIndex: true,
  timeSpent: true,
});

// Types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CsvUserImport = z.infer<typeof csvUserImportSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type InsertLearningProgress = z.infer<typeof insertLearningProgressSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type LearningProgress = typeof learningProgress.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;