# Device Knowledge

Open trusted device knowledge packages and MCP access for robotics agents.

Device Knowledge is the source repository for data-only RDK knowledge that can
be bundled with RDK Studio, adapted into Moss, and later published as remote
knowledge packages. The current implementation provides top-level module
schema, validation, an RDK data package, a D-Moss adapter, an authoring lint,
and an artifact builder. Record-level provenance is now part of the v2 core
schema; v1 inputs are still accepted through a legacy migration path. Remote
update hosting and cryptographic signature verification remain host/release
responsibilities.

## Build RDK Artifact

RDK Studio consumes data-only artifacts from this repo. After editing knowledge
data in `packages/rdk-knowledge/src/**`, verify the workspace and build a
versioned artifact:

```bash
npm run verify
```

```bash
npm run build:rdk-artifact -- --version 2026.05.25.1 --min-rdk-studio 1.2.0
```

The output is `dist/artifacts/rdk-device-knowledge.artifact.json`. Publish that
JSON for remote updates, or sync it into RDK Studio's bundled baseline before a
desktop release.

The build script also accepts `--out <path>`. If `--version` is omitted, it uses
`DEVICE_KNOWLEDGE_VERSION` or falls back to the RDK module manifest version. If
`--min-rdk-studio` is omitted, it can be supplied through
`MIN_RDK_STUDIO_VERSION`.

This repository is intended to host device-domain knowledge independently from
RDK Studio. RDK Studio should consume the published packages without changing
the user experience, while other agents can attach the same knowledge through
MCP.

## Goals

- Maintain RDK and future device knowledge in a public, standalone repository.
- Publish reusable knowledge packages that do not depend on RDK Studio runtime
  state, credentials, SSH sessions, or UI code.
- Add source/provenance metadata so records can be reviewed, cited, and
  accepted as trusted knowledge.
- Provide an MCP server so agents can read device profiles, documentation
  indexes, failure hints, and prompt context on demand.
- Keep D-Moss integration as an adapter layer, not as the primary knowledge
  format.
- Support hot-pluggable community or user modules through a stable module
  schema and priority rules.

## Initial Package Boundaries

| Path | Purpose |
| --- | --- |
| `packages/rdk-knowledge` | Minimal RDK device knowledge module data and exports. |
| `packages/mcp-server` | Standalone read-only MCP server for agent access. |
| `packages/dmoss-adapter` | Adapter from device knowledge modules to D-Moss `KnowledgeModule`. |
| `modules/` | Data-first device module bundles and examples. |
| `docs/` | Architecture, schema, migration, and release notes. |

## Trusted Knowledge Concepts

- A **Trusted Knowledge Package** is the release unit consumed by hosts. Today
  it is the `rdk-device-knowledge.artifact.v1` JSON artifact built from
  `@device-knowledge/rdk-knowledge`. The artifact contains checksum metadata
  for the artifact payload and each module; hosts must reject unsupported
  signature fields until real public-key verification is configured.
- A **KnowledgeRecord** is a source-backed fact or host-facing entry. Current
  module arrays include documentation index entries, prompt fragments, command
  patterns, failure hints, and endorsed skills, all with typed `id`, `source`,
  optional compatibility scope, status, confidence, review metadata, and
  citation fields.
- A **Chunk** is a host-facing slice of a record. A standalone
  `KnowledgeChunk` type is roadmap; document records already carry a
  `chunkPolicy` hint for host-side retrieval.
- **Source/provenance** includes source type, URL or repository, commit,
  document version, and retrieval time when available.
- **Bundled knowledge** is the offline baseline shipped with RDK Studio.
  **Remote knowledge updates** use the same artifact shape plus host-side
  fetch, verification, cache, and rollback policy in RDK Studio.

## First Implementation Direction

The first useful version should be read-only:

1. Grow the minimal `@device-knowledge/rdk-knowledge` data package toward the
   current RDK Studio knowledge surface.
2. Move MCP-facing knowledge assembly out of RDK Studio internals.
3. Publish an MCP server that exposes resources, tools, and prompts for device
   knowledge lookup.
4. Update RDK Studio to consume the external packages with the same local import
   boundary it has today.

Device mutation, SSH execution, flashing, and credential handling are out of
scope for this repository's first phase.

## Release Documentation

- `docs/architecture.md` describes the trusted knowledge package target
  architecture and current boundaries.
- `docs/release-acceptance.md` describes RDK Studio release update steps,
  remote publishing expectations, rollback behavior, and acceptance criteria.
