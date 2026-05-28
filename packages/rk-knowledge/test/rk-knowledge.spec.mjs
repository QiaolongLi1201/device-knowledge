import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDeviceKnowledgeModule } from '@device-knowledge/core';
import { toKnowledgeModule } from '@device-knowledge/dmoss-adapter';
import { getRkResearchSeeds, rkKnowledgeModuleData } from '../dist/index.js';

test('rkKnowledgeModuleData validates through core schema', () => {
  const result = validateDeviceKnowledgeModule(rkKnowledgeModuleData);

  assert.equal(result.ok, true);
  assert.equal(result.value.manifest.id, 'rockchip-sbc');
  assert.equal(result.value.manifest.family, 'rockchip');
});

test('Rockchip RK data adapts to Moss KnowledgeModule', () => {
  const result = validateDeviceKnowledgeModule(rkKnowledgeModuleData);
  assert.equal(result.ok, true);

  const module = toKnowledgeModule(result.value, {
    ecosystemText: rkKnowledgeModuleData.ecosystemText,
    getResearchSeeds: getRkResearchSeeds,
  });

  assert.equal(module.id, 'rockchip-sbc');
  assert.equal(module.family, 'rockchip');
  assert.ok(module.platforms.includes('rock-5b'));
  assert.equal(module.getDeviceProfiles()['rock-5b'].displayName, 'Radxa ROCK 5B');
  assert.equal(module.getDeviceProfiles()['rock-5b'].computeTops, 6);
  assert.equal(module.getDocIndex()[0].metadata.source.type, 'official-doc');
  assert.match(module.getEcosystemPrompt(), /RKNN/);
  assert.ok(module.getDocIndex().some((entry) => entry.metadata?.id === 'rk-doc-radxa-rock5itx'));
  assert.ok(module.getDocIndex().some((entry) => entry.metadata?.id === 'rk-doc-orange-pi-5-plus'));

  const seeds = module.getResearchSeeds?.('rock-5b') ?? [];
  assert.ok(seeds.includes('https://docs.radxa.com/en/rock5/rock5b/getting-started/introduction'));
  assert.ok(seeds.includes('https://docs.radxa.com/en/rock5/rock5itx/getting-started/introduction'));
  assert.ok(seeds.includes('https://github.com/airockchip/rknn-toolkit2'));
  assert.ok(seeds.includes('https://wiki.t-firefly.com/en/ROC-RK3588S-PC/'));
  assert.ok(
    seeds.includes('http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-5-plus.html'),
  );
});
