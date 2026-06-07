import type { SerializedRegex } from '@device-knowledge/core';
import { compileSerializedRegex } from '@device-knowledge/core';
import type {
  CommandPattern,
  DeviceProfileBase,
  DocIndexEntry,
  EndorsedSkillRef,
  FailureHint,
  KnowledgeRecordMetadata,
  PromptFragment,
} from '@rdk-moss/core/contracts/knowledge-module';

export type {
  CommandPattern, DeviceProfileBase, DocIndexEntry, EndorsedSkillRef,
  FailureHint, KnowledgeModule, KnowledgeRecordMetadata, PromptFragment,
} from '@rdk-moss/core/contracts/knowledge-module';

function metadataFrom(raw: Record<string, unknown>, extra: Partial<KnowledgeRecordMetadata> = {}): KnowledgeRecordMetadata | undefined {
  if (typeof raw.id !== 'string') return undefined;
  return {
    id: raw.id,
    ...(raw.source && typeof raw.source === 'object' ? { source: raw.source as KnowledgeRecordMetadata['source'] } : {}),
    ...(raw.scope && typeof raw.scope === 'object' ? { scope: raw.scope as KnowledgeRecordMetadata['scope'] } : {}),
    ...(typeof raw.status === 'string' ? { status: raw.status } : {}),
    ...(typeof raw.confidence === 'string' ? { confidence: raw.confidence } : {}),
    ...(typeof raw.priority === 'number' ? { priority: raw.priority } : {}),
    ...(typeof raw.lastReviewedAt === 'string' ? { lastReviewedAt: raw.lastReviewedAt } : {}),
    ...(typeof raw.validFrom === 'string' ? { validFrom: raw.validFrom } : {}),
    ...(typeof raw.validTo === 'string' ? { validTo: raw.validTo } : {}),
    ...(Array.isArray(raw.supersedes) ? { supersedes: raw.supersedes.map(String) } : {}),
    ...(typeof raw.citationLabel === 'string' ? { citationLabel: raw.citationLabel } : {}),
    ...extra,
  };
}

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
  const metadata = metadataFrom(raw as unknown as Record<string, unknown>);
  return {
    pattern: normalizeRegex(raw.pattern),
    category: raw.category,
    description: raw.description,
    riskLevel: raw.riskLevel,
    ...(metadata ? { metadata } : {}),
  };
}

interface RawFailureHint {
  errorPattern: string | SerializedRegex;
  suggestion: string;
  docUrl?: string;
}

export function normalizeFailureHint(raw: RawFailureHint): FailureHint {
  const metadata = metadataFrom(raw as unknown as Record<string, unknown>);
  return {
    errorPattern: normalizeRegex(raw.errorPattern),
    suggestion: raw.suggestion,
    ...(raw.docUrl !== undefined ? { docUrl: raw.docUrl } : {}),
    ...(metadata ? { metadata } : {}),
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
      try {
        results.push(normalizeCommandPattern(entry as RawCommandPattern));
      } catch (err) {
        console.warn(`[dmoss-adapter] skipping invalid command pattern: ${err instanceof Error ? err.message : String(err)}`);
      }
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
      try {
        results.push(normalizeFailureHint(entry as RawFailureHint));
      } catch (err) {
        console.warn(`[dmoss-adapter] skipping invalid failure hint: ${err instanceof Error ? err.message : String(err)}`);
      }
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
      'id' in entry && 'section' in entry &&
      typeof e.content === 'string' && e.content.trim() &&
      typeof e.priority === 'number' && Number.isFinite(e.priority)
    ) {
      const metadata = metadataFrom(e);
      results.push({
        id: String(e.id),
        section: e.section as PromptFragment['section'],
        tier: (e.tier as PromptFragment['tier']) ?? 'all',
        mode: (e.mode as PromptFragment['mode']) ?? 'all',
        content: e.content as string,
        priority: e.priority,
        ...(metadata ? { metadata } : {}),
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
      const metadata = metadataFrom(e, e.chunkPolicy && typeof e.chunkPolicy === 'object'
        ? { chunkPolicy: e.chunkPolicy as KnowledgeRecordMetadata['chunkPolicy'] }
        : {});
      results.push({
        title: String(e.title),
        url: String(e.url),
        section: typeof e.section === 'string' ? e.section : '',
        tags: Array.isArray(e.tags) ? e.tags.map(String) : [],
        ...(metadata ? { metadata } : {}),
      });
    }
  }
  return results;
}

export function normalizeDeviceProfiles(
  raw: Record<string, unknown> | undefined,
): Record<string, DeviceProfileBase> {
  if (!raw) return {};
  const result: Record<string, DeviceProfileBase> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'object' || value === null) {
      console.warn(`[dmoss-adapter] profile "${key}" is not an object, skipping`);
      continue;
    }
    const profile = value as Record<string, unknown>;
    if (typeof profile.platform !== 'string' || !profile.platform.trim()) {
      console.warn(`[dmoss-adapter] profile "${key}" missing platform, skipping`);
      continue;
    }
    result[key] = value as DeviceProfileBase;
  }
  return result;
}

export function normalizeSkills(raw: unknown[] | undefined): EndorsedSkillRef[] {
  if (!raw || !Array.isArray(raw)) return [];
  const results: EndorsedSkillRef[] = [];
  for (const entry of raw) {
    const e = entry as Record<string, unknown>;
    if (typeof entry === 'object' && entry !== null && 'id' in entry) {
      const metadata = metadataFrom(e);
      results.push({
        id: String(e.id),
        ...(typeof e.category === 'string' ? { category: e.category } : {}),
        ...(Array.isArray(e.platforms) ? { platforms: e.platforms.map(String) } : {}),
        ...(typeof e.priority === 'number' ? { priority: e.priority } : {}),
        ...(metadata ? { metadata } : {}),
      });
    }
  }
  return results;
}
