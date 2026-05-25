export {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type CommandPattern,
  type CommandRiskLevel,
  type DeviceKnowledgeModuleData,
  type DeviceKnowledgeModuleManifest,
  type DeviceKnowledgeModuleOrigin,
  type DocIndexEntry,
  type EndorsedSkillRef,
  type FailureHint,
  type KnowledgeChunkPolicy,
  type KnowledgeCompatibilityScope,
  type KnowledgeConfidence,
  type KnowledgeRecordBase,
  type KnowledgeRecordStatus,
  type KnowledgeSourceRef,
  type KnowledgeSourceType,
  type PromptFragment,
  type SerializedRegex,
  type ValidationIssue,
  type ValidationResult,
} from './types.js';

export {
  validateDeviceKnowledgeModule,
  validateManifest,
} from './validation.js';

export {
  compileSerializedRegex,
  serializedRegexFromLegacyRobotHubPattern,
  validateSerializedRegex,
} from './regex.js';

export {
  getPriorityRange,
  resolveModuleConflict,
  validateModulePriority,
  type ModuleConflictCandidate,
  type ModuleConflictResolution,
  type ModuleSpecificity,
} from './priority.js';
