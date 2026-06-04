import type { PromptFragment } from '@device-knowledge/core';

import { HOST_SOFTWARE_GENERATED_SOURCE, HOST_SOFTWARE_SCOPE, SOURCE_RETRIEVED_AT } from './common.js';

function fragment(input: Pick<PromptFragment, 'id' | 'section' | 'tier' | 'mode' | 'priority' | 'content'>): PromptFragment {
  return {
    ...input,
    source: HOST_SOFTWARE_GENERATED_SOURCE,
    scope: HOST_SOFTWARE_SCOPE,
    tags: ['host-software', 'prompt', input.section],
    language: 'en',
    status: 'active',
    confidence: 'high',
    lastReviewedAt: SOURCE_RETRIEVED_AT,
    citationLabel: `Host software prompt fragment: ${input.id}`,
  };
}

export const HOST_SOFTWARE_PROMPT_FRAGMENTS: PromptFragment[] = [
  fragment({
    id: 'host-software-runtime-boundaries',
    section: 'reasoning',
    tier: 'all',
    mode: 'all',
    priority: 86,
    content: [
      '**Host software runtime boundaries**:',
      '- First identify where code runs: browser, Electron main process, preload script, renderer, Node backend, build tool, or test runner.',
      '- Do not use Node APIs from a browser/renderer path unless the app intentionally exposes a narrow preload bridge.',
      '- Treat Vite dev server behavior, TypeScript typechecking, Electron packaging, and backend runtime behavior as separate failure surfaces.',
      '- Prefer official framework docs for runtime contracts before changing bundler aliases, sandbox flags, or TypeScript module settings.',
    ].join('\n'),
  }),
  fragment({
    id: 'host-software-debugging-loop',
    section: 'reasoning',
    tier: 'all',
    mode: 'all',
    priority: 82,
    content: [
      '**Desktop/frontend debugging loop**:',
      '- Reproduce the smallest failing path, then collect the exact console, terminal, and build error from the layer that failed.',
      '- For Electron, check main-process logs, preload exposure, renderer console, and registered IPC handlers separately.',
      '- For React/Vite, separate render bugs from dev-server/HMR bugs; Vite transforms TypeScript but does not replace `tsc --noEmit`.',
      '- For packaging/signing, verify local build output first, then signing identity, certificate variables, entitlements, and notarization credentials.',
    ].join('\n'),
  }),
  fragment({
    id: 'host-software-ipc-contract',
    section: 'tool_contract',
    tier: 'all',
    mode: 'all',
    priority: 88,
    content: [
      '**Electron IPC contract**:',
      '1. Register `ipcMain.handle(channel, handler)` in the main process before any renderer calls `ipcRenderer.invoke(channel, ...)`.',
      '2. Expose only a typed, minimal API through `contextBridge.exposeInMainWorld`; never expose raw `ipcRenderer` or unrestricted channel names.',
      '3. Validate payloads on the main-process boundary and return serializable values only.',
      '4. Keep channel names centralized so preload, renderer, and main process cannot drift silently.',
    ].join('\n'),
  }),
  fragment({
    id: 'host-software-build-contract',
    section: 'tool_contract',
    tier: 'all',
    mode: 'all',
    priority: 84,
    content: [
      '**Frontend build contract**:',
      '1. Run the narrow command that matches the failure: `tsc --noEmit` for types, `vite --host` or `npm run dev` for dev server, production build for bundling, and package build for Electron artifacts.',
      '2. Confirm the active Node version, package manager lockfile, workspace root, and resolved package version before changing source.',
      '3. Vite client env variables must use the project-defined public prefix, commonly `VITE_`; secrets stay in backend/main-process code.',
      '4. Fix TypeScript errors at the declaration or call boundary; avoid hiding contract problems with unchecked casts.',
    ].join('\n'),
  }),
];
