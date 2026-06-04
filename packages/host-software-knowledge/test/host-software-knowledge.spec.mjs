import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDeviceKnowledgeModule } from '@device-knowledge/core';
import { toKnowledgeModule } from '@device-knowledge/dmoss-adapter';
import {
  getHostSoftwareResearchSeeds,
  hostSoftwareKnowledgeModuleData,
} from '../dist/index.js';

test('hostSoftwareKnowledgeModuleData validates through core schema', () => {
  const result = validateDeviceKnowledgeModule(hostSoftwareKnowledgeModuleData);

  assert.equal(result.ok, true);
  assert.equal(result.value.manifest.id, 'host-software');
  assert.equal(result.value.manifest.family, 'host-software');
});

test('host software data adapts to Moss KnowledgeModule', () => {
  const result = validateDeviceKnowledgeModule(hostSoftwareKnowledgeModuleData);
  assert.equal(result.ok, true);

  const module = toKnowledgeModule(result.value, {
    ecosystemText: hostSoftwareKnowledgeModuleData.ecosystemText,
    getResearchSeeds: getHostSoftwareResearchSeeds,
  });

  assert.equal(module.id, 'host-software');
  assert.equal(module.family, 'host-software');
  assert.ok(module.platforms.includes('host-software'));
  assert.ok(module.getDocIndex().length > 0);
  assert.ok(module.getPromptFragments().length > 0);
  assert.ok(module.getDocIndex().some((entry) => entry.metadata?.id === 'host-doc-electron-ipc'));
  assert.ok(module.getDocIndex().some((entry) => entry.metadata?.id === 'host-doc-vite-hmr'));
  assert.ok(module.getPromptFragments().some((entry) => entry.section === 'reasoning'));
  assert.ok(module.getPromptFragments().some((entry) => entry.section === 'tool_contract'));
  assert.ok(module.getFailureHints().some((entry) => entry.errorPattern.test('No handler registered')));
  assert.ok(module.getFailureHints().some((entry) => entry.errorPattern.test('TS2322')));
  assert.match(module.getEcosystemPrompt(), /host software/i);

  const seeds = module.getResearchSeeds?.('host-software') ?? [];
  assert.ok(seeds.includes('https://www.electronjs.org/docs/latest/tutorial/ipc'));
  assert.ok(seeds.includes('https://vite.dev/guide/features.html#hot-module-replacement'));
  assert.ok(seeds.includes('https://www.typescriptlang.org/docs/handbook/compiler-options.html'));
});
