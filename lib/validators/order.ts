import { z } from "zod";

export const OrderChannelSchema = z.enum(["WHATSAPP", "WEB", "MANUAL", "PHONE"]);

export const OrderStatusSchema = z.enum([
  "PRE_CONFIRMED",
  "CONFIRMED",
  "IN_PREPARATION",
  "IN_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export const OrderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CreateOrderSchema = z.object({
  // WhatsApp number du client — normalisé côté serveur
  customerWhatsapp: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/, "Format de numéro WhatsApp invalide"),
  customerName: z.string().min(1).max(100).optional(),
  channel: OrderChannelSchema,
  items: z.array(OrderItemInputSchema).min(1, "La commande doit contenir au moins un produit"),
  deliveryZoneId: z.string().uuid().optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryCity: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  cancelReason: z.string().max(500).optional(),
});

export const OrderFiltersSchema = z.object({
  status: OrderStatusSchema.optional(),
  channel: OrderChannelSchema.optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderFilters = z.infer<typeof OrderFiltersSchema>;
