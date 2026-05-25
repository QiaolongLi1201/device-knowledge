import test from 'node:test';
import assert from 'node:assert/strict';

import {
  compileSerializedRegex,
  serializedRegexFromLegacyRobotHubPattern,
  validateSerializedRegex,
} from '../dist/index.js';

test('validateSerializedRegex accepts source and flags', () => {
  const result = validateSerializedRegex({ source: 'rdk.*x5', flags: 'i' });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { source: 'rdk.*x5', flags: 'i' });
});

test('validateSerializedRegex rejects duplicate flags', () => {
  const result = validateSerializedRegex({ source: 'rdk', flags: 'ii' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-regex-flags');
});

test('validateSerializedRegex rejects unknown flags', () => {
  const result = validateSerializedRegex({ source: 'rdk', flags: 'x' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-regex-flags');
});

test('validateSerializedRegex rejects incompatible flags as flag errors', () => {
  const result = validateSerializedRegex({ source: 'rdk', flags: 'uv' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].path, 'flags');
  assert.equal(result.issues[0].code, 'invalid-regex-flags');
});

test('validateSerializedRegex rejects empty source', () => {
  const result = validateSerializedRegex({ source: '', flags: 'i' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-regex-source');
});

test('validateSerializedRegex rejects invalid source syntax', () => {
  const result = validateSerializedRegex({ source: '(', flags: 'i' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-regex-source');
});

test('validateSerializedRegex keeps valid-flag unicode syntax failures as source errors', () => {
  const result = validateSerializedRegex({ source: '\\u{110000}', flags: 'u' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].path, 'source');
  assert.equal(result.issues[0].code, 'invalid-regex-source');
});

test('compileSerializedRegex compiles only after validation', () => {
  const pattern = compileSerializedRegex({ source: 'error:\\s+(.+)', flags: 'i' });

  assert.equal(pattern.test('ERROR: failed'), true);
});

test('compileSerializedRegex rejects invalid source syntax', () => {
  assert.throws(
    () => compileSerializedRegex({ source: '(', flags: 'i' }),
    /Invalid serialized regex/,
  );
});

test('serializedRegexFromLegacyRobotHubPattern preserves old i flag behavior', () => {
  const serialized = serializedRegexFromLegacyRobotHubPattern('permission denied');
  const pattern = compileSerializedRegex(serialized);

  assert.deepEqual(serialized, { source: 'permission denied', flags: 'i' });
  assert.equal(pattern.test('Permission Denied'), true);
});

test('serializedRegexFromLegacyRobotHubPattern rejects empty strings', () => {
  assert.throws(
    () => serializedRegexFromLegacyRobotHubPattern(''),
    /non-empty string/,
  );
});
