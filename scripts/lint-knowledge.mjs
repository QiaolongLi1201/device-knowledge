#!/usr/bin/env node
import { validateDeviceKnowledgeModule } from '@device-knowledge/core';
import { jetsonKnowledgeModuleData } from '@device-knowledge/jetson-knowledge';
import { rdkKnowledgeModuleData } from '@device-knowledge/rdk-knowledge';
import { rkKnowledgeModuleData } from '@device-knowledge/rk-knowledge';
import { rpiKnowledgeModuleData } from '@device-knowledge/rpi-knowledge';

const RECORD_GROUPS = ['docs', 'promptFragments', 'commandPatterns', 'failureHints', 'skills', 'workflowGuides'];
const DATE_FIELDS = ['lastReviewedAt', 'validFrom', 'validTo'];
const issues = [];

function add(path, message) {
  issues.push(`${path}: ${message}`);
}

function isValidDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function lintRecord(group, record, index) {
  const path = `${group}.${index}`;
  const recordGroup = group.split('.').at(-1);
  if (!record.source || typeof record.source !== 'object') add(`${path}.source`, 'missing source metadata');
  if (!record.citationLabel && recordGroup !== 'skills') add(`${path}.citationLabel`, 'missing citation label');
  if (record.scope && Object.keys(record.scope).length === 0) add(`${path}.scope`, 'empty scope should be omitted');
  for (const field of DATE_FIELDS) {
    if (record[field] !== undefined && !isValidDate(record[field])) add(`${path}.${field}`, 'invalid date string');
  }
  if (record.validFrom && record.validTo && Date.parse(record.validFrom) > Date.parse(record.validTo)) {
    add(`${path}.validTo`, 'validTo must be on or after validFrom');
  }
  if (recordGroup === 'docs') {
    try {
      new URL(record.url);
    } catch {
      add(`${path}.url`, 'invalid URL');
    }
    if (!record.chunkPolicy) add(`${path}.chunkPolicy`, 'missing chunk policy');
  }
  if (recordGroup === 'workflowGuides') {
    if (!Array.isArray(record.triggers) || record.triggers.length === 0) add(`${path}.triggers`, 'missing triggers');
    if (!Array.isArray(record.prerequisites) || record.prerequisites.length === 0) {
      add(`${path}.prerequisites`, 'missing prerequisites');
    }
    if (!Array.isArray(record.steps) || record.steps.length === 0) add(`${path}.steps`, 'missing workflow steps');
    if (!Array.isArray(record.verification) || record.verification.length === 0) {
      add(`${path}.verification`, 'missing verification checks');
    }
    if (!Array.isArray(record.safetyNotes) || record.safetyNotes.length === 0) {
      add(`${path}.safetyNotes`, 'missing safety notes');
    }
    if (typeof record.expectedOutcome !== 'string' || !record.expectedOutcome.trim()) {
      add(`${path}.expectedOutcome`, 'missing expected outcome');
    }
    record.steps?.forEach((step, stepIndex) => {
      if (step.command && !step.riskLevel) add(`${path}.steps.${stepIndex}.riskLevel`, 'commands must declare riskLevel');
    });
    record.relatedUrls?.forEach((relatedUrl, relatedIndex) => {
      try {
        new URL(relatedUrl);
      } catch {
        add(`${path}.relatedUrls.${relatedIndex}`, 'invalid URL');
      }
    });
  }
}

const modules = [
  ['rdk', rdkKnowledgeModuleData],
  ['jetson', jetsonKnowledgeModuleData],
  ['rpi', rpiKnowledgeModuleData],
  ['rk', rkKnowledgeModuleData],
];
const countsByModule = [];

for (const [moduleName, moduleData] of modules) {
  const validation = validateDeviceKnowledgeModule(moduleData);
  if (!validation.ok) {
    for (const issue of validation.issues) add(`${moduleName}.${issue.path}`, issue.message);
  } else {
    for (const group of RECORD_GROUPS) {
      validation.value[group]?.forEach((record, index) => lintRecord(`${moduleName}.${group}`, record, index));
    }
    countsByModule.push(
      `${moduleName}(${RECORD_GROUPS
        .map((group) => `${group}=${validation.value[group]?.length ?? 0}`)
        .join(' ')})`,
    );
  }
}

if (issues.length > 0) {
  console.error('[lint:knowledge] failed');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`[lint:knowledge] ok ${countsByModule.join(' ')}`);
