import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  validateDeviceKnowledgeModule,
  validateManifest,
} from '../dist/index.js';

test('validateManifest accepts a minimal official module manifest', () => {
  const result = validateManifest({
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'rdk',
    name: 'RDK Development Kit',
    version: '0.1.0',
    origin: 'official',
    priority: 0,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
      minRdkStudio: '0.1.0',
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, 'rdk');
  assert.equal(result.value.version, '0.1.0');
  assert.equal(result.value.origin, 'official');
});

test('validateManifest rejects unknown schema versions', () => {
  const result = validateManifest({
    schemaVersion: 'device-knowledge.module.v0',
    id: 'rdk',
    name: 'RDK Development Kit',
    version: '0.1.0',
    origin: 'official',
    priority: 0,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-schema-version');
});

test('validateManifest rejects priority outside origin range', () => {
  const result = validateManifest({
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'community-rdk',
    name: 'Community RDK',
    version: '0.1.0',
    origin: 'community',
    priority: 50,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.code === 'invalid-priority-range'), true);
});

test('validateDeviceKnowledgeModule accepts serializable data arrays', () => {
  const result = validateDeviceKnowledgeModule({
    manifest: {
      schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
      id: 'rdk',
      name: 'RDK Development Kit',
      version: '0.1.0',
      origin: 'official',
      priority: 0,
      compatibility: {
        dmossKnowledgeModule: '^0.3.1',
      },
    },
    profiles: {},
    docs: [
      {
        id: 'rdk-doc-quickstart-x5',
        title: 'RDK X5 快速上手',
        url: 'https://developer.d-robotics.cc/rdk_doc/Quick_start/hardware_introduction/rdk_x5',
        section: 'getting-started',
        tags: ['x5', 'quick-start'],
        source: {
          type: 'official-doc',
          url: 'https://developer.d-robotics.cc/rdk_doc/Quick_start/hardware_introduction/rdk_x5',
          retrievedAt: '2026-05-25',
        },
        scope: {
          platforms: ['rdk-x5'],
          rdkVersions: ['3.x'],
        },
        language: 'zh-CN',
        status: 'active',
        confidence: 'high',
        lastReviewedAt: '2026-05-25',
        citationLabel: 'RDK X5 快速上手',
        chunkPolicy: {
          strategy: 'heading',
          maxTokens: 800,
          overlapTokens: 120,
        },
      },
    ],
    promptFragments: [
      {
        id: 'rdk-board-awareness',
        section: 'reasoning',
        tier: 'all',
        mode: 'all',
        content: '确认板型后再执行。',
        priority: 90,
        source: { type: 'generated', repo: 'device-knowledge' },
        status: 'active',
      },
    ],
    commandPatterns: [
      {
        id: 'rdk-command-socinfo',
        pattern: { source: 'cat\\s+/sys/class/socinfo', flags: 'i' },
        category: 'diagnostics',
        description: 'Read SoC identification',
        riskLevel: 'safe',
        source: { type: 'generated', repo: 'device-knowledge' },
      },
    ],
    failureHints: [
      {
        id: 'rdk-failure-camera-timeout',
        errorPattern: { source: 'camera.*timeout', flags: 'i' },
        suggestion: '降低分辨率并重试。',
        source: { type: 'generated', repo: 'device-knowledge' },
      },
    ],
    skills: [
      {
        id: 'rdk-hardware',
        category: 'hardware',
        platforms: ['rdk-x5'],
        source: { type: 'generated', repo: 'device-knowledge' },
      },
    ],
    ecosystemText: 'offline ecosystem prompt',
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.docs[0].source.type, 'official-doc');
  assert.deepEqual(result.value.docs[0].scope.platforms, ['rdk-x5']);
  assert.equal(result.value.commandPatterns[0].pattern.source, 'cat\\s+/sys/class/socinfo');
  assert.equal(result.value.ecosystemText, 'offline ecosystem prompt');
});

test('validateDeviceKnowledgeModule rejects records without provenance', () => {
  const result = validateDeviceKnowledgeModule({
    manifest: {
      schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
      id: 'rdk',
      name: 'RDK Development Kit',
      version: '0.1.0',
      origin: 'official',
      priority: 0,
      compatibility: {
        dmossKnowledgeModule: '^0.3.1',
      },
    },
    docs: [
      {
        id: 'rdk-doc-missing-source',
        title: 'Doc',
        url: 'https://developer.d-robotics.cc/rdk_doc',
        section: 'getting-started',
        tags: [],
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.path === 'docs.0.source'), true);
});

test('validateDeviceKnowledgeModule rejects invalid command regex', () => {
  const result = validateDeviceKnowledgeModule({
    manifest: {
      schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
      id: 'rdk',
      name: 'RDK Development Kit',
      version: '0.1.0',
      origin: 'official',
      priority: 0,
      compatibility: {
        dmossKnowledgeModule: '^0.3.1',
      },
    },
    commandPatterns: [
      {
        id: 'bad-command',
        pattern: { source: '(', flags: 'i' },
        category: 'diagnostics',
        description: 'bad regex',
        riskLevel: 'safe',
        source: { type: 'generated', repo: 'device-knowledge' },
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.path.startsWith('commandPatterns.0.pattern')), true);
});

test('validateDeviceKnowledgeModule rejects non-string ecosystemText', () => {
  const result = validateDeviceKnowledgeModule({
    manifest: {
      schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
      id: 'rdk',
      name: 'RDK Development Kit',
      version: '0.1.0',
      origin: 'official',
      priority: 0,
      compatibility: {
        dmossKnowledgeModule: '^0.3.1',
      },
    },
    ecosystemText: 123,
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.path === 'ecosystemText'), true);
});

test('validateDeviceKnowledgeModule rejects missing manifest', () => {
  const result = validateDeviceKnowledgeModule({
    profiles: {},
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.path === 'manifest'), true);
});

test('validateManifest rejects missing version', () => {
  const result = validateManifest({
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'rdk',
    name: 'RDK Development Kit',
    origin: 'official',
    priority: 0,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.path === 'version'), true);
});
