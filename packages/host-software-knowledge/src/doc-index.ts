import type { DocIndexEntry, KnowledgeSourceType } from '@device-knowledge/core';

import { HOST_SOFTWARE_SCOPE, SOURCE_RETRIEVED_AT } from './common.js';

interface HostDocInput {
  id: string;
  title: string;
  url: string;
  section: string;
  tags: string[];
  sectionPath?: string[];
  anchors?: string[];
  pageHint?: string;
  priority?: number;
  sourceType?: KnowledgeSourceType;
}

function doc(input: HostDocInput): DocIndexEntry {
  const sourceType = input.sourceType ?? 'official-doc';
  return {
    id: input.id,
    title: input.title,
    url: input.url,
    sourceUrl: input.url,
    sourceType,
    section: input.section,
    ...(input.sectionPath ? { sectionPath: input.sectionPath } : {}),
    ...(input.anchors ? { anchors: input.anchors } : {}),
    ...(input.pageHint ? { pageHint: input.pageHint } : {}),
    tags: input.tags,
    language: 'en',
    status: 'active',
    confidence: 'high',
    priority: input.priority ?? 70,
    lastReviewedAt: SOURCE_RETRIEVED_AT,
    citationLabel: input.title,
    source: {
      type: sourceType,
      url: input.url,
      retrievedAt: SOURCE_RETRIEVED_AT,
    },
    scope: HOST_SOFTWARE_SCOPE,
    chunkPolicy: {
      strategy: 'heading',
      maxTokens: 800,
      overlapTokens: 120,
    },
    metadataForEmbedding: ['title', 'section', 'tags', 'toolchains'],
    metadataForPrompt: ['title', 'url', 'section', 'lastReviewedAt'],
  };
}

export const HOST_SOFTWARE_DOC_INDEX: DocIndexEntry[] = [
  doc({
    id: 'host-doc-electron-process-model',
    title: 'Electron Process Model',
    url: 'https://www.electronjs.org/docs/latest/tutorial/process-model',
    section: 'electron',
    sectionPath: ['Electron', 'Architecture'],
    anchors: ['the-main-process', 'the-renderer-process', 'preload-scripts'],
    tags: ['electron', 'main-process', 'renderer-process', 'preload'],
    priority: 90,
  }),
  doc({
    id: 'host-doc-electron-preload',
    title: 'Electron Preload Scripts',
    url: 'https://www.electronjs.org/docs/latest/tutorial/tutorial-preload',
    section: 'electron',
    sectionPath: ['Electron', 'Preload'],
    anchors: ['augmenting-the-renderer-with-a-preload-script'],
    tags: ['electron', 'preload', 'sandbox', 'renderer'],
    priority: 88,
  }),
  doc({
    id: 'host-doc-electron-context-bridge',
    title: 'Electron contextBridge API',
    url: 'https://www.electronjs.org/docs/latest/api/context-bridge',
    section: 'electron',
    sectionPath: ['Electron', 'Preload', 'contextBridge'],
    anchors: ['contextbridgeexposeinmainworldapikey-api'],
    tags: ['electron', 'contextBridge', 'preload', 'ipc', 'security'],
    priority: 88,
  }),
  doc({
    id: 'host-doc-electron-ipc',
    title: 'Electron Inter-Process Communication',
    url: 'https://www.electronjs.org/docs/latest/tutorial/ipc',
    section: 'electron',
    sectionPath: ['Electron', 'IPC'],
    anchors: ['pattern-2-renderer-to-main-two-way', 'pattern-3-main-to-renderer'],
    tags: ['electron', 'ipc', 'ipcMain', 'ipcRenderer', 'contextBridge'],
    priority: 90,
  }),
  doc({
    id: 'host-doc-electron-builder-signing',
    title: 'electron-builder Code Signing',
    url: 'https://www.electron.build/code-signing',
    section: 'packaging',
    sectionPath: ['electron-builder', 'Signing'],
    anchors: ['code-signing'],
    tags: ['electron-builder', 'code-signing', 'packaging', 'notarization'],
    priority: 82,
  }),
  doc({
    id: 'host-doc-react-learn',
    title: 'React Learn',
    url: 'https://react.dev/learn',
    section: 'react',
    sectionPath: ['React', 'Learn'],
    tags: ['react', 'components', 'state', 'effects'],
    priority: 78,
  }),
  doc({
    id: 'host-doc-react-reference-hooks',
    title: 'React Hooks Reference',
    url: 'https://react.dev/reference/react/hooks',
    section: 'react',
    sectionPath: ['React', 'Reference', 'Hooks'],
    tags: ['react', 'hooks', 'state', 'effects'],
    priority: 76,
  }),
  doc({
    id: 'host-doc-react-create-root',
    title: 'React DOM createRoot',
    url: 'https://react.dev/reference/react-dom/client/createRoot',
    section: 'react',
    sectionPath: ['React DOM', 'Client APIs'],
    tags: ['react', 'react-dom', 'createRoot', 'bootstrap'],
    priority: 72,
  }),
  doc({
    id: 'host-doc-vite-guide',
    title: 'Vite Getting Started',
    url: 'https://vite.dev/guide/',
    section: 'vite',
    sectionPath: ['Vite', 'Guide'],
    tags: ['vite', 'dev-server', 'build', 'frontend'],
    priority: 78,
  }),
  doc({
    id: 'host-doc-vite-hmr',
    title: 'Vite Hot Module Replacement',
    url: 'https://vite.dev/guide/features.html#hot-module-replacement',
    section: 'vite',
    sectionPath: ['Vite', 'Features', 'HMR'],
    anchors: ['hot-module-replacement'],
    tags: ['vite', 'hmr', 'dev-server', 'websocket'],
    priority: 84,
  }),
  doc({
    id: 'host-doc-vite-typescript',
    title: 'Vite TypeScript Support',
    url: 'https://vite.dev/guide/features.html#typescript',
    section: 'vite',
    sectionPath: ['Vite', 'Features', 'TypeScript'],
    anchors: ['typescript'],
    tags: ['vite', 'typescript', 'transpile', 'typecheck'],
    priority: 80,
  }),
  doc({
    id: 'host-doc-vite-env-mode',
    title: 'Vite Env Variables and Modes',
    url: 'https://vite.dev/guide/env-and-mode',
    section: 'vite',
    sectionPath: ['Vite', 'Guide', 'Env and Mode'],
    tags: ['vite', 'env', 'mode', 'configuration'],
    priority: 68,
  }),
  doc({
    id: 'host-doc-typescript-compiler-options',
    title: 'TypeScript Compiler Options',
    url: 'https://www.typescriptlang.org/docs/handbook/compiler-options.html',
    section: 'typescript',
    sectionPath: ['TypeScript', 'tsc'],
    tags: ['typescript', 'tsc', 'compiler-options', 'typecheck'],
    priority: 84,
  }),
  doc({
    id: 'host-doc-typescript-tsconfig',
    title: 'TSConfig Reference',
    url: 'https://www.typescriptlang.org/tsconfig/',
    section: 'typescript',
    sectionPath: ['TypeScript', 'TSConfig'],
    tags: ['typescript', 'tsconfig', 'strict', 'module-resolution'],
    priority: 82,
  }),
  doc({
    id: 'host-doc-typescript-everyday-types',
    title: 'TypeScript Everyday Types',
    url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
    section: 'typescript',
    sectionPath: ['TypeScript', 'Handbook'],
    tags: ['typescript', 'types', 'narrowing', 'interfaces'],
    priority: 70,
  }),
  doc({
    id: 'host-doc-node-http',
    title: 'Node.js HTTP API',
    url: 'https://nodejs.org/api/http.html',
    section: 'node',
    sectionPath: ['Node.js', 'Backend APIs', 'HTTP'],
    tags: ['node', 'backend', 'http', 'server'],
    priority: 72,
  }),
  doc({
    id: 'host-doc-node-stream',
    title: 'Node.js Streams API',
    url: 'https://nodejs.org/api/stream.html',
    section: 'node',
    sectionPath: ['Node.js', 'Backend APIs', 'Streams'],
    tags: ['node', 'backend', 'streams', 'io'],
    priority: 68,
  }),
  doc({
    id: 'host-doc-node-child-process',
    title: 'Node.js child_process API',
    url: 'https://nodejs.org/api/child_process.html',
    section: 'node',
    sectionPath: ['Node.js', 'Backend APIs', 'Child Processes'],
    tags: ['node', 'backend', 'child_process', 'subprocess'],
    priority: 68,
  }),
  doc({
    id: 'host-doc-node-test-runner',
    title: 'Node.js Test Runner',
    url: 'https://nodejs.org/api/test.html',
    section: 'node',
    sectionPath: ['Node.js', 'Testing'],
    tags: ['node', 'test-runner', 'testing', 'assert'],
    priority: 66,
  }),
];
