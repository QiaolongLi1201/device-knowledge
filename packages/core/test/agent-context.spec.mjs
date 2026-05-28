import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  buildAgentKnowledgeContext,
} from '../dist/index.js';

const baseSource = {
  type: 'official-doc',
  url: 'https://example.com/doc',
  retrievedAt: '2026-05-28',
};

const moduleData = {
  manifest: {
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'agent-context-test',
    name: 'Agent Context Test',
    version: '1.0.0',
    origin: 'official',
    family: 'rdk',
    priority: 0,
    compatibility: { dmossKnowledgeModule: '^0.3.1' },
  },
  profiles: {
    'rdk-x5': { platform: 'rdk-x5', displayName: 'RDK X5', computeTops: 10, soc: 'Sunrise 5' },
    'rdk-s100p': { platform: 'rdk-s100p', displayName: 'RDK S100P', computeTops: 128, soc: 'S100P' },
  },
  docs: [
    {
      id: 'doc-x5',
      title: 'X5 setup',
      url: 'https://example.com/x5',
      section: 'getting-started',
      source: baseSource,
      citationLabel: 'X5 official',
      status: 'active',
      scope: { platforms: ['rdk-x5'] },
    },
    {
      id: 'doc-s100p',
      title: 'S100P setup',
      url: 'https://example.com/s100p',
      section: 'getting-started',
      source: baseSource,
      status: 'active',
      scope: { platforms: ['rdk-s100p'] },
    },
    {
      id: 'doc-draft',
      title: 'Draft',
      url: 'https://example.com/draft',
      section: 'getting-started',
      source: baseSource,
      status: 'draft',
    },
    {
      id: 'doc-deprecated',
      title: 'Deprecated',
      url: 'https://example.com/deprecated',
      section: 'getting-started',
      source: baseSource,
      status: 'deprecated',
    },
  ],
  promptFragments: [
    {
      id: 'prompt-low',
      section: 'setup',
      tier: 'all',
      mode: 'all',
      content: 'low priority',
      priority: 1,
      source: baseSource,
      status: 'active',
    },
    {
      id: 'prompt-high',
      section: 'setup',
      tier: 'all',
      mode: 'all',
      content: 'high priority',
      priority: 10,
      source: baseSource,
      status: 'active',
    },
  ],
  commandPatterns: [
    {
      id: 'command-sudo',
      pattern: { source: 'sudo\\\\s+apt', flags: 'i' },
      category: 'package-management',
      description: 'APT commands may modify the device image',
      riskLevel: 'moderate',
      source: baseSource,
      status: 'active',
      scope: { platforms: ['rdk-x5'] },
    },
    {
      id: 'command-deprecated',
      pattern: { source: 'old-command' },
      category: 'legacy',
      description: 'Deprecated command pattern',
      riskLevel: 'dangerous',
      source: baseSource,
      status: 'deprecated',
    },
  ],
};

test('buildAgentKnowledgeContext filters profiles and scoped records for one platform', () => {
  const context = buildAgentKnowledgeContext(moduleData, { platform: 'rdk-x5' });

  assert.deepEqual(Object.keys(context.profiles), ['rdk-x5']);
  assert.deepEqual(context.docs.map((doc) => doc.id), ['doc-x5']);
  assert.deepEqual(context.promptFragments.map((fragment) => fragment.id), ['prompt-high', 'prompt-low']);
  assert.deepEqual(context.commandPatterns.map((command) => command.id), ['command-sudo']);
  assert.match(context.markdown, /RDK X5/);
  assert.match(context.markdown, /X5 official/);
  assert.match(context.markdown, /APT commands may modify/);
  assert.doesNotMatch(context.markdown, /S100P setup/);
  assert.doesNotMatch(context.markdown, /Draft/);
  assert.doesNotMatch(context.markdown, /Deprecated/);
});

test('buildAgentKnowledgeContext normalizes platform ids and does not leak all profiles', () => {
  const context = buildAgentKnowledgeContext(moduleData, { platform: ' RDK-X5 ' });

  assert.deepEqual(Object.keys(context.profiles), ['rdk-x5']);
  assert.deepEqual(context.docs.map((doc) => doc.id), ['doc-x5']);
});

test('buildAgentKnowledgeContext returns no profile for unknown concrete platform', () => {
  const context = buildAgentKnowledgeContext(moduleData, { platform: 'rdk-unknown' });

  assert.deepEqual(Object.keys(context.profiles), []);
  assert.deepEqual(context.docs, []);
});

test('buildAgentKnowledgeContext can include drafts and limit docs for neutral agents', () => {
  const context = buildAgentKnowledgeContext(moduleData, { includeDrafts: true, maxDocs: 2 });

  assert.equal(context.docs.length, 2);
  assert.deepEqual(Object.keys(context.profiles).sort(), ['rdk-s100p', 'rdk-x5']);
});

test('buildAgentKnowledgeContext can explicitly include deprecated records', () => {
  const context = buildAgentKnowledgeContext(moduleData, { includeDeprecated: true });

  assert.match(context.markdown, /Deprecated/);
  assert.match(context.markdown, /Deprecated command pattern/);
});
