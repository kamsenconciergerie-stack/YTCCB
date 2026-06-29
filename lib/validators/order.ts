import { z } from "zod";

export const OrderStatusSchema = z.enum([
  "PRE_CONFIRMEE",
  "PAYE",
  "EN_PREPARATION",
  "EN_LIVRAISON",
  "LIVREE",
  "EXPIREE",
  "ANNULEE",
]);

export const OrderItemInputSchema = z.object({
  chaussureId: z.string().uuid(),
  quantity: z.number().int().positive(),
  pointure: z.string().max(10).optional(),
  couleur: z.string().max(100).optional(),
});

export const CreateOrderSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerWhatsapp: z.string().regex(/^\+?[0-9]{9,15}$/, "Numéro invalide"),
  deliveryAddress: z.string().min(5).max(500),
  deliveryCity: z.string().min(1).max(100),
  deliveryZoneId: z.string().uuid(),
  canalFinalisation: z.enum(["WEB", "WHATSAPP"]),
  items: z.array(OrderItemInputSchema).min(1, "Le panier est vide"),
  notes: z.string().max(500).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  cancelReason: z.string().max(500).optional(),
  livreurId: z.string().uuid().optional(),
});

export const OrderFiltersSchema = z.object({
  status: OrderStatusSchema.optional(),
  canal: z.enum(["WEB", "WHATSAPP"]).optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderFilters = z.infer<typeof OrderFiltersSchema>;
