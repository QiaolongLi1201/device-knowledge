export {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
  type DeviceKnowledgeModuleManifest,
  type DeviceKnowledgeModuleOrigin,
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
