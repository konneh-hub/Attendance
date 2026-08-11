import { z } from "zod";

export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE"]);

export const attendanceItemSchema = z.object({
  studentId: z.string().uuid(),
  status: attendanceStatusSchema,
  notes: z.string().trim().max(1000).optional(),
});

export const attendanceSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  attendances: z.array(attendanceItemSchema).min(1),
});
