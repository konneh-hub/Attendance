import { z } from "zod";

export const verificationMethodSchema = z.enum(["QR", "GPS", "FACE"]);

const latitudeSchema = z.number().finite().min(-90).max(90);
const longitudeSchema = z.number().finite().min(-180).max(180);

export const studentAttendanceSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  verificationMethod: verificationMethodSchema,
  qrToken: z.string().trim().min(1).max(128).optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  faceImageData: z.string().trim().min(1).max(2_000_000).optional(),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((input, ctx) => {
  if (input.verificationMethod === "QR" && !input.qrToken) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["qrToken"], message: "QR verification code is required." });
  }

  if (input.verificationMethod === "GPS" && (input.latitude == null || input.longitude == null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["latitude"], message: "GPS coordinates are required." });
  }

  if (input.verificationMethod === "FACE" && !input.faceImageData) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["faceImageData"], message: "Face capture is required." });
  }
});
