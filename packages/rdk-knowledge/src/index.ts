import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type CommandPattern,
  type DeviceKnowledgeModuleData,
  type DocIndexEntry,
  type EndorsedSkillRef,
  type FailureHint,
  type KnowledgeCompatibilityScope,
  type KnowledgeSourceType,
  type PromptFragment,
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

const RDK_SCOPE: KnowledgeCompatibilityScope = {
  platforms: ['rdk-x3', 'rdk-x5', 'rdk-ultra', 'rdk-s100', 'rdk-s100p'],
  boards: ['x3', 'x5', 'ultra', 's100', 's100p'],
  socs: ['bernoulli2', 'bayes', 'nash'],
};

const PLATFORM_BOARD_MAP: Record<string, string[]> = {
  'rdk-x3': ['x3'],
  'rdk-x5': ['x5'],
  'rdk-ultra': ['ultra'],
  'rdk-s100': ['s100'],
  'rdk-s100p': ['s100p'],
};
const PLATFORM_SOC_MAP: Record<string, string[]> = {
  'rdk-x3': ['bernoulli2'],
  'rdk-x5': ['bayes'],
  'rdk-ultra': ['bayes'],
  'rdk-s100': ['nash'],
  'rdk-s100p': ['nash'],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 10);
}

function inferSourceType(sourceUrl: string): KnowledgeSourceType {
  if (sourceUrl.includes('github.com/')) return 'github';
  if (sourceUrl.includes('/forum')) return 'forum';
  if (sourceUrl.includes('developer.d-robotics.cc/rdk_doc')) return 'official-doc';
  return 'community';
}

function enrichDoc(entry: typeof RDK_DOC_INDEX[number], index: number): DocIndexEntry {
  const sourceType = inferSourceType(entry.url);
  const specificPlatforms = entry.tags
    .filter((tag) => ['x3', 'x5', 'ultra', 's100', 's100p'].includes(tag))
    .map((tag) => `rdk-${tag}`);
  return {
    id: `rdk-doc-${entry.section}-${(slugify(entry.title || entry.url) || `entry-${index}`).slice(0, 56)}-${shortHash(entry.url)}`,
    title: entry.title,
    url: entry.url,
    sourceUrl: entry.url,
    sourceType,
    section: entry.section,
    tags: entry.tags,
    language: entry.url.includes('/en/') || entry.url.includes('github.com') ? 'en' : 'zh-CN',
    status: 'active',
    confidence: sourceType === 'official-doc' || sourceType === 'github' ? 'high' : 'medium',
    priority: 80,
    lastReviewedAt: '2026-05-28',
    citationLabel: `${entry.title} (${entry.section})`,
    source: {
      type: sourceType,
      url: entry.url,
      retrievedAt: '2026-05-28',
    },
    scope: (() => {
      const narrowedPlatforms = specificPlatforms.length ? [...new Set(specificPlatforms)] : (RDK_SCOPE.platforms ?? []);
      const narrowedBoards = [...new Set(narrowedPlatforms.flatMap(p => PLATFORM_BOARD_MAP[p] ?? []))];
      const narrowedSocs = [...new Set(narrowedPlatforms.flatMap(p => PLATFORM_SOC_MAP[p] ?? []))];
      return {
        ...RDK_SCOPE,
        platforms: narrowedPlatforms,
        boards: narrowedBoards.length ? narrowedBoards : RDK_SCOPE.boards,
        socs: narrowedSocs.length ? narrowedSocs : RDK_SCOPE.socs,
      };
    })(),
    chunkPolicy: {
      strategy: entry.section === 'toolchain' || entry.section === 'system' ? 'heading' : 'paragraph',
      maxTokens: 800,
      overlapTokens: 120,
    },
    metadataForEmbedding: ['title', 'section', 'tags', 'platforms'],
    metadataForPrompt: ['title', 'url', 'section', 'lastReviewedAt'],
  };
}

function enrichPromptFragment(entry: typeof RDK_PROMPT_FRAGMENTS[number]): PromptFragment {
  return {
    ...entry,
    source: {
      type: 'generated',
      repo: 'device-knowledge/packages/rdk-knowledge',
      retrievedAt: '2026-05-28',
    },
    scope: RDK_SCOPE,
    tags: ['prompt', entry.section, entry.tier, entry.mode],
    language: 'zh-CN',
    status: 'active',
    confidence: 'high',
    lastReviewedAt: '2026-05-28',
    citationLabel: `RDK prompt fragment: ${entry.id}`,
  };
}

function enrichCommandPattern(entry: typeof RDK_COMMAND_PATTERNS[number]): CommandPattern {
  return {
    ...entry,
    id: `rdk-command-${entry.category}-${slugify(entry.description)}`,
    pattern: serializeRegex(entry.pattern),
    source: {
      type: 'generated',
      repo: 'device-knowledge/packages/rdk-knowledge',
      retrievedAt: '2026-05-28',
    },
    scope: RDK_SCOPE,
    tags: ['command', entry.category, entry.riskLevel],
    language: 'en',
    status: 'active',
    confidence: 'high',
    lastReviewedAt: '2026-05-28',
    citationLabel: `RDK command pattern: ${entry.description}`,
  };
}

function enrichFailureHint(entry: typeof RDK_FAILURE_HINTS[number], index: number): FailureHint {
  return {
    ...entry,
    id: `rdk-failure-${index}-${slugify(entry.suggestion)}`,
    errorPattern: serializeRegex(entry.errorPattern),
    source: {
      type: entry.docUrl ? inferSourceType(entry.docUrl) : 'generated',
      ...(entry.docUrl ? { url: entry.docUrl } : { repo: 'device-knowledge/packages/rdk-knowledge' }),
      retrievedAt: '2026-05-28',
    },
    scope: RDK_SCOPE,
    tags: ['failure-hint'],
    language: 'zh-CN',
    status: 'active',
    confidence: entry.docUrl ? 'high' : 'medium',
    lastReviewedAt: '2026-05-28',
    citationLabel: `RDK failure hint ${index + 1}`,
  };
}

function enrichSkill(entry: typeof RDK_ENDORSED_SKILLS[number]): EndorsedSkillRef {
  return {
    ...entry,
    platforms: entry.platforms ? [...entry.platforms] : undefined,
    source: {
      type: 'generated',
      repo: 'device-knowledge/packages/rdk-knowledge',
      retrievedAt: '2026-05-28',
    },
    scope: {
      platforms: entry.platforms ? [...entry.platforms] : RDK_SCOPE.platforms,
    },
    tags: ['skill', entry.category ?? 'general'],
    language: 'en',
    status: 'active',
    confidence: 'high',
    lastReviewedAt: '2026-05-28',
    citationLabel: `RDK endorsed skill: ${entry.id}`,
  };
}

export const rdkKnowledgeModuleData: DeviceKnowledgeModuleData & { ecosystemText: string } = {
  manifest: {
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'rdk',
    name: 'RDK Development Kit',
    version: '0.1.4',
    origin: 'official',
    family: 'rdk',
    priority: 0,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
      minRdkStudio: '1.2.1',
    },
  },
  profiles: getRdkDeviceProfiles(),
  docs: RDK_DOC_INDEX.map(enrichDoc),
  promptFragments: RDK_PROMPT_FRAGMENTS.map(enrichPromptFragment),
  commandPatterns: RDK_COMMAND_PATTERNS.map(enrichCommandPattern),
  failureHints: RDK_FAILURE_HINTS.map(enrichFailureHint),
  skills: RDK_ENDORSED_SKILLS.map(enrichSkill),
  ecosystemText: RDK_ECOSYSTEM_TEXT,
};
