# Device Knowledge Design

Date: 2026-05-24
Status: Draft for implementation planning

## Background

RDK Studio already has useful RDK knowledge in `@rdstudio/rdk-knowledge`, and
Moss already has a `KnowledgeModule` contract that can consume it. Keeping that
knowledge inside the Studio host makes it harder for other agents to reuse,
harder to publish independently, and easier to accidentally mix device facts
with host-only execution concerns.

The next stage is to make `device-knowledge` the source repository for reusable
device knowledge while preserving RDK Studio behavior. RDK Studio should keep
the same user experience, same package import surface, and same D-Moss runtime
registration path during the first migration phase.

## Goals

- Make `device-knowledge` the source of truth for public device knowledge.
- Keep the first migration compatible with current RDK Studio imports:
  `@rdstudio/rdk-knowledge` and `rdkKnowledgeModule`.
- Define a data-first module schema that can be validated before being adapted
  into D-Moss contracts.
- Expose read-only MCP access for external agents without exposing host actions.
- Keep RDK Studio, Moss, and public knowledge responsibilities separate.

## Non-Goals

- Do not move RDK Studio UI, credentials, SSH sessions, flashing flows,
  OpenClaw, vendor plugins, environment gates, or approval policy into this
  repository.
- Do not make the MCP server execute commands, discover devices, read
  credentials, mutate local files, flash boards, send messages, or call host
  tools.
- Do not require RDK Studio page layout, visual style, or copy changes.
- Do not rename the first-phase package or remove existing public exports.
- Do not bind the public module schema directly to Studio or Moss runtime state.

## Recommended Repository Shape

```text
device-knowledge/
├── packages/core
├── packages/rdk-knowledge
├── packages/dmoss-adapter
├── packages/mcp-server
├── modules/
└── docs/
```

### `packages/core`

Owns the public data contracts and pure helpers:

- module manifest schema
- validation
- priority and conflict rules
- regex serialization and compilation helpers
- common indexes and serializers

It must not import RDK Studio, Moss runtime packages, host credentials, or UI
code.

### `packages/rdk-knowledge`

Owns official RDK knowledge data and the first-phase compatibility export:

- device profiles
- documentation indexes
- prompt fragments
- command patterns
- failure hints
- endorsed skills
- offline hardware knowledge assets
- `rdkKnowledgeModule`

In the first phase, the package name remains `@rdstudio/rdk-knowledge`, and
existing import paths must keep working.

### `packages/dmoss-adapter`

Converts data-first modules into the D-Moss `KnowledgeModule` contract. This is
the only package that should know how public device knowledge maps into
`@dmoss/core` knowledge contracts.

### `packages/mcp-server`

Exposes read-only MCP resources, tools, and prompts for external agents. It
should depend on `packages/core` and knowledge data packages, not on RDK Studio
server internals.

### `modules/`

Hosts data-first module examples and future community or user modules. These
modules should be understandable as data before any adapter code runs.

## Module Schema Direction

The public module format should be data-first and versioned:

```ts
type DeviceKnowledgeModuleManifest = {
  schemaVersion: 'device-knowledge.module.v1';
  id: string;
  name: string;
  origin: 'official' | 'community' | 'user';
  family?: string;
  priority: number;
  compatibility: {
    dmossKnowledgeModule: string;
    minRdkStudio?: string;
  };
};
```

Priority ranges:

| Origin | Range |
| --- | --- |
| `official` | `0` to `99` |
| `community` | `100` to `499` |
| `user` | `500` to `999` |

Regex values must not be stored as JavaScript `RegExp` instances. Store them as
serializable objects:

```ts
type SerializedRegex = {
  source: string;
  flags?: string;
};
```

Adapters and MCP query helpers may compile regex values at runtime after
validation.

## Conflict Rules

- Lower `priority` wins when two modules provide the same official identifier.
- More specific platform matches should win over family-level defaults.
- User modules may override community and official defaults only through
  explicit override fields.
- Conflicts must be deterministic and explainable by module id, origin,
  priority, and compatibility metadata.
- Validation must reject ambiguous duplicate ids that cannot be resolved by the
  priority rules.

## MCP Surface

The MCP server should be resource-first.

Resources:

- `device-knowledge://catalog`
- `device-knowledge://modules/{moduleId}/manifest`
- `device-knowledge://modules/{moduleId}/profiles`
- `device-knowledge://platforms/{platform}/profile`
- `device-knowledge://modules/{moduleId}/docs`
- `device-knowledge://modules/{moduleId}/prompt-fragments`
- `device-knowledge://modules/{moduleId}/command-patterns`
- `device-knowledge://modules/{moduleId}/failure-hints`
- `device-knowledge://modules/{moduleId}/skills`

Tools are bounded read-only queries:

- `device_knowledge_list_modules`
- `device_knowledge_get_profile`
- `device_knowledge_search_docs`
- `device_knowledge_match_failure_hints`
- `device_knowledge_classify_command`

Prompts:

- `device_knowledge_context`
- `device_troubleshooting_context`

All tools must be documented and implemented as read-only. They must not expose
SSH, shell execution, flashing, local credential access, device discovery, file
mutation, external messaging, or RDK Studio UI state.

## D-Moss Adapter Boundary

The adapter maps validated data modules into D-Moss contracts. It should not be
the source format.

Required adapter behavior:

- preserve `KnowledgeModule` ids and public metadata
- preserve prompt fragment ordering
- preserve command pattern matching semantics
- preserve failure hint matching semantics
- preserve endorsed skill references
- preserve offline markdown asset loading behavior for `hardware-knowledge.md`
- fail with clear validation errors before creating a D-Moss module

Moss remains host-neutral. Device-specific knowledge can be consumed by Moss,
but Moss core should not absorb RDK Studio product logic.

## RDK Studio Compatibility Boundary

First-phase Studio integration must remain intentionally boring:

```ts
export { rdkKnowledgeModule } from '@rdstudio/rdk-knowledge';
```

The following compatibility points are mandatory:

- Package name remains `@rdstudio/rdk-knowledge`.
- `rdkKnowledgeModule` remains exported from the package root.
- Existing device profile imports remain available, including
  `@rdstudio/rdk-knowledge/device-profiles`.
- Runtime `rdkKnowledgeModule.version` continues to match package version.
- `package.json` `exports`, `files`, and `types` remain equivalent to the
  current RDK Studio package until an explicit breaking-change plan exists.
- `hardware-knowledge.md` remains available in built output and packaged app
  output.
- RDK Studio registration code does not need UI, copy, or user workflow changes.
- Packaging and smoke scripts that copy or verify
  `node_modules/@rdstudio/rdk-knowledge` continue to pass.

RDK Studio-owned behavior stays in Studio:

- SSH and device command execution
- flashing
- OpenClaw
- vendor plugins
- environment-variable gates
- UI and settings state
- credentials
- approval and safety policy

## Migration Plan

1. Add `packages/core` schema and validation to `device-knowledge`.
2. Extract the current `rdstudio-web/packages/rdk-knowledge` package into this
   repository while keeping package name, exports, build output, and asset copy
   behavior unchanged.
3. Add `packages/mcp-server` using the data packages and `packages/core`. Do
   not reuse RDK Studio internal MCP assembly or host-only dependencies.
4. Update RDK Studio to consume the external `@rdstudio/rdk-knowledge` package
   through its existing import boundary.
5. Convert `packages/rdk-knowledge` internals from D-Moss-bound source code to
   data-first modules plus `packages/dmoss-adapter`.

The first implementation should stop after step 2 or 3 if compatibility risk is
high. The data-first conversion should happen only after Studio can consume the
external package without visible changes.

## Verification

Low-cost verification for the spec stage:

- `npm run verify` in `device-knowledge`
- manual review that the spec contains no placeholders, contradictory package
  names, or writable MCP tools

Required migration verification once code moves:

- package build for `@rdstudio/rdk-knowledge`
- import smoke for `@rdstudio/rdk-knowledge`
- import smoke for `@rdstudio/rdk-knowledge/device-profiles`
- assertion that `rdkKnowledgeModule.version` matches package version
- comparison of `package.json` `exports`, `files`, and `types` against the
  current RDK Studio package
- assertion that `hardware-knowledge.md` is included in package output
- RDK Studio integration smoke that registers `rdkKnowledgeModule`
- RDK Studio packaging smoke that finds
  `node_modules/@rdstudio/rdk-knowledge/dist/rdk-knowledge-module.js`
- comparison of prompt fragment order, command patterns, failure hints, device
  profile ids, and endorsed skills before and after migration

## Main Risks

- Keeping the export name is not enough if data ordering changes. Prompt
  fragments, command patterns, failure hints, profile order, and skill references
  must remain stable during the first migration.
- `hardware-knowledge.md` is a runtime asset, not just source text. Asset copy
  behavior must be verified in package and desktop app output.
- RDK Studio scripts currently mention `packages/rdk-knowledge` directly. The
  external package transition must either keep a local workspace bridge or update
  scripts in one controlled pass.
- Published package metadata can break consumers even when code exports look
  compatible. `exports`, `files`, and `types` must be checked explicitly.
- MCP server scope can expand accidentally. Any request for execution,
  discovery, write access, credentials, or host UI state must be rejected until a
  separate design exists.
- Binding schema to D-Moss too early would make non-Moss agents second-class
  consumers. The schema should describe device knowledge first and let adapters
  handle runtime contracts.

## Next Implementation Target

The next implementation target should be `packages/core` with a minimal schema,
validator, priority resolver, and serialized regex helper. This target is small,
testable, and unlocks both MCP and D-Moss adapter work without changing RDK
Studio behavior.
