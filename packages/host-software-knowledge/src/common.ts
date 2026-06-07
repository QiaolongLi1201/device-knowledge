import type { KnowledgeCompatibilityScope, KnowledgeSourceRef } from '@device-knowledge/core';

export const SOURCE_RETRIEVED_AT = '2026-06-04';

export const HOST_SOFTWARE_SCOPE: KnowledgeCompatibilityScope = {
  platforms: ['host-software'],
  toolchains: ['electron', 'react', 'vite', 'typescript', 'node'],
};

export const HOST_SOFTWARE_GENERATED_SOURCE: KnowledgeSourceRef = {
  type: 'generated',
  repo: 'device-knowledge/packages/host-software-knowledge',
  retrievedAt: SOURCE_RETRIEVED_AT,
};
