import { z } from "zod";

export const LeadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUOTE_SENT",
  "WON",
  "LOST",
]);

export const CreateLeadSchema = z.object({
  customerId: z.string().uuid().optional(),
  whatsappNumber: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/, "Format de numéro WhatsApp invalide")
    .optional(),
  name: z.string().min(1).max(100).optional(),
  company: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  estimatedValue: z.number().positive().optional(),
}).refine(
  (data) => data.customerId || data.whatsappNumber,
  { message: "customerId ou whatsappNumber requis" }
);

export const AssignLeadSchema = z.object({
  salesRepId: z.string().uuid(),
});

export const UpdateLeadStatusSchema = z.object({
  status: LeadStatusSchema,
  lostReason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type AssignLeadInput = z.infer<typeof AssignLeadSchema>;
