import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDeviceKnowledgeModule } from '@device-knowledge/core';
import { toKnowledgeModule } from '@device-knowledge/dmoss-adapter';
import { getRpiResearchSeeds, rpiKnowledgeModuleData } from '../dist/index.js';

test('rpiKnowledgeModuleData validates through core schema', () => {
  const result = validateDeviceKnowledgeModule(rpiKnowledgeModuleData);

  assert.equal(result.ok, true);
  assert.equal(result.value.manifest.id, 'raspberry-pi-sbc');
  assert.equal(result.value.manifest.family, 'rpi');
});

test('Raspberry Pi data adapts to Moss KnowledgeModule', () => {
  const result = validateDeviceKnowledgeModule(rpiKnowledgeModuleData);
  assert.equal(result.ok, true);

  const module = toKnowledgeModule(result.value, {
    ecosystemText: rpiKnowledgeModuleData.ecosystemText,
    getResearchSeeds: getRpiResearchSeeds,
  });

  assert.equal(module.id, 'raspberry-pi-sbc');
  assert.equal(module.family, 'rpi');
  assert.deepEqual(module.platforms.sort(), ['rpi-4b', 'rpi-5', 'rpi-cm4']);
  assert.equal(module.getDeviceProfiles()['rpi-5'].displayName, 'Raspberry Pi 5');
  assert.equal(module.getDocIndex()[0].metadata.source.type, 'official-doc');
  assert.match(module.getEcosystemPrompt(), /raspberrypi.com/);
  assert.deepEqual(module.getResearchSeeds?.('rpi-5'), [
    'https://www.raspberrypi.com/documentation/',
  ]);
});
