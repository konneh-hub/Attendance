import { z } from "zod";

export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE"]);

export const verificationMethodSchema = z.enum(["QR", "GPS", "FACE", "MANUAL"]);

export const attendanceItemSchema = z.object({
  studentId: z.string().uuid(),
  status: attendanceStatusSchema,
  notes: z.string().trim().max(1000).optional(),
});

export const attendanceSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  attendances: z.array(attendanceItemSchema).min(1),
});

export const createSessionSchema = z
  .object({
    courseId: z.string().uuid(),
    title: z.string().trim().min(3).max(160),
    startsAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Invalid session start date/time.",
      })
      .transform((value) => new Date(value)),
    endsAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Invalid session end date/time.",
      })
      .transform((value) => new Date(value)),
    verificationMethods: z.array(verificationMethodSchema).min(1),
    locationLatitude: z
      .preprocess((value) => {
        if (value === "" || value === undefined || value === null) return undefined;
        return Number(value);
      }, z.number().finite().optional())
      .nullable(),
    locationLongitude: z
      .preprocess((value) => {
        if (value === "" || value === undefined || value === null) return undefined;
        return Number(value);
      }, z.number().finite().optional())
      .nullable(),
    locationRadiusMeters: z
      .preprocess((value) => {
        if (value === "" || value === undefined || value === null) return undefined;
        return Number(value);
      }, z.number().int().positive().optional())
      .nullable(),
    qrToken: z.string().trim().min(4).max(128).optional().nullable(),
  })
  .superRefine((input, ctx) => {
    if (input.endsAt <= input.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End time must be after start time.",
      });
    }

    if (input.verificationMethods.includes("GPS")) {
      if (input.locationLatitude == null || input.locationLongitude == null || input.locationRadiusMeters == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["verificationMethods"],
          message: "GPS verification requires a location and radius.",
        });
      }
    }

    if (input.verificationMethods.includes("QR") && !input.qrToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qrToken"],
        message: "QR verification requires a QR token.",
      });
    }

    if (input.verificationMethods.includes("FACE") && input.qrToken) {
      // no-op; QR token may still be provided but is only required when QR is selected
    }
  });

export const sessionStatusUpdateSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(["OPEN", "CLOSE"]),
});
