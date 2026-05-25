import type { SerializedRegex } from '@device-knowledge/core';
import { compileSerializedRegex } from '@device-knowledge/core';
import type {
  CommandPattern,
  DeviceProfileBase,
  DocIndexEntry,
  EndorsedSkillRef,
  FailureHint,
  PromptFragment,
} from '@dmoss/core/contracts/knowledge-module';

export type {
  CommandPattern, DeviceProfileBase, DocIndexEntry, EndorsedSkillRef,
  FailureHint, KnowledgeModule, PromptFragment,
} from '@dmoss/core/contracts/knowledge-module';

export function normalizeRegex(input: string | SerializedRegex): RegExp {
  if (typeof input === 'string') return new RegExp(input, 'i');
  return compileSerializedRegex(input);
}

interface RawCommandPattern {
  pattern: string | SerializedRegex;
  category: string;
  description: string;
  riskLevel: 'safe' | 'moderate' | 'dangerous';
}

export function normalizeCommandPattern(raw: RawCommandPattern): CommandPattern {
  return {
    pattern: normalizeRegex(raw.pattern),
    category: raw.category,
    description: raw.description,
    riskLevel: raw.riskLevel,
  };
}

interface RawFailureHint {
  errorPattern: string | SerializedRegex;
  suggestion: string;
  docUrl?: string;
}

export function normalizeFailureHint(raw: RawFailureHint): FailureHint {
  return {
    errorPattern: normalizeRegex(raw.errorPattern),
    suggestion: raw.suggestion,
    ...(raw.docUrl !== undefined ? { docUrl: raw.docUrl } : {}),
  };
}

const VALID_RISK_LEVELS = new Set(['safe', 'moderate', 'dangerous']);

export function normalizeCommandPatterns(raw: unknown[] | undefined): CommandPattern[] {
  if (!raw || !Array.isArray(raw)) return [];
  const results: CommandPattern[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    if (
      typeof entry === 'object' && entry !== null &&
      'pattern' in entry &&
      typeof e.category === 'string' &&
      typeof e.description === 'string' &&
      typeof e.riskLevel === 'string' &&
      VALID_RISK_LEVELS.has(e.riskLevel)
    ) {
      results.push(normalizeCommandPattern(entry as RawCommandPattern));
    }
  }
  return results;
}

export function normalizeFailureHints(raw: unknown[] | undefined): FailureHint[] {
  if (!raw || !Array.isArray(raw)) return [];
  const results: FailureHint[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    if (
      typeof entry === 'object' && entry !== null &&
      'errorPattern' in entry &&
      typeof e.suggestion === 'string'
    ) {
      results.push(normalizeFailureHint(entry as RawFailureHint));
    }
  }
  return results;
}

export function normalizePromptFragments(raw: unknown[] | undefined): PromptFragment[] {
  if (!raw || !Array.isArray(raw)) return [];
  const results: PromptFragment[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    if (
      typeof entry === 'object' && entry !== null &&
      'id' in entry && 'section' in entry && 'content' in entry &&
      typeof e.priority === 'number' && Number.isFinite(e.priority)
    ) {
      results.push({
        id: String(e.id),
        section: e.section as PromptFragment['section'],
        tier: (e.tier as PromptFragment['tier']) ?? 'all',
        mode: (e.mode as PromptFragment['mode']) ?? 'all',
        content: String(e.content),
        priority: e.priority,
      });
    }
  }
  return results;
}

export function normalizeDocIndex(raw: unknown[] | undefined): DocIndexEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  const results: DocIndexEntry[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    if (typeof entry === 'object' && entry !== null && 'title' in entry && 'url' in entry) {
      results.push({
        title: String(e.title),
        url: String(e.url),
        section: typeof e.section === 'string' ? e.section : '',
        tags: Array.isArray(e.tags) ? e.tags.map(String) : [],
      });
    }
  }
  return results;
}

export function normalizeDeviceProfiles(
  raw: Record<string, unknown> | undefined,
): Record<string, DeviceProfileBase> {
  if (!raw) return {};
  return raw as Record<string, DeviceProfileBase>;
}

export function normalizeSkills(raw: unknown[] | undefined): EndorsedSkillRef[] {
  if (!raw || !Array.isArray(raw)) return [];
  const results: EndorsedSkillRef[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    if (typeof entry === 'object' && entry !== null && 'id' in entry) {
      results.push({
        id: String(e.id),
        ...(typeof e.category === 'string' ? { category: e.category } : {}),
        ...(Array.isArray(e.platforms) ? { platforms: e.platforms.map(String) } : {}),
        ...(typeof e.priority === 'number' ? { priority: e.priority } : {}),
      });
    }
  }
  return results;
}
