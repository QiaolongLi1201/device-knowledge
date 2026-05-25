import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertDkPriorityToMoss, normalizeCommandPatterns, normalizeFailureHints,
  normalizePromptFragments, normalizeDocIndex, normalizeSkills,
  normalizeRegex, toKnowledgeModule,
} from '../dist/index.js';

// ── Priority conversion ──
test('priority: official 0 → 999', () => assert.equal(convertDkPriorityToMoss(0), 999));
test('priority: official 99 → 900', () => assert.equal(convertDkPriorityToMoss(99), 900));
test('priority: community 100 → 899', () => assert.equal(convertDkPriorityToMoss(100), 899));
test('priority: community 499 → 500', () => assert.equal(convertDkPriorityToMoss(499), 500));
test('priority: user 500 → 499', () => assert.equal(convertDkPriorityToMoss(500), 499));
test('priority: user 999 → 0', () => assert.equal(convertDkPriorityToMoss(999), 0));
test('priority: strict ordering across origins', () => {
  const p = [0, 99, 100, 499, 500, 999].map(convertDkPriorityToMoss);
  for (let i = 0; i < p.length - 1; i++) assert.ok(p[i] > p[i + 1]);
});
test('priority: rejects non-integer', () => assert.throws(() => convertDkPriorityToMoss(1.5)));
test('priority: rejects out-of-range', () => {
  assert.throws(() => convertDkPriorityToMoss(-1));
  assert.throws(() => convertDkPriorityToMoss(1000));
});

// ── Regex ──
test('regex: SerializedRegex with flags', () => {
  const re = normalizeRegex({ source: 'test.*', flags: 'gi' });
  assert.ok(re instanceof RegExp); assert.ok(re.flags.includes('g'));
});
test('regex: legacy string gets case-insensitive', () => {
  const re = normalizeRegex('error.*pattern');
  assert.ok(re.flags.includes('i'));
});
test('regex: throws on invalid legacy string', () => {
  assert.throws(() => normalizeRegex('[invalid('));
});

// ── Command patterns ──
test('cmd: SerializedRegex → RegExp', () => {
  const r = normalizeCommandPatterns([{ pattern: { source: '^rm', flags: 'i' }, category: 'fs', description: 'remove', riskLevel: 'dangerous' }]);
  assert.equal(r.length, 1); assert.ok(r[0].pattern instanceof RegExp);
});
test('cmd: legacy string', () => {
  const r = normalizeCommandPatterns([{ pattern: '^sudo', category: 'priv', description: 'sudo', riskLevel: 'moderate' }]);
  assert.equal(r.length, 1);
});
test('cmd: filters missing description', () => {
  const r = normalizeCommandPatterns([{ pattern: 'ok', category: 'c', riskLevel: 'safe' }]);
  assert.equal(r.length, 0);
});
test('cmd: filters invalid riskLevel', () => {
  const r = normalizeCommandPatterns([{ pattern: 'ok', category: 'c', description: 'd', riskLevel: 'extreme' }]);
  assert.equal(r.length, 0);
});
test('cmd: empty for undefined', () => assert.deepEqual(normalizeCommandPatterns(undefined), []));

// ── Failure hints ──
test('hint: SerializedRegex → RegExp', () => {
  const r = normalizeFailureHints([{ errorPattern: { source: 'ENOENT', flags: 'i' }, suggestion: 'file missing' }]);
  assert.equal(r.length, 1); assert.ok(r[0].errorPattern instanceof RegExp);
});
test('hint: legacy string', () => {
  const r = normalizeFailureHints([{ errorPattern: 'segfault', suggestion: 'memory issue' }]);
  assert.equal(r.length, 1);
});
test('hint: filters non-string suggestion', () => {
  const r = normalizeFailureHints([{ errorPattern: 'err', suggestion: 42 }]);
  assert.equal(r.length, 0);
});

// ── Prompt fragments ──
test('frag: valid pass-through', () => {
  const r = normalizePromptFragments([{ id: 'f1', section: 'reasoning', content: 'text', priority: 80 }]);
  assert.equal(r.length, 1); assert.equal(r[0].priority, 80);
});
test('frag: defaults tier/mode to all', () => {
  const r = normalizePromptFragments([{ id: 'f1', section: 'reasoning', content: 'text', priority: 50 }]);
  assert.equal(r[0].tier, 'all'); assert.equal(r[0].mode, 'all');
});
test('frag: filters NaN priority', () => {
  const r = normalizePromptFragments([{ id: 'bad', section: 'reasoning', content: 'text', priority: NaN }]);
  assert.equal(r.length, 0);
});

// ── Doc index + skills ──
test('doc: pass-through', () => {
  const r = normalizeDocIndex([{
    id: 'doc-1',
    title: 'T',
    url: 'https://x',
    section: 'S',
    tags: ['a'],
    source: { type: 'official-doc', url: 'https://x' },
    scope: { platforms: ['rdk-x5'] },
    confidence: 'high',
    citationLabel: 'Doc 1',
    chunkPolicy: { strategy: 'heading', maxTokens: 800 },
  }]);
  assert.equal(r.length, 1); assert.equal(r[0].title, 'T');
  assert.equal(r[0].metadata.id, 'doc-1');
  assert.equal(r[0].metadata.source.type, 'official-doc');
  assert.deepEqual(r[0].metadata.scope.platforms, ['rdk-x5']);
  assert.equal(r[0].metadata.citationLabel, 'Doc 1');
  assert.equal(r[0].metadata.chunkPolicy.strategy, 'heading');
});
test('skills: pass-through', () => {
  const r = normalizeSkills([{ id: 's1', category: 'tool', platforms: ['rdk-x5'], source: { type: 'generated', repo: 'device-knowledge' } }]);
  assert.equal(r.length, 1); assert.equal(r[0].id, 's1');
  assert.equal(r[0].metadata.source.repo, 'device-knowledge');
});

// ── Full adapter ──
function mk(overrides = {}) {
  return {
    manifest: {
      schemaVersion: 'device-knowledge.module.v1',
      id: 'test', name: 'Test', version: '0.1.0',
      origin: 'official', priority: 10,
      compatibility: { dmossKnowledgeModule: '^0.3.1' },
    },
    ...overrides,
  };
}

test('adapter: minimal module uses manifest.version', () => {
  const m = toKnowledgeModule(mk());
  assert.equal(m.id, 'test');
  assert.equal(m.version, '0.1.0'); // from manifest.version
  assert.equal(m.platformClaimPriority, 989);
});

test('adapter: options.version overrides manifest.version', () => {
  const m = toKnowledgeModule(mk(), { version: '2.0.0' });
  assert.equal(m.version, '2.0.0');
});

test('adapter: version does NOT come from compatibility.dmossKnowledgeModule', () => {
  const m = toKnowledgeModule(mk());
  // compatibility.dmossKnowledgeModule is '^0.3.1' — this is the contract range, NOT module version
  assert.notEqual(m.version, '^0.3.1');
  assert.equal(m.version, '0.1.0');
});

test('adapter: platforms from profiles', () => {
  const m = toKnowledgeModule(mk({ profiles: { 'rdk-x5': { platform: 'rdk-x5' } } }));
  assert.deepEqual(m.platforms, ['rdk-x5']);
});
test('adapter: options.platforms override', () => {
  const m = toKnowledgeModule(mk(), { platforms: ['a', 'b'] });
  assert.deepEqual(m.platforms, ['a', 'b']);
});
test('adapter: ecosystemText from options', () => {
  const m = toKnowledgeModule(mk(), { ecosystemText: 'eco' });
  assert.equal(m.getEcosystemPrompt(), 'eco');
});
test('adapter: family from manifest', () => {
  const d = mk(); d.manifest.family = 'rdk';
  const m = toKnowledgeModule(d);
  assert.equal(m.family, 'rdk');
});
test('adapter: full data pass', () => {
  const d = mk({
    profiles: { 'rdk-x5': { platform: 'rdk-x5' } },
    docs: [{ title: 'D', url: 'https://x', section: 'S', tags: [] }],
    promptFragments: [{ id: 'p', section: 'reasoning', content: 'c', priority: 80 }],
    commandPatterns: [{ pattern: '^rm', category: 'fs', description: 'rm', riskLevel: 'dangerous' }],
    failureHints: [{ errorPattern: 'ENOENT', suggestion: 'missing' }],
    skills: [{ id: 'sk1' }],
  });
  const m = toKnowledgeModule(d);
  assert.equal(Object.keys(m.getDeviceProfiles()).length, 1);
  assert.equal(m.getDocIndex().length, 1);
  assert.equal(m.getPromptFragments().length, 1);
  assert.ok(m.getCommandPatterns()[0].pattern instanceof RegExp);
  assert.ok(m.getFailureHints()[0].errorPattern instanceof RegExp);
  assert.equal(m.getSkills().length, 1);
});
test('adapter: getResearchSeeds when provided', () => {
  const m = toKnowledgeModule(mk(), { getResearchSeeds: (p) => [`r-${p}`] });
  assert.deepEqual(m.getResearchSeeds('x5'), ['r-x5']);
});
test('adapter: no getResearchSeeds when not provided', () => {
  const m = toKnowledgeModule(mk());
  assert.equal(m.getResearchSeeds, undefined);
});
test('adapter: priority across origins', () => {
  for (const { origin, priority, expected } of [
    { origin: 'official', priority: 0, expected: 999 },
    { origin: 'official', priority: 99, expected: 900 },
    { origin: 'community', priority: 100, expected: 899 },
    { origin: 'community', priority: 499, expected: 500 },
    { origin: 'user', priority: 500, expected: 499 },
    { origin: 'user', priority: 999, expected: 0 },
  ]) {
    const d = mk(); d.manifest.origin = origin; d.manifest.priority = priority;
    assert.equal(toKnowledgeModule(d).platformClaimPriority, expected);
  }
});
