import { healthInsuranceScenario } from './healthInsuranceAgent';
import type { RealtimeAgent } from '@openai/agents/realtime';

// Map of scenario key -> array of RealtimeAgent objects (single scenario after refactor)
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  healthInsurance: healthInsuranceScenario,
};

export const defaultAgentSetKey = 'healthInsurance';
