import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
} from '@device-knowledge/core';

import { HOST_SOFTWARE_COMMAND_PATTERNS } from './command-patterns.js';
import { HOST_SOFTWARE_DOC_INDEX } from './doc-index.js';
import { HOST_SOFTWARE_FAILURE_HINTS } from './failure-hints.js';
import { HOST_SOFTWARE_PROMPT_FRAGMENTS } from './prompt-fragments.js';

export { HOST_SOFTWARE_COMMAND_PATTERNS } from './command-patterns.js';
export { HOST_SOFTWARE_DOC_INDEX } from './doc-index.js';
export { HOST_SOFTWARE_FAILURE_HINTS } from './failure-hints.js';
export { HOST_SOFTWARE_PROMPT_FRAGMENTS } from './prompt-fragments.js';

export const HOST_SOFTWARE_ECOSYSTEM_TEXT = [
  '## Host software ecosystem',
  '- Desktop and frontend work usually spans browser runtimes, Electron main/preload/renderer processes, Node backends, Vite dev/build tooling, and TypeScript static analysis.',
  '- Keep runtime boundaries explicit: browser/renderer code is not Node code; preload bridges should be narrow, typed, and reviewed as security boundaries.',
  '- Use official framework documentation for contracts first, then local source, package versions, logs, and tests to resolve the project-specific behavior.',
].join('\n');

const hostSoftwareProfiles = {
  'host-software': {
    platform: 'host-software',
    displayName: 'Host Software Engineering',
    domain: 'desktop-frontend',
    runtimes: ['browser', 'electron-main', 'electron-preload', 'electron-renderer', 'node-backend'],
    primaryStacks: ['Electron', 'React', 'Vite', 'TypeScript', 'Node.js'],
    diagnosticCommands: [
      'node --version',
      'npm run typecheck',
      'npm run build',
      'npm run dev',
      'node --test',
    ],
    contractNotes: [
      'Vite transpilation does not replace TypeScript typechecking.',
      'Electron renderer code should not receive unrestricted Node or ipcRenderer access.',
      'Packaging failures should be split into build, signing, and notarization phases.',
    ],
    sourceUrls: [
      'https://www.electronjs.org/docs/latest/tutorial/process-model',
      'https://react.dev/learn',
      'https://vite.dev/guide/',
      'https://www.typescriptlang.org/docs/handbook/compiler-options.html',
      'https://nodejs.org/api/http.html',
    ],
    lastReviewedAt: '2026-06-04',
  },
};

export const hostSoftwareKnowledgeModuleData: DeviceKnowledgeModuleData & { ecosystemText: string } = {
  manifest: {
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'host-software',
    name: 'Host Software Engineering',
    version: '0.1.0',
    origin: 'official',
    family: 'host-software',
    priority: 30,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
      minRdkStudio: '1.2.0',
    },
  },
  profiles: hostSoftwareProfiles,
  docs: HOST_SOFTWARE_DOC_INDEX,
  promptFragments: HOST_SOFTWARE_PROMPT_FRAGMENTS,
  commandPatterns: HOST_SOFTWARE_COMMAND_PATTERNS,
  failureHints: HOST_SOFTWARE_FAILURE_HINTS,
  skills: [],
  ecosystemText: HOST_SOFTWARE_ECOSYSTEM_TEXT,
};

export function getHostSoftwareResearchSeeds(): string[] {
  return [
    'https://www.electronjs.org/docs/latest/tutorial/process-model',
    'https://www.electronjs.org/docs/latest/tutorial/tutorial-preload',
    'https://www.electronjs.org/docs/latest/api/context-bridge',
    'https://www.electronjs.org/docs/latest/tutorial/ipc',
    'https://www.electron.build/code-signing',
    'https://react.dev/learn',
    'https://react.dev/reference/react/hooks',
    'https://vite.dev/guide/',
    'https://vite.dev/guide/features.html#hot-module-replacement',
    'https://www.typescriptlang.org/docs/handbook/compiler-options.html',
    'https://www.typescriptlang.org/tsconfig/',
    'https://nodejs.org/api/http.html',
  ];
}
