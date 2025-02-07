import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "instructor", "student"] }).notNull().default("student"),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructorId: integer("instructor_id").references(() => users.id),
  tags: text("tags").array(),
  content: jsonb("content").$type<{
    sections: Array<{
      title: string;
      type: "text" | "quiz";
      content: string;
    }>;
  }>(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for storing file metadata
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  tags: true,
  content: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;