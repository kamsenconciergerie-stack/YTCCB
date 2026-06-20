import { z } from "zod";

export const PaymentProviderSchema = z.enum(["WAVE", "ORANGE_MONEY", "ON_DELIVERY"]);

export const InitiatePaymentSchema = z.object({
  orderId:     z.string().uuid(),
  provider:    PaymentProviderSchema,
  // Numéro client requis uniquement pour Orange Money (push USSD)
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/)
    .optional(),
  returnUrl:   z.string().url().optional(),
  cancelUrl:   z.string().url().optional(),
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;
