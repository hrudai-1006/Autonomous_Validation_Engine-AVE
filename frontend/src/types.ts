export interface Provider {
  id: number;
  full_name: string;
  npi: string;
  specialty: string;
  address: string;
  license: string;
  status: 'Validated' | 'Flagged' | 'Pending';
  confidence_score: number;
  last_updated: string;
  latest_validation_id?: number;
}

export interface ValidationReport {
  id: number;
  provider_id: number;
  status: 'Validated' | 'Flagged';
  confidence_score: number;
  discrepancies: string[];
  extracted_data: Record<string, any>;
  registry_data: Record<string, any>;
  timestamp: string;
}

export interface AgentLog {
  id: number;
  agent_name: string;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  timestamp: string;
}

export interface DashboardStats {
  total_profiles: number;
  validated: number;
  action_required: number;
  avg_confidence: number;
}
