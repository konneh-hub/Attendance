import { z } from "zod";

export const verificationMethodSchema = z.enum(["QR", "GPS", "FACE"]);

export const studentAttendanceSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  verificationMethod: verificationMethodSchema,
  qrToken: z.string().trim().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  faceImageData: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(1000).optional(),
});
