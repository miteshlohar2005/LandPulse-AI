export type UserRole = "Administrator" | "State Officer" | "District Officer" | "Project Manager" | "Viewer";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  state?: string;
  district?: string;
  department?: string;
  is_active: boolean;
}

export interface RiskFactor {
  id?: number;
  factor_name: string;
  impact_percentage: number;
  impact_direction: "positive" | "negative";
  category: string;
}

export interface Prediction {
  id?: number;
  project_id: string;
  delay_probability: number;
  risk_score: number;
  risk_category: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  predicted_delay_days: number;
  confidence_score: number;
  risk_30d: number;
  risk_60d: number;
  risk_90d: number;
  model_version: string;
  created_at?: string;
  risk_factors?: RiskFactor[];
}

export interface ProjectStage {
  id: number;
  project_id: string;
  stage_number: number;
  stage_name: string;
  expected_duration_days: number;
  actual_duration_days: number;
  status: "Completed" | "In Progress" | "Delayed" | "At Risk" | "Pending";
  delay_probability: number;
  stage_risk: number;
  bottleneck: string;
}

export interface Recommendation {
  id: number;
  project_id: string;
  problem: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommended_action: string;
  responsible_department: string;
  priority: "P1" | "P2" | "P3";
  expected_impact: string;
  status: "Open" | "In Progress" | "Implemented" | "Dismissed";
  created_at?: string;
}

export interface Alert {
  id: number;
  project_id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  trigger_reason: string;
  primary_factor?: string;
  recommended_action?: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at?: string;
}

export interface DocumentRecord {
  id: number;
  project_id: string;
  document_name: string;
  category: string;
  file_type: string;
  file_size_kb: number;
  verified: boolean;
  uploaded_at?: string;
}

export interface Project {
  id: string;
  name: string;
  state: string;
  district: string;
  project_type: string;
  land_area_hectares: number;
  affected_families: number;
  compensation_budget_cr: number;
  compensation_disbursed_cr: number;
  compensation_percentage: number;
  approval_delay_days: number;
  legal_disputes_count: number;
  documentation_complete: boolean;
  notification_complete: boolean;
  possession_percentage: number;
  rehabilitation_percentage: number;
  stakeholder_responsiveness: "High" | "Medium" | "Low";
  historical_district_delay_score: number;
  current_stage: string;
  start_date?: string;
  expected_completion_date?: string;
  latitude: number;
  longitude: number;
  dataset_type: string;
  created_at?: string;
  updated_at?: string;
  risk_category?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score?: number;
  delay_probability?: number;
  predicted_delay_days?: number;
  confidence_score?: number;
  bottleneck?: string;
  stages?: ProjectStage[];
  latest_prediction?: Prediction;
  predictions?: Prediction[];
  recommendations?: Recommendation[];
  alerts?: Alert[];
  documents?: DocumentRecord[];
}

export interface KPISummary {
  total_projects: number;
  critical_risk_projects: number;
  high_risk_projects: number;
  medium_risk_projects: number;
  low_risk_projects: number;
  average_delay_probability: number;
  projects_requiring_action: number;
  total_land_area_hectares: number;
  total_affected_families: number;
  total_compensation_budget_cr: number;
  total_compensation_disbursed_cr: number;
}

export interface DashboardData {
  kpis: KPISummary;
  state_distribution: Array<{
    state: string;
    total_projects: number;
    avg_delay_prob: number;
    high_risk_count: number;
    critical_risk_count: number;
  }>;
  district_trends: Array<{
    district: string;
    state: string;
    avg_delay_days: number;
    project_count: number;
    risk_score: number;
  }>;
  risk_donut: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  top_delay_factors: Array<{
    factor: string;
    affected_projects_pct: number;
    avg_impact_pct: number;
  }>;
  stage_bottlenecks: Record<string, { total: number; delayed: number; delayed_pct: number }>;
  monthly_trend: Array<{
    month: string;
    avg_delay_prob: number;
    delayed_projects: number;
  }>;
}

export interface GISFeature {
  id: string;
  name: string;
  state: string;
  district: string;
  project_type: string;
  current_stage: string;
  land_area_hectares: number;
  compensation_percentage: number;
  latitude: number;
  longitude: number;
  risk_score: number;
  delay_probability: number;
  risk_category: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  predicted_delay_days: number;
  bottleneck?: string;
  affected_families?: number;
  confidence_score?: number;
}

export interface ModelMetrics {
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix?: number[][];
}

export interface ModelStatus {
  active_model: {
    version: string;
    algorithm: string;
    metrics: ModelMetrics;
    all_model_metrics?: Record<string, ModelMetrics>;
    trained_at: string;
    train_records_count: number;
  };
  history: Array<{
    id: number;
    version: string;
    algorithm: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    train_records_count: number;
    is_active: boolean;
    trained_at: string;
    notes?: string;
  }>;
}

export interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  created_at: string;
}

export type SupportTicketStatus = 
  | 'Request Received'
  | 'Under Review'
  | 'Support Team Assigned'
  | 'Additional Information Required'
  | 'Resolved'
  | 'Closed';

export type SupportCategory = 
  | 'Land Records'
  | 'Property Ownership'
  | 'Document Problems'
  | 'Land Dispute'
  | 'Application Delay'
  | 'Technical Problem'
  | 'Other';

export interface SupportTicket {
  id: number;
  ticket_id: string;
  full_name: string;
  email: string;
  phone?: string;
  category: SupportCategory | string;
  subject: string;
  description: string;
  status: SupportTicketStatus | string;
  admin_response?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupportConfig {
  support_phone: string;
  support_email: string;
  support_hours: string;
}

export interface SupportTicketCreate {
  full_name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  description: string;
}

export interface SupportTicketStatusResponse {
  ticket_id: string;
  status: string;
  category: string;
  subject: string;
  created_at?: string;
  updated_at?: string;
  admin_response?: string;
}

