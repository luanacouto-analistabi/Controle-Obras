import { z } from "zod";

export const ProjectGeneralSchema = z
  .object({
    cc: z
      .string()
      .regex(/^\d{6}$/, { error: "CC deve ter exatamente 6 dígitos, sem ponto." }),
    project_coordinator: z
      .string()
      .min(1, { error: "Informe o coordenador do projeto." }),
    start_date: z.string().min(1, { error: "Informe a data de início." }),
    end_date: z.string().min(1, { error: "Informe a data de fim." }),
    vessel_name: z.string().min(1, { error: "Informe o nome da embarcação." }),
    client: z.string().min(1, { error: "Informe o cliente." }),
  })
  .refine((data) => data.end_date >= data.start_date, {
    error: "Data de fim não pode ser anterior à data de início.",
    path: ["end_date"],
  });

export const PaymentEventInputSchema = z.object({
  id: z.string().optional(),
  payment_event: z.string().min(1, { error: "Informe o evento de pagamento." }),
  invoice_description: z.string().optional().nullable(),
  payment_condition: z.string().optional().nullable(),
  expected_payment_date: z.string().optional().nullable(),
  amount: z.number({ error: "Informe um valor válido." }).min(0),
  status: z.enum(
    ["previsto", "em_discussao", "aprovado", "po_nao_emitida", "po_sem_saldo"],
    { error: "Selecione o status do pagamento." }
  ),
  measurement_status: z.enum(["aprovada", "em_discussao", "prevista"], {
    error: "Selecione o status da medição.",
  }),
  po_issued: z.boolean(),
});

export const BillingEventInputSchema = z.object({
  id: z.string().optional(),
  payment_event_id: z
    .string()
    .min(1, { error: "Selecione a qual evento de pagamento este faturamento se refere." }),
  billing_date: z.string().min(1, { error: "Informe a data de faturamento." }),
  billed_amount: z.number({ error: "Informe um valor válido." }).min(0),
  invoice_number: z.string().optional().nullable(),
  invoice_date: z.string().optional().nullable(),
  new_billing_date: z.string().optional().nullable(),
});

export const ProjectFormSchema = z.object({
  general: ProjectGeneralSchema,
  paymentEvents: z.array(PaymentEventInputSchema),
});

export const BillingFormSchema = z.object({
  billingEvents: z.array(BillingEventInputSchema),
});

export type ProjectGeneralInput = z.infer<typeof ProjectGeneralSchema>;
export type PaymentEventInput = z.infer<typeof PaymentEventInputSchema>;
export type BillingEventInput = z.infer<typeof BillingEventInputSchema>;
export type ProjectFormInput = z.infer<typeof ProjectFormSchema>;
export type BillingFormInput = z.infer<typeof BillingFormSchema>;
