import type { DeviceKnowledgeModuleData } from '@device-knowledge/core';
import type { DeviceFamily } from '@rdk-moss/core/contracts/device-family';
import type { KnowledgeModule } from '@rdk-moss/core/contracts/knowledge-module';

import { convertDkPriorityToMoss } from './priority-convert.js';
import {
  normalizeCommandPatterns,
  normalizeDeviceProfiles,
  normalizeDocIndex,
  normalizeFailureHints,
  normalizePromptFragments,
  normalizeSkills,
} from './compatibility.js';

export interface ToKnowledgeModuleOptions {
  /**
   * Module version override. If provided, takes precedence over manifest.version.
   * If omitted, uses manifest.version (required field in core schema).
   */
  version?: string;

  /**
   * Ecosystem text override. If provided, takes precedence over data.ecosystemText.
   */
  ecosystemText?: string;

  /**
   * Research seed generator. Not part of the device-knowledge schema;
   * provided by the host or a data package.
   */
  getResearchSeeds?: (platform: string) => string[];

  /**
   * Explicit platform list. If omitted, derived from profile keys.
   */
  platforms?: string[];

  /**
   * Module description. If omitted, uses manifest.name.
   */
  description?: string;

  /**
   * Dependency list for the Moss module.
   */
  dependencies?: string[];
}

export function toKnowledgeModule(
  data: DeviceKnowledgeModuleData,
  options: ToKnowledgeModuleOptions = {},
): KnowledgeModule {
  const { manifest } = data;

  // Priority conversion: device-knowledge (lower wins) → Moss (higher wins)
  const platformClaimPriority = convertDkPriorityToMoss(manifest.priority);

  // Version: options.version > manifest.version (core schema required field)
  // Do NOT fallback to compatibility.dmossKnowledgeModule (that's the Moss contract range)
  const version = options.version ?? manifest.version;

  const description = options.description ?? manifest.name;

  const profiles = normalizeDeviceProfiles(data.profiles);
  const platforms = options.platforms ?? Object.keys(profiles);

  // Ecosystem text: options > data.ecosystemText > ''
  const ecosystemText =
    options.ecosystemText ??
    ((data as unknown as Record<string, unknown>).ecosystemText as string | undefined) ??
    '';

  const docs = normalizeDocIndex(data.docs);
  const promptFragments = normalizePromptFragments(data.promptFragments);
  const commandPatterns = normalizeCommandPatterns(data.commandPatterns);
  const failureHints = normalizeFailureHints(data.failureHints);
  const skills = normalizeSkills(data.skills);

  const module: KnowledgeModule = {
    id: manifest.id,
    name: manifest.name,
    version,
    description,
    platforms,
    platformClaimPriority,
    family: manifest.family as DeviceFamily | undefined,
    dependencies: options.dependencies,
    getDeviceProfiles: () => profiles,
    getDocIndex: () => docs,
    getPromptFragments: () => promptFragments,
    getCommandPatterns: () => commandPatterns,
    getFailureHints: () => failureHints,
    getEcosystemPrompt: () => ecosystemText,
  };

  if (options.getResearchSeeds) {
    module.getResearchSeeds = options.getResearchSeeds;
  }
  if (skills.length > 0) {
    module.getSkills = () => skills;
  }

  return module;
}
