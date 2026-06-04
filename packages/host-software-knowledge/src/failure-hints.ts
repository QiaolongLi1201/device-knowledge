import type { FailureHint, SerializedRegex } from '@device-knowledge/core';

import { HOST_SOFTWARE_SCOPE, SOURCE_RETRIEVED_AT } from './common.js';

interface HostFailureHintInput {
  id: string;
  errorPattern: SerializedRegex;
  suggestion: string;
  docUrl: string;
  tags: string[];
  priority?: number;
}

function hint(input: HostFailureHintInput): FailureHint {
  return {
    id: input.id,
    errorPattern: input.errorPattern,
    suggestion: input.suggestion,
    docUrl: input.docUrl,
    source: {
      type: 'official-doc',
      url: input.docUrl,
      retrievedAt: SOURCE_RETRIEVED_AT,
    },
    scope: HOST_SOFTWARE_SCOPE,
    tags: ['host-software', 'failure-hint', ...input.tags],
    language: 'en',
    status: 'active',
    confidence: 'high',
    priority: input.priority ?? 70,
    lastReviewedAt: SOURCE_RETRIEVED_AT,
    citationLabel: `Host software failure hint: ${input.id}`,
  };
}

export const HOST_SOFTWARE_FAILURE_HINTS: FailureHint[] = [
  hint({
    id: 'host-failure-electron-preload-sandbox',
    errorPattern: {
      source: 'require is not defined|Cannot find module .+ in preload|process is not defined|module is not defined',
      flags: 'i',
    },
    suggestion: 'Preload/renderer sandbox mismatch. Keep Node-only code in the main process or preload, expose a narrow API through `contextBridge`, and verify the preload path is loaded by the BrowserWindow configuration.',
    docUrl: 'https://www.electronjs.org/docs/latest/tutorial/tutorial-preload',
    tags: ['electron', 'preload', 'sandbox'],
    priority: 86,
  }),
  hint({
    id: 'host-failure-electron-ipc-unregistered',
    errorPattern: {
      source: 'No handler registered|Error invoking remote method|Unable to deserialize cloned data|An object could not be cloned',
      flags: 'i',
    },
    suggestion: 'IPC contract drift. Confirm `ipcMain.handle` is registered before renderer invoke, channel names match exactly, and payload/return values are structured-clone serializable.',
    docUrl: 'https://www.electronjs.org/docs/latest/tutorial/ipc',
    tags: ['electron', 'ipc', 'contextBridge'],
    priority: 88,
  }),
  hint({
    id: 'host-failure-vite-hmr-websocket',
    errorPattern: {
      source: '\\[vite\\].*(failed to connect|hmr)|WebSocket connection.*(failed|closed)|hmr update.*failed',
      flags: 'i',
    },
    suggestion: 'Vite HMR WebSocket failure. Check dev-server host/port, reverse proxy or Electron renderer origin, `server.hmr` settings, and browser console network errors before changing React state code.',
    docUrl: 'https://vite.dev/guide/features.html#hot-module-replacement',
    tags: ['vite', 'hmr', 'websocket'],
    priority: 82,
  }),
  hint({
    id: 'host-failure-typescript-typecheck',
    errorPattern: {
      source: 'TS(2322|2307|2741|7006|18003)|Type .+ is not assignable|Cannot find module .+ or its corresponding type declarations',
      flags: 'i',
    },
    suggestion: 'TypeScript contract failure. Run `tsc --noEmit -p <tsconfig>` at the package boundary, inspect the first real diagnostic, and fix declarations/import paths rather than relying on unchecked casts.',
    docUrl: 'https://www.typescriptlang.org/docs/handbook/compiler-options.html',
    tags: ['typescript', 'tsc', 'typecheck'],
    priority: 84,
  }),
  hint({
    id: 'host-failure-electron-builder-signing',
    errorPattern: {
      source: 'CSC_LINK|No identity found|codesign.*(failed|exited)|The specified item could not be found in the keychain|notarization.*failed|Developer ID Application',
      flags: 'i',
    },
    suggestion: 'Packaging signing failure. Verify certificate/keychain access or CI signing variables, confirm unsigned packaging works first, then check electron-builder signing and notarization configuration for the target OS.',
    docUrl: 'https://www.electron.build/code-signing',
    tags: ['electron-builder', 'code-signing', 'packaging'],
    priority: 80,
  }),
  hint({
    id: 'host-failure-dev-server-port-in-use',
    errorPattern: {
      source: 'EADDRINUSE|listen EADDRINUSE|address already in use|port\\s+\\d+\\s+is\\s+already\\s+in\\s+use',
      flags: 'i',
    },
    suggestion: 'Dev-server/HTTP port is already held — usually a leftover process from a previous run, not a code bug. Find the holder (`lsof -nP -iTCP:<port> -sTCP:LISTEN` on macOS/Linux, `netstat -ano | findstr :<port>` on Windows), stop it, then restart; or start on a different port. Confirm the port is free before assuming the new server bound.',
    docUrl: 'https://nodejs.org/api/errors.html#common-system-errors',
    tags: ['node', 'dev-server', 'port', 'eaddrinuse'],
    priority: 84,
  }),
];
