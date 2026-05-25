import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
  type SerializedRegex,
} from '@device-knowledge/core';

import { RDK_COMMAND_PATTERNS } from './command-patterns.js';
import { RDK_DOC_INDEX } from './doc-index.js';
import { RDK_FAILURE_HINTS } from './failure-hints.js';
import { RDK_PROMPT_FRAGMENTS } from './prompt-fragments.js';
import { getRdkDeviceProfiles, getRdkResearchSeeds } from './rdk-device-profiles.js';
import { RDK_ENDORSED_SKILLS } from './rdk-endorsed-skills.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadMarkdownAsset(filename: string): string {
  try {
    return readFileSync(join(__dirname, filename), 'utf8').trim();
  } catch {
    return '';
  }
}

function serializeRegex(regex: RegExp): SerializedRegex {
  return { source: regex.source, flags: regex.flags };
}

function buildEcosystemText(): string {
  const base = [
    '## RDK 产品生态',
    '- **D-Robotics**：RDK 开发者套件的制造商',
    '- **RDK Studio**：AI Native 开发工作台',
    '- **RDK 文档**：developer.d-robotics.cc/rdk_doc',
    '- **D-Robotics 开发者社区**：developer.d-robotics.cc/forum',
    '- **NodeHub**：developer.d-robotics.cc/en/nodehub — RDK 应用中心',
  ].join('\n');

  const hardwareKnowledge = loadMarkdownAsset('hardware-knowledge.md');
  return hardwareKnowledge ? `${base}\n\n${hardwareKnowledge}` : base;
}

export const RDK_ECOSYSTEM_TEXT = buildEcosystemText();

export { getRdkResearchSeeds } from './rdk-device-profiles.js';

export const rdkKnowledgeModuleData: DeviceKnowledgeModuleData & { ecosystemText: string } = {
  manifest: {
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'rdk',
    name: 'RDK Development Kit',
    version: '0.1.2',
    origin: 'official',
    family: 'rdk',
    priority: 0,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
      minRdkStudio: '0.1.0',
    },
  },
  profiles: getRdkDeviceProfiles(),
  docs: RDK_DOC_INDEX,
  promptFragments: RDK_PROMPT_FRAGMENTS,
  commandPatterns: RDK_COMMAND_PATTERNS.map((entry) => ({
    ...entry,
    pattern: serializeRegex(entry.pattern),
  })),
  failureHints: RDK_FAILURE_HINTS.map((entry) => ({
    ...entry,
    errorPattern: serializeRegex(entry.errorPattern),
  })),
  skills: [...RDK_ENDORSED_SKILLS],
  ecosystemText: RDK_ECOSYSTEM_TEXT,
};
