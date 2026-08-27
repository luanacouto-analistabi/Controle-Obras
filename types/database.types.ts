/**
 * Tipos escritos à mão a partir de supabase/migrations/0001_init.sql.
 * Substituir por `supabase gen types typescript --linked` assim que o
 * projeto Supabase existir — ver SETUP.md.
 */

export type UserRole = "admin" | "gestor" | "visualizador";
export type ProjectStatus = "ativo" | "concluido" | "cancelado";
export type PaymentStatus =
  | "previsto"
  | "em_discussao"
  | "aprovado"
  | "po_nao_emitida"
  | "po_sem_saldo";
export type DocumentType = "cronograma" | "outro";
export type MeasurementStatus = "aprovada" | "em_discussao" | "prevista";
export type BillingStatus = "a_faturar" | "faturado" | "pendente";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  cc: string;
  project_coordinator: string;
  start_date: string;
  end_date: string;
  vessel_name: string;
  client: string;
  status: ProjectStatus;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type PaymentEvent = {
  id: string;
  project_id: string;
  payment_event: string;
  invoice_description: string | null;
  invoice_date: string | null;
  payment_condition: string | null;
  expected_payment_date: string | null;
  amount: number;
  measurement_date: string | null;
  po_issued: boolean;
  invoice_number: string | null;
  status: PaymentStatus;
  measurement_status: MeasurementStatus;
  paid_amount: number | null;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
};

export type BillingEvent = {
  id: string;
  project_id: string;
  payment_event_id: string | null;
  billing_date: string;
  billed_amount: number;
  overdue_amount: number;
  new_billing_date: string | null;
  billing_status: BillingStatus;
  created_at: string;
  updated_at: string;
};

export type ProjectDocument = {
  id: string;
  project_id: string;
  file_name: string;
  storage_path: string;
  version: number;
  document_type: DocumentType;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type ProjectChangeHistory = {
  id: string;
  project_id: string;
  user_id: string | null;
  changed_at: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  document_id: string | null;
};

export type OsAcceptanceTerm = {
  id: string;
  project_id: string;
  cod_os: string;
  signed_at: string | null;
  file_name: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type ProjectFinancialSummary = {
  project_id: string;
  approved_amount: number;
  in_discussion_amount: number;
  forecast_amount: number;
  po_not_issued_amount: number;
  po_no_balance_amount: number;
  paid_amount: number;
  upcoming_amount: number;
  overdue_amount: number;
};

type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
type View<T> = { Row: T; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      projects: Table<Project>;
      payment_events: Table<PaymentEvent>;
      billing_events: Table<BillingEvent>;
      project_documents: Table<ProjectDocument>;
      project_change_history: Table<ProjectChangeHistory>;
      os_acceptance_terms: Table<OsAcceptanceTerm>;
    };
    Views: {
      project_financial_summary: View<ProjectFinancialSummary>;
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      payment_status: PaymentStatus;
      document_type: DocumentType;
      measurement_status: MeasurementStatus;
      billing_status: BillingStatus;
    };
  };
};
