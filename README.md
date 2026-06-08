# Device Knowledge

Open, source-backed device knowledge packages for robotics agents.

Device Knowledge is the source repository for data-only device knowledge that can
be bundled with RDK Studio, adapted into [Moss](https://github.com/D-Robotics/moss),
and later published as remote knowledge packages. It ships a top-level module
schema with validation, official D-Robotics RDK data plus starter
Jetson/Raspberry Pi/Rockchip packages, a host/desktop software knowledge package,
source-backed workflow guides, a Moss adapter, an authoring lint, and a versioned
artifact builder.

Record-level provenance is part of the v2 core schema; v1 inputs are still
accepted through a legacy migration path. Remote update hosting and cryptographic
signature verification remain host/release responsibilities.

## Positioning

Device Knowledge is intentionally **runtime-neutral**. It carries data and
contracts, not agent execution:

- The knowledge packages export serializable data only — no credentials, SSH
  sessions, device access, or product UI.
- Agent runtimes consume that data. [Moss](https://github.com/D-Robotics/moss)
  consumes it as a `KnowledgeModule` through `@device-knowledge/dmoss-adapter`;
  other agents, MCP servers, CLIs, and eval harnesses can consume the same data
  through the core context-pack helper.
- RDK Studio bundles a built artifact and consumes newer compatible knowledge
  releases without changing the user experience.

## Repository Scope

This repository contains the parts of device knowledge that can be maintained
independently from any product shell.

| Package | Role |
| --- | --- |
| `@device-knowledge/core` | Module schema, validation, provenance types, and the runtime-neutral agent context-pack helper |
| `@device-knowledge/rdk-knowledge` | Official D-Robotics RDK device knowledge module data |
| `@device-knowledge/jetson-knowledge` | NVIDIA Jetson starter knowledge module data |
| `@device-knowledge/rpi-knowledge` | Raspberry Pi starter knowledge module data |
| `@device-knowledge/rk-knowledge` | Rockchip RK starter knowledge module data |
| `@device-knowledge/host-software-knowledge` | Host/desktop and frontend software-engineering knowledge module data |
| `@device-knowledge/dmoss-adapter` | Adapter that converts modules into the Moss `KnowledgeModule` contract (`@rdk-moss/core`) |
| `packages/mcp-server` | Placeholder for a planned standalone read-only MCP server (resources, tools, prompts) |

Plus `modules/` (data-first module bundles and examples) and `docs/`
(architecture and release-acceptance notes).

## Consuming The Knowledge

There are two supported consumption paths and they share the same source data.

**Moss `KnowledgeModule`** — for the Moss runtime and RDK Studio, use the adapter
to convert a data module into the Moss contract from `@rdk-moss/core`:

```ts
import { toKnowledgeModule } from '@device-knowledge/dmoss-adapter';
import { rdkKnowledgeModuleData } from '@device-knowledge/rdk-knowledge';

const module = toKnowledgeModule(rdkKnowledgeModuleData);
```

**Runtime-neutral context pack** — for agents that need the same trusted data
without linking against Moss runtime types, `@device-knowledge/core` exposes a
context-pack helper:

```ts
import { buildAgentKnowledgeContext } from '@device-knowledge/core';
import { rdkKnowledgeModuleData } from '@device-knowledge/rdk-knowledge';

const context = buildAgentKnowledgeContext(rdkKnowledgeModuleData, {
  platform: 'rdk-x5',
  maxDocs: 8,
});

console.log(context.markdown);
```

The returned object includes filtered profiles, source-backed docs, prompt
fragments, failure hints, endorsed skills, workflow guides, and a compact
Markdown rendering. Claude/Codex/Qwen-style tools, MCP servers, CLIs, and eval
harnesses can use this path directly.

## Build RDK Artifact

RDK Studio consumes data-only artifacts from this repo. After editing knowledge
data in `packages/*-knowledge/src/**`, verify the workspace and build a versioned
multi-module artifact:

```bash
npm run verify
npm run build:rdk-artifact -- --version 2026.05.25.1 --min-rdk-studio 1.2.0
```

The output is `dist/artifacts/rdk-device-knowledge.artifact.json`. It contains
the official RDK module plus starter Jetson, Raspberry Pi, and Rockchip modules.
Publish that JSON for remote updates, or sync it into RDK Studio's bundled
baseline before a desktop release.

The build script also accepts `--out <path>`. If `--version` is omitted, it uses
`DEVICE_KNOWLEDGE_VERSION` or falls back to the RDK module manifest version. If
`--min-rdk-studio` is omitted, it can be supplied through `MIN_RDK_STUDIO_VERSION`.

## Trusted Knowledge Concepts

- A **Trusted Knowledge Package** is the release unit consumed by hosts. Today it
  is the `rdk-device-knowledge.artifact.v1` JSON artifact built from
  `@device-knowledge/*-knowledge`. The artifact contains checksum metadata for
  the payload and each module; hosts must reject unsupported signature fields
  until real public-key verification is configured.
- A **KnowledgeRecord** is a source-backed fact or host-facing entry. Module
  arrays include documentation index entries, prompt fragments, command patterns,
  failure hints, endorsed skills, and workflow guides, all with typed `id`,
  `source`, optional compatibility scope, status, confidence, review metadata, and
  citation fields.
- A **WorkflowGuide** is a task-shaped record with triggers, prerequisites,
  ordered steps, verification checks, safety notes, related sources, and an
  expected outcome — operational quality without requiring a host to execute
  commands.
- A **Chunk** is a host-facing slice of a record. A standalone `KnowledgeChunk`
  type is roadmap; document records already carry a `chunkPolicy` hint for
  host-side retrieval.
- **Source/provenance** includes source type, URL or repository, commit, document
  version, and retrieval time when available.
- **Bundled knowledge** is the offline baseline shipped with RDK Studio. **Remote
  knowledge updates** use the same artifact shape plus host-side fetch,
  verification, cache, and rollback policy in RDK Studio.

## Goals

- Maintain RDK and future device knowledge in a public, standalone repository.
- Publish reusable knowledge packages that do not depend on RDK Studio runtime
  state, credentials, SSH sessions, or UI code.
- Carry source/provenance metadata so records can be reviewed, cited, and
  accepted as trusted knowledge.
- Provide a read-only MCP server so agents can read device profiles,
  documentation indexes, failure hints, and prompt context on demand (planned;
  see `packages/mcp-server`).
- Keep Moss integration as an adapter layer, not as the primary knowledge format.
- Support hot-pluggable community or user modules through a stable module schema
  and priority rules.

## Development

Use Node 22.16 or newer for this workspace.

```bash
npm install
npm run verify
```

`npm run verify` runs:

1. Documentation lint (required READMEs and local Markdown links).
2. Core schema/validation tests.
3. Adapter tests (Moss `KnowledgeModule` conversion via the published `@rdk-moss/core`).
4. Knowledge-module tests for RDK, Jetson, Raspberry Pi, and Rockchip.
5. Build-artifact version check.
6. Knowledge authoring lint.

The adapter pulls Moss core from npm (`@rdk-moss/core`), so the whole
workspace installs, builds, and tests standalone — no sibling repositories
required.

## What Does Not Belong Here

Keep runtime and product concerns out of this repository. Do not add:

- Device mutation, SSH execution, flashing, or credential handling.
- Model keys, device passwords, SSH credentials, or user account details.
- RDK Studio `server/**` internals, native-shell code, or product UI state.
- Agent execution loops — knowledge packages export data and contracts only.
- Built `dist/` directories as tracked source.

Device mutation, SSH execution, flashing, and credential handling are out of
scope for this repository.

## Documentation

- [`docs/architecture.md`](docs/architecture.md): trusted knowledge package
  target architecture and current boundaries.
- [`docs/release-acceptance.md`](docs/release-acceptance.md): RDK Studio release
  update steps, remote publishing expectations, rollback behavior, and acceptance
  criteria.

## License

[MIT](LICENSE)
