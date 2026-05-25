#!/usr/bin/env node
import { validateDeviceKnowledgeModule } from '@device-knowledge/core';
import { rdkKnowledgeModuleData } from '@device-knowledge/rdk-knowledge';

const RECORD_GROUPS = ['docs', 'promptFragments', 'commandPatterns', 'failureHints', 'skills'];
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
  if (!record.source || typeof record.source !== 'object') add(`${path}.source`, 'missing source metadata');
  if (!record.citationLabel && group !== 'skills') add(`${path}.citationLabel`, 'missing citation label');
  if (record.scope && Object.keys(record.scope).length === 0) add(`${path}.scope`, 'empty scope should be omitted');
  for (const field of DATE_FIELDS) {
    if (record[field] !== undefined && !isValidDate(record[field])) add(`${path}.${field}`, 'invalid date string');
  }
  if (record.validFrom && record.validTo && Date.parse(record.validFrom) > Date.parse(record.validTo)) {
    add(`${path}.validTo`, 'validTo must be on or after validFrom');
  }
  if (group === 'docs') {
    try {
      new URL(record.url);
    } catch {
      add(`${path}.url`, 'invalid URL');
    }
    if (!record.chunkPolicy) add(`${path}.chunkPolicy`, 'missing chunk policy');
  }
}

const validation = validateDeviceKnowledgeModule(rdkKnowledgeModuleData);
if (!validation.ok) {
  for (const issue of validation.issues) add(issue.path, issue.message);
} else {
  for (const group of RECORD_GROUPS) {
    validation.value[group]?.forEach((record, index) => lintRecord(group, record, index));
  }
}

if (issues.length > 0) {
  console.error('[lint:knowledge] failed');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

const counts = RECORD_GROUPS
  .map((group) => `${group}=${validation.value[group]?.length ?? 0}`)
  .join(' ');
console.log(`[lint:knowledge] ok ${counts}`);
