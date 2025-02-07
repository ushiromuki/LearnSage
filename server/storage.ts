import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Course, Enrollment, InsertUser, insertUserSchema } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  createCourse(course: Course): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByInstructor(instructorId: number): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  
  // Enrollment operations
  createEnrollment(enrollment: Enrollment): Promise<Enrollment>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  updateEnrollmentProgress(id: number, progress: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  public sessionStore: session.Store;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, role: "student" };
    this.users.set(id, user);
    return user;
  }

  async createCourse(course: Course): Promise<Course> {
    const id = this.currentId++;
    const newCourse = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.instructorId === instructorId,
    );
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createEnrollment(enrollment: Enrollment): Promise<Enrollment> {
    const id = this.currentId++;
    const newEnrollment = { ...enrollment, id };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.userId === userId,
    );
  }

  async updateEnrollmentProgress(id: number, progress: number): Promise<void> {
    const enrollment = this.enrollments.get(id);
    if (enrollment) {
      this.enrollments.set(id, { ...enrollment, progress });
    }
  }
}

export const storage = new MemStorage();
