import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDeviceKnowledgeModule } from '@device-knowledge/core';
import { toKnowledgeModule } from '@device-knowledge/dmoss-adapter';
import {
  getRdkResearchSeeds,
  RDK_ECOSYSTEM_TEXT,
  rdkKnowledgeModuleData,
} from '../dist/index.js';

test('rdkKnowledgeModuleData validates through core schema', () => {
  const result = validateDeviceKnowledgeModule(rdkKnowledgeModuleData);

  assert.equal(result.ok, true);
  assert.equal(result.value.manifest.id, 'rdk');
  assert.equal(result.value.manifest.version, '0.1.5');
  assert.equal(result.value.manifest.family, 'rdk');
});

test('full RDK data adapts to Moss KnowledgeModule', () => {
  const result = validateDeviceKnowledgeModule(rdkKnowledgeModuleData);
  assert.equal(result.ok, true);

  const module = toKnowledgeModule(result.value, {
    ecosystemText: RDK_ECOSYSTEM_TEXT,
    getResearchSeeds: getRdkResearchSeeds,
  });

  assert.equal(module.id, 'rdk');
  assert.equal(module.name, 'RDK Development Kit');
  assert.equal(module.version, '0.1.5');
  assert.equal(module.family, 'rdk');
  assert.deepEqual(module.platforms.sort(), ['rdk-s100', 'rdk-s100p', 'rdk-ultra', 'rdk-x3', 'rdk-x5']);
  assert.equal(module.platformClaimPriority, 999);

  assert.equal(module.getDeviceProfiles()['rdk-x5'].displayName, 'RDK X5');
  assert.equal(module.getDocIndex()[0].section, 'getting-started');
  assert.ok(module.getDocIndex().length > 40);
  assert.ok(module.getPromptFragments().length > 10);
  assert.ok(module.getCommandPatterns().some((entry) => entry.pattern.test('hrut_smi')));
  assert.ok(module.getFailureHints().some((entry) => entry.errorPattern.test('unsupported op')));
  assert.equal(module.getSkills?.()[0].id, 'rdk-ecosystem');
  assert.ok(rdkKnowledgeModuleData.skills?.every((entry) => entry.scope?.platforms?.includes('rdk-s100p')));
  assert.match(module.getEcosystemPrompt(), /RDK 产品生态/);
  assert.match(module.getEcosystemPrompt(), /RDK X5/);
  assert.deepEqual(module.getResearchSeeds?.('rdk-x5'), [
    'https://developer.d-robotics.cc/rdk_doc/',
    'https://github.com/D-Robotics',
  ]);
  assert.equal(module.getDeviceProfiles()['rdk-s100p'].bpuTops, 128);
  assert.equal(module.getDeviceProfiles()['rdk-s100'].cameraInterfaces.find((entry) => entry.type === 'mipi')?.count, 2);
  assert.equal(module.getDeviceProfiles()['rdk-s100p'].cameraInterfaces.find((entry) => entry.type === 'mipi')?.count, 2);
  assert.equal(rdkKnowledgeModuleData.manifest.compatibility.minRdkStudio, '1.2.1');
  assert.ok(
    rdkKnowledgeModuleData.docs?.some(
      (entry) => entry.title.includes('S100/S100P') && entry.scope?.platforms?.includes('rdk-s100p'),
    ),
  );
  assert.ok(rdkKnowledgeModuleData.workflowGuides?.length >= 5);
  assert.ok(
    rdkKnowledgeModuleData.workflowGuides?.some(
      (entry) =>
        entry.id === 'rdk-workflow-bpu-model-deployment' &&
        entry.verification.some((check) => check.command?.includes('hb_eval_perf')),
    ),
  );
  assert.ok(
    rdkKnowledgeModuleData.workflowGuides?.every(
      (entry) =>
        entry.source.type !== 'generated' &&
        entry.triggers.length > 0 &&
        entry.steps.length > 0 &&
        entry.verification.length > 0 &&
        entry.safetyNotes?.length,
    ),
  );
});

test('unknown platforms use ecosystem research seeds', () => {
  assert.deepEqual(getRdkResearchSeeds('unknown-board'), [
    'https://developer.d-robotics.cc/rdk_doc/',
    'https://github.com/D-Robotics',
  ]);
});
