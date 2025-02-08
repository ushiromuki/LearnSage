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