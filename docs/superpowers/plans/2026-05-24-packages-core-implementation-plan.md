# Packages Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first `@device-knowledge/core` package with data-first schema types, validation, serialized regex helpers, priority/conflict resolution, and focused tests.

**Architecture:** `packages/core` stays pure and host-neutral. It exports TypeScript types and small validation helpers that future `rdk-knowledge`, `dmoss-adapter`, and `mcp-server` packages can consume without importing RDK Studio, Moss runtime packages, credentials, device execution, or UI state.

**Tech Stack:** Node.js 22.16+, npm workspaces, TypeScript 5.7, ESM, Node built-in `node:test`.

---

## Preconditions

- Do not touch `rdstudio-web` or `moss` for this plan.
- Do not implement D-Moss adapter behavior.
- Do not implement MCP resources, tools, or prompts.
- Do not move `@rdstudio/rdk-knowledge` source code yet.
- Keep this package free of external runtime dependencies.
- Run commands from `/Users/d-robotics/Desktop/RDK_Studio/device-knowledge`.
- Do not commit or push implementation changes unless the execution owner has
  explicitly approved implementation and commit policy for that run.

## File Structure

- Create `packages/core/package.json`: publishable workspace package metadata and scripts.
- Create `packages/core/README.md`: boundary and public API summary.
- Create `packages/core/tsconfig.json`: shared package TypeScript config.
- Create `packages/core/tsconfig.build.json`: build-only TypeScript config.
- Create `packages/core/src/index.ts`: public exports.
- Create `packages/core/src/types.ts`: data-first schema and result types.
- Create `packages/core/src/validation.ts`: manifest and module validation.
- Create `packages/core/src/regex.ts`: serialized regex helpers and legacy Robot Hub conversion.
- Create `packages/core/src/priority.ts`: priority range checks and conflict resolver.
- Create `packages/core/test/manifest-validation.spec.mjs`: manifest and module validation tests.
- Create `packages/core/test/regex.spec.mjs`: serialized regex tests.
- Create `packages/core/test/priority.spec.mjs`: priority and conflict tests.
- Modify `package.json`: add root package verification scripts.
- Modify `scripts/check-docs.mjs`: include `packages/core/README.md` and this plan.

## Task 1: Package Skeleton And Workspace Verification

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/README.md`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsconfig.build.json`
- Create: `packages/core/src/index.ts`
- Modify: `package.json`
- Modify: `scripts/check-docs.mjs`

- [ ] **Step 1: Create the package manifest**

Create `packages/core/package.json`:

```json
{
  "name": "@device-knowledge/core",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "license": "MIT",
  "description": "Core data schemas and validation helpers for device knowledge modules.",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "npm run build && node --test test/*.spec.mjs",
    "clean": "node -e \"const fs=require('fs');fs.rmSync('dist',{recursive:true,force:true})\""
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  },
  "engines": {
    "node": ">=22.16.0"
  },
  "keywords": [
    "device-knowledge",
    "schema",
    "robotics",
    "mcp",
    "dmoss"
  ]
}
```

- [ ] **Step 2: Create the package README**

Create `packages/core/README.md`:

```markdown
# @device-knowledge/core

Core schema and validation helpers for data-first device knowledge modules.

This package owns serializable data contracts, priority rules, conflict
resolution, and regex helpers. It does not import RDK Studio, Moss runtime
packages, MCP server code, credentials, SSH sessions, device execution, flashing
flows, or UI state.

## Public Surface

- `DeviceKnowledgeModuleManifest`
- `SerializedRegex`
- `validateManifest`
- `validateDeviceKnowledgeModule`
- `compileSerializedRegex`
- `serializedRegexFromLegacyRobotHubPattern`
- `resolveModuleConflict`

The D-Moss adapter and MCP server should consume this package instead of
redefining schema rules.
```

- [ ] **Step 3: Create TypeScript configs**

Create `packages/core/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "src",
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": [
    "src/**/*.ts"
  ]
}
```

Create `packages/core/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false
  }
}
```

- [ ] **Step 4: Create the initial public entrypoint**

Create `packages/core/src/index.ts`:

```ts
export const DEVICE_KNOWLEDGE_CORE_VERSION = '0.1.0';
```

- [ ] **Step 5: Add root verification scripts incrementally**

Modify only the root `package.json` `scripts` object. Keep every existing script
that is not listed below. Add or update these keys:

```json
{
  "scripts": {
    "verify": "npm run lint:docs && npm run test -w @device-knowledge/core",
    "lint:docs": "node scripts/check-docs.mjs",
    "test:core": "npm run test -w @device-knowledge/core"
  }
}
```

Keep the existing package metadata and any unrelated scripts unchanged.

- [ ] **Step 6: Add the new docs to docs lint**

Modify `scripts/check-docs.mjs` so `requiredFiles` includes:

```js
  'docs/superpowers/plans/2026-05-24-packages-core-implementation-plan.md',
  'packages/core/README.md',
```

- [ ] **Step 7: Install workspace dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created or updated, and npm installs TypeScript for the workspace.

- [ ] **Step 8: Verify the skeleton**

Run:

```bash
npm run verify
```

Expected: PASS with docs lint and `@device-knowledge/core` build output. Node
22 reports `tests 0` until test files are added in later tasks.

- [ ] **Step 9: Commit the skeleton**

Only commit after later tasks make `npm run verify` pass. Do not commit a failing skeleton by itself.

## Task 2: Manifest And Module Validation

**Files:**
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/validation.ts`
- Create: `packages/core/test/manifest-validation.spec.mjs`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing manifest validation tests**

Create `packages/core/test/manifest-validation.spec.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  validateDeviceKnowledgeModule,
  validateManifest,
} from '../dist/index.js';

test('validateManifest accepts a minimal official module manifest', () => {
  const result = validateManifest({
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'rdk',
    name: 'RDK Development Kit',
    origin: 'official',
    priority: 0,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
      minRdkStudio: '0.1.0',
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, 'rdk');
  assert.equal(result.value.origin, 'official');
});

test('validateManifest rejects unknown schema versions', () => {
  const result = validateManifest({
    schemaVersion: 'device-knowledge.module.v0',
    id: 'rdk',
    name: 'RDK Development Kit',
    origin: 'official',
    priority: 0,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-schema-version');
});

test('validateManifest rejects priority outside origin range', () => {
  const result = validateManifest({
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'community-rdk',
    name: 'Community RDK',
    origin: 'community',
    priority: 50,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.code === 'invalid-priority-range'), true);
});

test('validateDeviceKnowledgeModule accepts serializable data arrays', () => {
  const result = validateDeviceKnowledgeModule({
    manifest: {
      schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
      id: 'rdk',
      name: 'RDK Development Kit',
      origin: 'official',
      priority: 0,
      compatibility: {
        dmossKnowledgeModule: '^0.3.1',
      },
    },
    profiles: {},
    docs: [],
    promptFragments: [],
    commandPatterns: [],
    failureHints: [],
    skills: [],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.docs, []);
});

test('validateDeviceKnowledgeModule rejects missing manifest', () => {
  const result = validateDeviceKnowledgeModule({
    profiles: {},
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.path === 'manifest'), true);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm run test -w @device-knowledge/core
```

Expected: FAIL because `DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION`, `validateManifest`, and `validateDeviceKnowledgeModule` are not exported.

- [ ] **Step 3: Add schema and result types**

Create `packages/core/src/types.ts`:

```ts
export const DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION = 'device-knowledge.module.v1';

export type DeviceKnowledgeModuleOrigin = 'official' | 'community' | 'user';

export interface DeviceKnowledgeModuleManifest {
  schemaVersion: typeof DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION;
  id: string;
  name: string;
  origin: DeviceKnowledgeModuleOrigin;
  family?: string;
  priority: number;
  compatibility: {
    dmossKnowledgeModule: string;
    minRdkStudio?: string;
  };
}

export interface SerializedRegex {
  source: string;
  flags?: string;
}

export interface DeviceKnowledgeModuleData {
  manifest: DeviceKnowledgeModuleManifest;
  profiles?: Record<string, unknown>;
  docs?: unknown[];
  promptFragments?: unknown[];
  commandPatterns?: unknown[];
  failureHints?: unknown[];
  skills?: unknown[];
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T; issues: [] }
  | { ok: false; issues: ValidationIssue[] };

export function validationOk<T>(value: T): ValidationResult<T> {
  return { ok: true, value, issues: [] };
}

export function validationFailed<T = never>(issues: ValidationIssue[]): ValidationResult<T> {
  return { ok: false, issues };
}
```

- [ ] **Step 4: Add manifest and module validation**

Create `packages/core/src/validation.ts`:

```ts
import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
  type DeviceKnowledgeModuleManifest,
  type DeviceKnowledgeModuleOrigin,
  type ValidationIssue,
  type ValidationResult,
  validationFailed,
  validationOk,
} from './types.js';

const ORIGINS = new Set<DeviceKnowledgeModuleOrigin>(['official', 'community', 'user']);

const PRIORITY_RANGES: Record<DeviceKnowledgeModuleOrigin, { min: number; max: number }> = {
  official: { min: 0, max: 99 },
  community: { min: 100, max: 499 },
  user: { min: 500, max: 999 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  issues: ValidationIssue[],
  input: Record<string, unknown>,
  key: string,
  path = key,
): string | undefined {
  const value = input[key];
  if (typeof value === 'string' && value.trim()) return value;
  issues.push({
    path,
    code: 'invalid-string',
    message: `${path} must be a non-empty string`,
  });
  return undefined;
}

export function validateManifest(input: unknown): ValidationResult<DeviceKnowledgeModuleManifest> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return validationFailed([
      { path: '', code: 'invalid-object', message: 'manifest must be an object' },
    ]);
  }

  const schemaVersion = input.schemaVersion;
  if (schemaVersion !== DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      code: 'invalid-schema-version',
      message: `schemaVersion must be ${DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION}`,
    });
  }

  const id = requireString(issues, input, 'id');
  const name = requireString(issues, input, 'name');
  const originValue = input.origin;
  const origin = typeof originValue === 'string' && ORIGINS.has(originValue as DeviceKnowledgeModuleOrigin)
    ? (originValue as DeviceKnowledgeModuleOrigin)
    : undefined;
  if (!origin) {
    issues.push({
      path: 'origin',
      code: 'invalid-origin',
      message: 'origin must be official, community, or user',
    });
  }

  const priority = input.priority;
  if (!Number.isInteger(priority)) {
    issues.push({
      path: 'priority',
      code: 'invalid-priority',
      message: 'priority must be an integer',
    });
  } else if (origin) {
    const range = PRIORITY_RANGES[origin];
    if (priority < range.min || priority > range.max) {
      issues.push({
        path: 'priority',
        code: 'invalid-priority-range',
        message: `${origin} priority must be between ${range.min} and ${range.max}`,
      });
    }
  }

  if (input.family !== undefined && (typeof input.family !== 'string' || !input.family.trim())) {
    issues.push({
      path: 'family',
      code: 'invalid-string',
      message: 'family must be a non-empty string when provided',
    });
  }

  if (!isRecord(input.compatibility)) {
    issues.push({
      path: 'compatibility',
      code: 'invalid-object',
      message: 'compatibility must be an object',
    });
  } else {
    requireString(issues, input.compatibility, 'dmossKnowledgeModule', 'compatibility.dmossKnowledgeModule');
    if (
      input.compatibility.minRdkStudio !== undefined &&
      (typeof input.compatibility.minRdkStudio !== 'string' || !input.compatibility.minRdkStudio.trim())
    ) {
      issues.push({
        path: 'compatibility.minRdkStudio',
        code: 'invalid-string',
        message: 'compatibility.minRdkStudio must be a non-empty string when provided',
      });
    }
  }

  if (issues.length) return validationFailed(issues);

  const compatibility = input.compatibility as {
    dmossKnowledgeModule: string;
    minRdkStudio?: string;
  };

  return validationOk({
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: id!,
    name: name!,
    origin: origin!,
    family: typeof input.family === 'string' ? input.family : undefined,
    priority: priority as number,
    compatibility: {
      dmossKnowledgeModule: compatibility.dmossKnowledgeModule,
      minRdkStudio: compatibility.minRdkStudio,
    },
  });
}

function validateOptionalArray(
  issues: ValidationIssue[],
  input: Record<string, unknown>,
  key: keyof DeviceKnowledgeModuleData,
): void {
  const value = input[key];
  if (value !== undefined && !Array.isArray(value)) {
    issues.push({
      path: String(key),
      code: 'invalid-array',
      message: `${String(key)} must be an array when provided`,
    });
  }
}

export function validateDeviceKnowledgeModule(input: unknown): ValidationResult<DeviceKnowledgeModuleData> {
  if (!isRecord(input)) {
    return validationFailed([
      { path: '', code: 'invalid-object', message: 'module must be an object' },
    ]);
  }

  const manifestResult = validateManifest(input.manifest);
  const issues: ValidationIssue[] = manifestResult.ok ? [] : manifestResult.issues.map((issue) => ({
    ...issue,
    path: issue.path ? `manifest.${issue.path}` : 'manifest',
  }));

  const profiles = input.profiles;
  if (profiles !== undefined && !isRecord(profiles)) {
    issues.push({
      path: 'profiles',
      code: 'invalid-object',
      message: 'profiles must be an object when provided',
    });
  }

  validateOptionalArray(issues, input, 'docs');
  validateOptionalArray(issues, input, 'promptFragments');
  validateOptionalArray(issues, input, 'commandPatterns');
  validateOptionalArray(issues, input, 'failureHints');
  validateOptionalArray(issues, input, 'skills');

  if (issues.length) return validationFailed(issues);
  if (!manifestResult.ok) return validationFailed(issues);

  return validationOk({
    manifest: manifestResult.value,
    profiles: profiles as Record<string, unknown> | undefined,
    docs: input.docs as unknown[] | undefined,
    promptFragments: input.promptFragments as unknown[] | undefined,
    commandPatterns: input.commandPatterns as unknown[] | undefined,
    failureHints: input.failureHints as unknown[] | undefined,
    skills: input.skills as unknown[] | undefined,
  });
}
```

- [ ] **Step 5: Export the validation API**

Modify `packages/core/src/index.ts`:

```ts
export {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
  type DeviceKnowledgeModuleManifest,
  type DeviceKnowledgeModuleOrigin,
  type SerializedRegex,
  type ValidationIssue,
  type ValidationResult,
} from './types.js';

export {
  validateDeviceKnowledgeModule,
  validateManifest,
} from './validation.js';
```

- [ ] **Step 6: Run manifest validation tests**

Run:

```bash
npm run test -w @device-knowledge/core
```

Expected: PASS for `manifest-validation.spec.mjs` if no other test files exist yet.

## Task 3: Serialized Regex Helpers

**Files:**
- Create: `packages/core/src/regex.ts`
- Create: `packages/core/test/regex.spec.mjs`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing regex tests**

Create `packages/core/test/regex.spec.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  compileSerializedRegex,
  serializedRegexFromLegacyRobotHubPattern,
  validateSerializedRegex,
} from '../dist/index.js';

test('validateSerializedRegex accepts source and flags', () => {
  const result = validateSerializedRegex({ source: 'rdk.*x5', flags: 'i' });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { source: 'rdk.*x5', flags: 'i' });
});

test('validateSerializedRegex rejects duplicate flags', () => {
  const result = validateSerializedRegex({ source: 'rdk', flags: 'ii' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-regex-flags');
});

test('validateSerializedRegex rejects invalid source syntax', () => {
  const result = validateSerializedRegex({ source: '(', flags: 'i' });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-regex-source');
});

test('compileSerializedRegex compiles only after validation', () => {
  const pattern = compileSerializedRegex({ source: 'error:\\s+(.+)', flags: 'i' });

  assert.equal(pattern.test('ERROR: failed'), true);
});

test('compileSerializedRegex rejects invalid source syntax', () => {
  assert.throws(
    () => compileSerializedRegex({ source: '(', flags: 'i' }),
    /Invalid regular expression/,
  );
});

test('serializedRegexFromLegacyRobotHubPattern preserves old i flag behavior', () => {
  const serialized = serializedRegexFromLegacyRobotHubPattern('permission denied');
  const pattern = compileSerializedRegex(serialized);

  assert.deepEqual(serialized, { source: 'permission denied', flags: 'i' });
  assert.equal(pattern.test('Permission Denied'), true);
});
```

- [ ] **Step 2: Run regex tests to verify they fail**

Run:

```bash
npm run test -w @device-knowledge/core
```

Expected: FAIL because regex helper exports do not exist.

- [ ] **Step 3: Implement serialized regex helpers**

Create `packages/core/src/regex.ts`:

```ts
import {
  type SerializedRegex,
  type ValidationIssue,
  type ValidationResult,
  validationFailed,
  validationOk,
} from './types.js';

const VALID_REGEX_FLAGS = new Set(['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateFlags(flags: string): boolean {
  const seen = new Set<string>();
  for (const flag of flags) {
    if (!VALID_REGEX_FLAGS.has(flag) || seen.has(flag)) return false;
    seen.add(flag);
  }
  return true;
}

export function validateSerializedRegex(input: unknown): ValidationResult<SerializedRegex> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return validationFailed([
      { path: '', code: 'invalid-object', message: 'regex must be an object' },
    ]);
  }

  if (typeof input.source !== 'string' || !input.source.length) {
    issues.push({
      path: 'source',
      code: 'invalid-regex-source',
      message: 'source must be a non-empty string',
    });
  }

  if (input.flags !== undefined) {
    if (typeof input.flags !== 'string' || !validateFlags(input.flags)) {
      issues.push({
        path: 'flags',
        code: 'invalid-regex-flags',
        message: 'flags must contain unique JavaScript regex flags',
      });
    }
  }

  if (issues.length === 0) {
    try {
      new RegExp(input.source as string, input.flags as string | undefined);
    } catch (err) {
      issues.push({
        path: 'source',
        code: 'invalid-regex-source',
        message: err instanceof Error ? err.message : 'source must compile as a JavaScript RegExp',
      });
    }
  }

  if (issues.length) return validationFailed(issues);

  return validationOk({
    source: input.source as string,
    flags: input.flags as string | undefined,
  });
}

export function compileSerializedRegex(input: SerializedRegex): RegExp {
  const result = validateSerializedRegex(input);
  if (!result.ok) {
    const message = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    throw new Error(`Invalid serialized regex: ${message}`);
  }
  return new RegExp(result.value.source, result.value.flags);
}

export function serializedRegexFromLegacyRobotHubPattern(pattern: string): SerializedRegex {
  if (typeof pattern !== 'string' || !pattern.length) {
    throw new Error('Legacy Robot Hub regex pattern must be a non-empty string');
  }
  return { source: pattern, flags: 'i' };
}
```

- [ ] **Step 4: Export the regex API**

Modify `packages/core/src/index.ts` to include:

```ts
export {
  compileSerializedRegex,
  serializedRegexFromLegacyRobotHubPattern,
  validateSerializedRegex,
} from './regex.js';
```

Keep existing exports from Task 2.

- [ ] **Step 5: Run regex tests**

Run:

```bash
npm run test -w @device-knowledge/core
```

Expected: PASS for manifest and regex tests.

## Task 4: Priority And Conflict Resolver

**Files:**
- Create: `packages/core/src/priority.ts`
- Create: `packages/core/test/priority.spec.mjs`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing priority tests**

Create `packages/core/test/priority.spec.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPriorityRange,
  resolveModuleConflict,
  validateModulePriority,
} from '../dist/index.js';

test('getPriorityRange returns official range', () => {
  assert.deepEqual(getPriorityRange('official'), { min: 0, max: 99 });
});

test('validateModulePriority rejects community priority in official range', () => {
  const result = validateModulePriority('community', 20);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'invalid-priority-range');
});

test('resolveModuleConflict prefers platform specificity over family default', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk-family',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'family',
    },
    {
      moduleId: 'official-rdk-x5',
      origin: 'official',
      priority: 10,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.value.winner.moduleId, 'official-rdk-x5');
  assert.equal(result.value.rejected[0].moduleId, 'official-rdk-family');
});

test('resolveModuleConflict requires explicit override for user winner over official', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'user-rdk',
      origin: 'user',
      priority: 500,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'missing-explicit-override');
});

test('resolveModuleConflict rejects ambiguous same-priority candidates', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk-a',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'official-rdk-b',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'ambiguous-conflict');
});

test('resolveModuleConflict allows explicit user override', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'official-rdk',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'user-rdk',
      origin: 'user',
      priority: 500,
      targetId: 'rdk-x5',
      specificity: 'platform',
      override: true,
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.value.winner.moduleId, 'user-rdk');
});

test('resolveModuleConflict rejects duplicate module and target pairs', () => {
  const result = resolveModuleConflict([
    {
      moduleId: 'rdk',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
    {
      moduleId: 'rdk',
      origin: 'official',
      priority: 0,
      targetId: 'rdk-x5',
      specificity: 'platform',
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'duplicate-module-target');
});
```

- [ ] **Step 2: Run priority tests to verify they fail**

Run:

```bash
npm run test -w @device-knowledge/core
```

Expected: FAIL because priority helpers do not exist.

- [ ] **Step 3: Implement priority and conflict helpers**

Create `packages/core/src/priority.ts`:

```ts
import {
  type DeviceKnowledgeModuleOrigin,
  type ValidationIssue,
  type ValidationResult,
  validationFailed,
  validationOk,
} from './types.js';

export type ModuleSpecificity = 'family' | 'platform';

export interface ModuleConflictCandidate {
  moduleId: string;
  origin: DeviceKnowledgeModuleOrigin;
  priority: number;
  targetId: string;
  specificity: ModuleSpecificity;
  override?: boolean;
}

export interface ModuleConflictResolution {
  winner: ModuleConflictCandidate;
  rejected: ModuleConflictCandidate[];
  explanation: string;
}

const PRIORITY_RANGES: Record<DeviceKnowledgeModuleOrigin, { min: number; max: number }> = {
  official: { min: 0, max: 99 },
  community: { min: 100, max: 499 },
  user: { min: 500, max: 999 },
};

export function getPriorityRange(origin: DeviceKnowledgeModuleOrigin): { min: number; max: number } {
  return PRIORITY_RANGES[origin];
}

export function validateModulePriority(
  origin: DeviceKnowledgeModuleOrigin,
  priority: number,
): ValidationResult<number> {
  const range = getPriorityRange(origin);
  if (!Number.isInteger(priority) || priority < range.min || priority > range.max) {
    return validationFailed([
      {
        path: 'priority',
        code: 'invalid-priority-range',
        message: `${origin} priority must be between ${range.min} and ${range.max}`,
      },
    ]);
  }
  return validationOk(priority);
}

function specificityWeight(specificity: ModuleSpecificity): number {
  return specificity === 'platform' ? 0 : 1;
}

function sortCandidates(candidates: ModuleConflictCandidate[]): ModuleConflictCandidate[] {
  return [...candidates].sort((a, b) => {
    const sa = specificityWeight(a.specificity);
    const sb = specificityWeight(b.specificity);
    if (sa !== sb) return sa - sb;

    if (a.override !== b.override) return a.override ? -1 : 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.moduleId.localeCompare(b.moduleId);
  });
}

export function resolveModuleConflict(
  candidates: ModuleConflictCandidate[],
): ValidationResult<ModuleConflictResolution> {
  const issues: ValidationIssue[] = [];
  if (candidates.length === 0) {
    return validationFailed([
      { path: '', code: 'empty-candidates', message: 'at least one candidate is required' },
    ]);
  }

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const priority = validateModulePriority(candidate.origin, candidate.priority);
    if (!priority.ok) issues.push(...priority.issues);

    const key = `${candidate.moduleId}:${candidate.targetId}`;
    if (seen.has(key)) {
      issues.push({
        path: key,
        code: 'duplicate-module-target',
        message: `duplicate module target candidate ${key}`,
      });
    }
    seen.add(key);
  }

  if (issues.length) return validationFailed(issues);

  const sorted = sortCandidates(candidates);
  const winner = sorted[0];
  const runnerUp = sorted[1];
  if (
    runnerUp &&
    specificityWeight(winner.specificity) === specificityWeight(runnerUp.specificity) &&
    Boolean(winner.override) === Boolean(runnerUp.override) &&
    winner.priority === runnerUp.priority
  ) {
    return validationFailed([
      {
        path: winner.targetId,
        code: 'ambiguous-conflict',
        message: `${winner.moduleId} and ${runnerUp.moduleId} have the same conflict rank`,
      },
    ]);
  }

  const hasOfficial = candidates.some((candidate) => candidate.origin === 'official');
  if (hasOfficial && winner.origin !== 'official' && !winner.override) {
    return validationFailed([
      {
        path: winner.moduleId,
        code: 'missing-explicit-override',
        message: `${winner.moduleId} must set override=true to override official knowledge`,
      },
    ]);
  }

  return validationOk({
    winner,
    rejected: sorted.slice(1),
    explanation: `${winner.moduleId} wins ${winner.targetId} by specificity=${winner.specificity}, override=${Boolean(
      winner.override,
    )}, priority=${winner.priority}`,
  });
}
```

- [ ] **Step 4: Export the priority API**

Modify `packages/core/src/index.ts` to include:

```ts
export {
  getPriorityRange,
  resolveModuleConflict,
  validateModulePriority,
  type ModuleConflictCandidate,
  type ModuleConflictResolution,
  type ModuleSpecificity,
} from './priority.js';
```

Keep existing exports from Tasks 2 and 3.

- [ ] **Step 5: Run priority tests**

Run:

```bash
npm run test -w @device-knowledge/core
```

Expected: PASS for manifest, regex, and priority tests.

## Task 5: Final Verification And Commit

**Files:**
- Review: `package.json`
- Review: `scripts/check-docs.mjs`
- Review: `packages/core/**`

- [ ] **Step 1: Run package typecheck**

Run:

```bash
npm run typecheck -w @device-knowledge/core
```

Expected: PASS with exit code 0.

- [ ] **Step 2: Run package tests**

Run:

```bash
npm run test -w @device-knowledge/core
```

Expected: PASS with all Node test files green.

- [ ] **Step 3: Run root verification**

Run:

```bash
npm run verify
```

Expected: PASS. Output should include `[check-docs] checked` and successful `@device-knowledge/core` tests.

- [ ] **Step 4: Check for whitespace errors**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Check root verification scripts**

Run:

```bash
node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));for(const key of ['verify','lint:docs','test:core']){if(!pkg.scripts?.[key]) throw new Error('missing script '+key);}console.log(JSON.stringify({verify:pkg.scripts.verify,lintDocs:pkg.scripts['lint:docs'],testCore:pkg.scripts['test:core']}));"
```

Expected: JSON output containing the three scripts, with `lint:docs` still set
to `node scripts/check-docs.mjs`.

- [ ] **Step 6: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected changed files are limited to:

```text
package.json
package-lock.json
scripts/check-docs.mjs
docs/superpowers/plans/2026-05-24-packages-core-implementation-plan.md
packages/core/README.md
packages/core/package.json
packages/core/tsconfig.json
packages/core/tsconfig.build.json
packages/core/src/index.ts
packages/core/src/types.ts
packages/core/src/validation.ts
packages/core/src/regex.ts
packages/core/src/priority.ts
packages/core/test/manifest-validation.spec.mjs
packages/core/test/regex.spec.mjs
packages/core/test/priority.spec.mjs
```

- [ ] **Step 7: Commit if implementation commit policy was approved**

Run:

```bash
git add package.json package-lock.json scripts/check-docs.mjs docs/superpowers/plans/2026-05-24-packages-core-implementation-plan.md packages/core
git commit -m "feat: add device knowledge core schema package"
```

Expected: one focused commit. Do not push until verification output has been reviewed.
Skip this step if the execution owner has not approved committing implementation
changes in the current run.

## Self-Review Checklist

- Spec coverage:
  - `packages/core` owns public contracts and pure helpers.
  - Serialized regex stores `{ source, flags }`.
  - Legacy Robot Hub string patterns convert to `{ source, flags: 'i' }`.
  - Priority ranges match official, community, and user ranges from the spec.
  - Conflict resolver is deterministic and explainable.
  - No D-Moss adapter, MCP server, RDK Studio, SSH, flashing, credentials, or UI behavior is implemented.

- Placeholder scan:
  - No step contains unresolved placeholder wording.
  - Every code-changing step includes concrete file content or an exact snippet.

- Type consistency:
  - `SerializedRegex` is exported from `types.ts`.
  - `compileSerializedRegex` accepts `SerializedRegex`.
  - `resolveModuleConflict` returns `ValidationResult<ModuleConflictResolution>`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-24-packages-core-implementation-plan.md`. Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.

Do not begin execution until the spec and this plan are approved.
