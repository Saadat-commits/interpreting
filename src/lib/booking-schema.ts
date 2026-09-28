import { z } from "zod";
import { addressProblems } from "./address";
import { emailRe, isPhone } from "./validators";

const address = z
  .object({
    label: z.string().max(300),
    street: z.string().max(120),
    houseNumber: z.string().max(20),
    postalCode: z.string().max(12),
    city: z.string().max(80),
    country: z.string().length(2),
    placeName: z.string().max(160).optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    source: z.enum(["google", "photon", "manual", "mock"]),
    providerId: z.string().max(300).optional(),
  })
  .refine((a) => addressProblems(a).length === 0, { message: "invalid_address" });

const trimmed = (max: number) => z.string().trim().max(max);

export const bookingRequestSchema = z
  .object({
    locale: z.enum(["de", "fa"]),
    service: z.enum(["phone", "onsite"]),
    language: z.enum(["dari", "farsi", "pashto"]),
    category: z.enum(["medical", "school", "youth_office", "authority", "counseling", "other"]),
    durationMinutes: z.number().int().positive(),
    start: z.string().datetime(),
    clientName: trimmed(120).min(2),
    onsite: z
      .object({
        address,
        institution: trimmed(160).optional(),
        caseWorker: trimmed(120).optional(),
      })
      .optional(),
    phoneSession: z.object({ callNumber: trimmed(40).refine(isPhone) }).optional(),
    contact: z.object({
      name: trimmed(120).min(2),
      organisation: trimmed(160).optional(),
      email: trimmed(200).regex(emailRe),
      phone: trimmed(40).refine(isPhone),
    }),
    billingSameAsAppointment: z.boolean(),
    billingAddress: address.optional(),
    notes: trimmed(2000).optional(),
    acceptTerms: z.literal(true),
    /** Honeypot gegen Spam-Bots – muss leer bleiben */
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.service === "onsite" && !v.onsite) ctx.addIssue({ code: "custom", path: ["onsite"], message: "required" });
    if (v.service === "phone" && !v.phoneSession) ctx.addIssue({ code: "custom", path: ["phoneSession"], message: "required" });
    // Vor Ort mit abweichender Rechnungsadresse → Adresse nötig; telefonisch ist sie freiwillig
    if (v.service === "onsite" && !v.billingSameAsAppointment && !v.billingAddress)
      ctx.addIssue({ code: "custom", path: ["billingAddress"], message: "required" });
  });

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
