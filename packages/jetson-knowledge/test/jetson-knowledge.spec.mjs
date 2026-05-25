import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDeviceKnowledgeModule } from '@device-knowledge/core';
import { toKnowledgeModule } from '@device-knowledge/dmoss-adapter';
import { getJetsonResearchSeeds, jetsonKnowledgeModuleData } from '../dist/index.js';

test('jetsonKnowledgeModuleData validates through core schema', () => {
  const result = validateDeviceKnowledgeModule(jetsonKnowledgeModuleData);

  assert.equal(result.ok, true);
  assert.equal(result.value.manifest.id, 'jetson-sbc');
  assert.equal(result.value.manifest.family, 'jetson');
});

test('Jetson data adapts to Moss KnowledgeModule', () => {
  const result = validateDeviceKnowledgeModule(jetsonKnowledgeModuleData);
  assert.equal(result.ok, true);

  const module = toKnowledgeModule(result.value, {
    ecosystemText: jetsonKnowledgeModuleData.ecosystemText,
    getResearchSeeds: getJetsonResearchSeeds,
  });

  assert.equal(module.id, 'jetson-sbc');
  assert.equal(module.family, 'jetson');
  assert.ok(module.platforms.includes('jetson-orin-nano'));
  assert.equal(module.getDeviceProfiles()['jetson-orin-nano'].displayName, 'Jetson Orin Nano');
  assert.equal(module.getDocIndex()[0].metadata.source.type, 'official-doc');
  assert.match(module.getEcosystemPrompt(), /JetPack/);
  assert.deepEqual(module.getResearchSeeds?.('jetson-orin-nano'), [
    'https://developer.nvidia.com/embedded/jetson',
  ]);
});
