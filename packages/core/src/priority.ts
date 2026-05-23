import {
  type DeviceKnowledgeModuleOrigin,
  type ValidationIssue,
  type ValidationResult,
  validationFailed,
  validationOk,
} from './types.js';

export type ModuleSpecificity = 'family' | 'platform';

export interface ModuleConflictCandidate {
  moduleId: string;
  origin: DeviceKnowledgeModuleOrigin;
  priority: number;
  targetId: string;
  specificity: ModuleSpecificity;
  override?: boolean;
}

export interface ModuleConflictResolution {
  winner: ModuleConflictCandidate;
  rejected: ModuleConflictCandidate[];
  explanation: string;
}

const PRIORITY_RANGES: Record<DeviceKnowledgeModuleOrigin, { min: number; max: number }> = {
  official: { min: 0, max: 99 },
  community: { min: 100, max: 499 },
  user: { min: 500, max: 999 },
};

export function getPriorityRange(origin: DeviceKnowledgeModuleOrigin): { min: number; max: number } {
  return PRIORITY_RANGES[origin];
}

export function validateModulePriority(
  origin: DeviceKnowledgeModuleOrigin,
  priority: number,
): ValidationResult<number> {
  const range = getPriorityRange(origin);
  if (!Number.isInteger(priority) || priority < range.min || priority > range.max) {
    return validationFailed([
      {
        path: 'priority',
        code: 'invalid-priority-range',
        message: `${origin} priority must be between ${range.min} and ${range.max}`,
      },
    ]);
  }
  return validationOk(priority);
}

function specificityWeight(specificity: ModuleSpecificity): number {
  return specificity === 'platform' ? 0 : 1;
}

function sortCandidates(candidates: ModuleConflictCandidate[]): ModuleConflictCandidate[] {
  return [...candidates].sort((a, b) => {
    const specificityDiff = specificityWeight(a.specificity) - specificityWeight(b.specificity);
    if (specificityDiff !== 0) return specificityDiff;

    if (a.override !== b.override) return a.override ? -1 : 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return 0;
  });
}

export function resolveModuleConflict(
  candidates: ModuleConflictCandidate[],
): ValidationResult<ModuleConflictResolution> {
  const issues: ValidationIssue[] = [];
  if (candidates.length === 0) {
    return validationFailed([
      { path: '', code: 'empty-candidates', message: 'at least one candidate is required' },
    ]);
  }

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const priority = validateModulePriority(candidate.origin, candidate.priority);
    if (!priority.ok) issues.push(...priority.issues);

    const key = `${candidate.moduleId}:${candidate.targetId}`;
    if (seen.has(key)) {
      issues.push({
        path: key,
        code: 'duplicate-module-target',
        message: `duplicate module target candidate ${key}`,
      });
    }
    seen.add(key);
  }

  if (issues.length) return validationFailed(issues);

  const sorted = sortCandidates(candidates);
  const winner = sorted[0];
  const runnerUp = sorted[1];
  if (
    runnerUp &&
    specificityWeight(winner.specificity) === specificityWeight(runnerUp.specificity) &&
    Boolean(winner.override) === Boolean(runnerUp.override) &&
    winner.priority === runnerUp.priority
  ) {
    return validationFailed([
      {
        path: winner.targetId,
        code: 'ambiguous-conflict',
        message: `${winner.moduleId} and ${runnerUp.moduleId} have the same conflict rank`,
      },
    ]);
  }

  const hasOfficial = candidates.some((candidate) => candidate.origin === 'official');
  if (hasOfficial && winner.origin !== 'official' && !winner.override) {
    return validationFailed([
      {
        path: winner.moduleId,
        code: 'missing-explicit-override',
        message: `${winner.moduleId} must set override=true to override official knowledge`,
      },
    ]);
  }

  return validationOk({
    winner,
    rejected: sorted.slice(1),
    explanation: `${winner.moduleId} wins ${winner.targetId} by specificity=${winner.specificity}, override=${Boolean(
      winner.override,
    )}, priority=${winner.priority}`,
  });
}
