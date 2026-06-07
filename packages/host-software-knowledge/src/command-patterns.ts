import type { CommandPattern } from '@device-knowledge/core';

import { HOST_SOFTWARE_GENERATED_SOURCE, HOST_SOFTWARE_SCOPE, SOURCE_RETRIEVED_AT } from './common.js';

function pattern(input: Pick<CommandPattern, 'id' | 'pattern' | 'category' | 'description' | 'riskLevel' | 'priority' | 'tags'>): CommandPattern {
  return {
    ...input,
    source: HOST_SOFTWARE_GENERATED_SOURCE,
    scope: HOST_SOFTWARE_SCOPE,
    language: 'en',
    status: 'active',
    confidence: 'high',
    lastReviewedAt: SOURCE_RETRIEVED_AT,
    citationLabel: `Host software command pattern: ${input.description}`,
  };
}

export const HOST_SOFTWARE_COMMAND_PATTERNS: CommandPattern[] = [
  pattern({
    id: 'host-command-vite-dev',
    pattern: { source: '(npm|pnpm|yarn)\\s+run\\s+dev|\\bvite\\b', flags: 'i' },
    category: 'dev-server',
    description: 'Run or inspect a Vite development server',
    riskLevel: 'safe',
    priority: 55,
    tags: ['vite', 'dev-server'],
  }),
  pattern({
    id: 'host-command-typescript-typecheck',
    pattern: { source: '\\btsc\\b.*(--noEmit|-p\\s+[^\\s]+)|run\\s+typecheck', flags: 'i' },
    category: 'typecheck',
    description: 'Run TypeScript compiler diagnostics',
    riskLevel: 'safe',
    priority: 58,
    tags: ['typescript', 'tsc'],
  }),
  pattern({
    id: 'host-command-electron-builder',
    pattern: { source: 'electron-builder|electron-builder\\s+--(mac|win|linux|publish)', flags: 'i' },
    category: 'packaging',
    description: 'Build or sign Electron desktop artifacts',
    riskLevel: 'moderate',
    priority: 50,
    tags: ['electron-builder', 'packaging', 'signing'],
  }),
];
