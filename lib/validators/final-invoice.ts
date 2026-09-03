import { z } from "zod";

export const FinalInvoiceItemInputSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(2),
  item: z.string().optional().default(""),
  os: z.string().optional().default(""),
  description: z.string().optional().default(""),
  qty: z.string().optional().default(""),
  unit: z.string().optional().default(""),
  unit_price: z.string().optional().default(""),
  total_price: z.string().optional().default(""),
  updated_qty: z.string().optional().default(""),
  updated_value: z.string().optional().default(""),
  estaleiro_notes: z.string().optional().default(""),
});

export const FinalInvoiceItemsFormSchema = z.object({
  items: z.array(FinalInvoiceItemInputSchema),
});

export type FinalInvoiceItemInput = z.infer<typeof FinalInvoiceItemInputSchema>;
