import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPriorityRange,
  resolveModuleConflict,
  validateModulePriority,
} from '../dist/index.js';

test('getPriorityRange returns configured origin ranges', () => {
  assert.deepEqual(getPriorityRange('official'), { min: 0, max: 99 });
  assert.deepEqual(getPriorityRange('community'), { min: 100, max: 499 });
  assert.deepEqual(getPriorityRange('user'), { min: 500, max: 999 });
});

test('validateModulePriority accepts priorities inside the origin range', () => {
  const result = validateModulePriority('community', 100);

  assert.equal(result.ok, true);
  assert.equal(result.value, 100);
});

test('validateModulePriority rejects priorities outside the origin range', () => {
  const result = validateModulePriority('community', 20);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-priority-range');
});

test('resolveModuleConflict rejects empty candidate lists', () => {
  const result = resolveModuleConflict([]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'empty-candidates');
});

test('resolveModuleConflict rejects duplicate module and target pairs', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'rdk',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'rdk',
      origin: 'official',
      priority: 1,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'duplicate-module-target');
});

test('resolveModuleConflict prefers platform specificity over family defaults', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk-family',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'family',
    },
    {
      moduleId: 'official-rdk-x5',
      origin: 'official',
      priority: 10,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.value.winner.moduleId, 'official-rdk-x5');
  assert.equal(result.value.rejected[0].moduleId, 'official-rdk-family');
  assert.match(result.value.explanation, /official-rdk-x5 wins rdk-x5/);
});

test('resolveModuleConflict prefers explicit override at the same specificity', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'community-rdk-default',
      origin: 'community',
      priority: 100,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'user-rdk-override',
      origin: 'user',
      priority: 900,
      targetId: 'rdk-x5',
      specificity: 'platform',
      override: true,
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.value.winner.moduleId, 'user-rdk-override');
});

test('resolveModuleConflict uses lower priority after specificity and override', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'community-rdk-later',
      origin: 'community',
      priority: 200,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'community-rdk-first',
      origin: 'community',
      priority: 100,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.value.winner.moduleId, 'community-rdk-first');
});

test('resolveModuleConflict requires explicit override for non-official winner over official', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk-family',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'family',
    },
    {
      moduleId: 'user-rdk-platform',
      origin: 'user',
      priority: 500,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'missing-explicit-override');
});

test('resolveModuleConflict allows explicit user override over official', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'user-rdk',
      origin: 'user',
      priority: 500,
      targetId: 'rdk-x5',
      specificity: 'platform',
      override: true,
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.value.winner.moduleId, 'user-rdk');
});

test('resolveModuleConflict rejects ambiguous top-ranked candidates without moduleId tie-break', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk-b',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'official-rdk-a',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'ambiguous-conflict');
});
