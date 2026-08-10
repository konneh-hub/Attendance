import { z } from "zod";

export const pageQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const userCreateSchema = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(2).max(160),
  password: z.string().min(12).max(128),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  studentNumber: z.string().trim().min(1).max(40).optional(),
  programme: z.string().trim().max(160).optional(),
  level: z.string().trim().max(40).optional(),
  staffNumber: z.string().trim().min(1).max(40).optional(),
  departmentId: z.string().uuid().optional(),
});

export const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(20),
});

export const courseSchema = z.object({
  code: z.string().trim().min(2).max(30),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  departmentId: z.string().uuid(),
  lecturerId: z.string().uuid(),
});
