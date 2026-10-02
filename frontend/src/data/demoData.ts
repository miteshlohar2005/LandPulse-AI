import allProjectsJson from './allProjects.json';
import allAlertsJson from './allAlerts.json';
import allRecommendationsJson from './allRecommendations.json';

export interface ProjectItem {
  id: string;
  name: string;
  state: string;
  district: string;
  project_type: string;
  land_area_hectares: number;
  affected_families: number;
  compensation_percentage: number;
  compensation_budget_cr: number;
  compensation_disbursed_cr: number;
  approval_delay_days: number;
  legal_disputes_count: number;
  documentation_complete: boolean;
  notification_complete: boolean;
  possession_percentage: number;
  rehabilitation_percentage: number;
  stakeholder_responsiveness: "High" | "Medium" | "Low";
  current_stage: string;
  risk_score: number;
  delay_probability: number;
  risk_category: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  predicted_delay_days: number;
  confidence_score: number;
  last_updated: string;
  latitude: number;
  longitude: number;
  bottleneck: string;
  latest_prediction?: {
    project_id: string;
    delay_probability: number;
    risk_score: number;
    risk_category: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    predicted_delay_days: number;
    confidence_score: number;
    risk_30d?: number;
    risk_60d?: number;
    risk_90d?: number;
    model_version?: string;
  };
}

export const DEMO_PROJECTS: ProjectItem[] = (allProjectsJson as any[]).map(p => ({
  ...p,
  latest_prediction: p.latest_prediction || {
    project_id: p.id,
    delay_probability: p.delay_probability ?? 0.5,
    risk_score: p.risk_score ?? 5.0,
    risk_category: p.risk_category ?? 'LOW',
    predicted_delay_days: p.predicted_delay_days ?? 30,
    confidence_score: p.confidence_score ?? 0.85,
    risk_30d: (p.delay_probability || 0.5) * 0.4,
    risk_60d: (p.delay_probability || 0.5) * 0.7,
    risk_90d: p.delay_probability || 0.5,
    model_version: "v1.0.0-rf"
  }
}));

export interface AlertItem {
  id: number;
  project_id: string;
  project_name: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  primary_factor: string;
  recommended_action: string;
  time: string;
  is_read: boolean;
  is_acknowledged: boolean;
}

export const DEMO_ALERTS: AlertItem[] = allAlertsJson as AlertItem[];

export interface RecommendationItem {
  id: number;
  project_id: string;
  problem: string;
  recommended_action: string;
  responsible_department: string;
  priority_level: string;
  expected_impact_days: number;
  status: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export const DEMO_RECOMMENDATIONS: RecommendationItem[] = allRecommendationsJson as unknown as RecommendationItem[];
