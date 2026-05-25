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
    docs: [],
    promptFragments: [],
    commandPatterns: [],
    failureHints: [],
    skills: [],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.docs, []);
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
