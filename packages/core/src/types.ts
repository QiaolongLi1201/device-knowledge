export const DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION_V1 = 'device-knowledge.module.v1';
export const DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION = 'device-knowledge.module.v2';
export type DeviceKnowledgeModuleSchemaVersion =
  | typeof DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION_V1
  | typeof DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION;

export type DeviceKnowledgeModuleOrigin = 'official' | 'community' | 'user';

export interface DeviceKnowledgeModuleManifest {
  schemaVersion: DeviceKnowledgeModuleSchemaVersion;
  id: string;
  name: string;
  version: string;
  origin: DeviceKnowledgeModuleOrigin;
  family?: string;
  priority: number;
  compatibility: {
    dmossKnowledgeModule: string;
    minRdkStudio?: string;
  };
}

export interface SerializedRegex {
  source: string;
  flags?: string;
}

export type KnowledgeSourceType = 'official-doc' | 'github' | 'forum' | 'community' | 'local' | 'generated';
export type KnowledgeRecordStatus = 'active' | 'deprecated' | 'draft';
export type KnowledgeConfidence = 'high' | 'medium' | 'low';
export type CommandRiskLevel = 'safe' | 'moderate' | 'dangerous';

export interface KnowledgeSourceRef {
  type: KnowledgeSourceType;
  url?: string;
  repo?: string;
  commit?: string;
  documentVersion?: string;
  retrievedAt?: string;
}

export interface KnowledgeCompatibilityScope {
  platforms?: string[];
  boards?: string[];
  socs?: string[];
  rdkVersions?: string[];
  osVersions?: string[];
  toolchains?: string[];
}

export interface KnowledgeChunkPolicy {
  strategy: 'none' | 'heading' | 'paragraph' | 'qa' | 'command' | 'release-note';
  maxTokens?: number;
  overlapTokens?: number;
}

export interface KnowledgeRecordBase {
  id: string;
  source: KnowledgeSourceRef;
  scope?: KnowledgeCompatibilityScope;
  tags?: string[];
  language?: string;
  status?: KnowledgeRecordStatus;
  confidence?: KnowledgeConfidence;
  priority?: number;
  lastReviewedAt?: string;
  validFrom?: string;
  validTo?: string;
  supersedes?: string[];
  citationLabel?: string;
}

export interface DocIndexEntry extends KnowledgeRecordBase {
  title: string;
  url: string;
  sourceUrl?: string;
  sourceType?: KnowledgeSourceType;
  section: string;
  sectionPath?: string[];
  anchors?: string[];
  pageHint?: string;
  chunkPolicy?: KnowledgeChunkPolicy;
  parentId?: string;
  prevId?: string;
  nextId?: string;
  metadataForEmbedding?: string[];
  metadataForPrompt?: string[];
}

export interface PromptFragment extends KnowledgeRecordBase {
  section: string;
  tier: string;
  mode: string;
  content: string;
  priority: number;
}

export interface CommandPattern extends KnowledgeRecordBase {
  pattern: SerializedRegex;
  category: string;
  description: string;
  riskLevel: CommandRiskLevel;
}

export interface FailureHint extends KnowledgeRecordBase {
  errorPattern: SerializedRegex;
  suggestion: string;
  docUrl?: string;
}

export interface EndorsedSkillRef extends KnowledgeRecordBase {
  category?: string;
  platforms?: string[];
  priority?: number;
}

export interface DeviceKnowledgeModuleData {
  manifest: DeviceKnowledgeModuleManifest;
  profiles?: Record<string, unknown>;
  docs?: DocIndexEntry[];
  promptFragments?: PromptFragment[];
  commandPatterns?: CommandPattern[];
  failureHints?: FailureHint[];
  skills?: EndorsedSkillRef[];
  ecosystemText?: string;
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T; issues: [] }
  | { ok: false; issues: ValidationIssue[] };

export function validationOk<T>(value: T): ValidationResult<T> {
  return { ok: true, value, issues: [] };
}

export function validationFailed<T = never>(issues: ValidationIssue[]): ValidationResult<T> {
  return { ok: false, issues };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
