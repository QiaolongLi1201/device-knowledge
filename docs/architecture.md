# Architecture

Device Knowledge is evolving from a data package into a trusted knowledge
package system. The repository remains read-only knowledge infrastructure:
device mutation, SSH execution, flashing, credentials, external messaging, and
host UI state stay in RDK Studio or other product hosts.

## Target Shape

```text
trusted knowledge package
├── package manifest
├── validated knowledge modules
│   ├── KnowledgeRecord metadata
│   └── host-specific chunks/views
├── provenance and source references
└── bundled or remotely published artifact
```

The current implementation already provides the top-level module contract in
`@device-knowledge/core`, the official RDK dataset plus starter Jetson/Raspberry
Pi datasets in `@device-knowledge/*-knowledge`, and a D-Moss bridge in
`@device-knowledge/dmoss-adapter`. Typed record-level provenance, record id
uniqueness validation, stable URL-hashed RDK doc ids, authoring lint,
multi-module artifact checksum production, and host-side checksum validation
are implemented. Remote hosting, release manifest discovery, Rockchip/RK source
data, and cryptographic signature verification are release/host roadmap items.

## Repository Layers

1. `@device-knowledge/core` owns serializable schema types, validation,
   priority ranges, conflict resolution, and regex helpers.
2. `@device-knowledge/rdk-knowledge` owns official RDK knowledge data and
   exports `rdkKnowledgeModuleData`, `RDK_ECOSYSTEM_TEXT`, and research seed
   helpers.
3. `@device-knowledge/jetson-knowledge` and `@device-knowledge/rpi-knowledge`
   own starter Jetson and Raspberry Pi knowledge data migrated out of RDK
   Studio local source modules.
4. `@device-knowledge/dmoss-adapter` maps validated module data into Moss
   `KnowledgeModule` objects for RDK Studio and Moss consumers.
5. `packages/mcp-server` is reserved for read-only MCP access. Its server
   behavior is still roadmap.
6. `scripts/build-rdk-artifact.mjs` packages the built official device modules
   into `dist/artifacts/rdk-device-knowledge.artifact.json` for bundled or
   remote delivery. The script name remains RDK-compatible for existing Studio
   release automation.

## Trusted Knowledge Package

A Trusted Knowledge Package is the release unit that hosts consume. It should
be safe to load because it is data-only, versioned, validated, traceable to
sources, and compatible with a known host range.

Current artifact shape:

```json
{
  "schema": "rdk-device-knowledge.artifact.v1",
  "version": "2026.05.25.1",
  "minRdkStudio": "1.2.0",
  "createdAt": "2026-05-25T00:00:00.000Z",
  "modules": [
    { "manifest": { "id": "rdk" } },
    { "manifest": { "id": "jetson-sbc" } },
    { "manifest": { "id": "raspberry-pi-sbc" } }
  ]
}
```

The artifact is produced by:

```bash
npm run build:rdk-artifact -- --version 2026.05.25.1 --min-rdk-studio 1.2.0
```

Current trust checks include TypeScript compilation, package tests,
`validateDeviceKnowledgeModule`, typed record provenance validation, record id
uniqueness, safe manifest/record ids, priority rules, docs lint, authoring
knowledge lint, artifact checksum generation, and RDK Studio checksum-aware
remote artifact smoke tests. Roadmap trust checks include cryptographic
signature verification, remote release manifests, staged rollout metadata, and
richer provenance reports.

## KnowledgeRecord And Chunk Model

The target record model is a common `KnowledgeRecord` base used by every
knowledge surface:

- `DocIndexEntry`
- `PromptFragment`
- `CommandPattern`
- `FailureHint`
- `EndorsedSkillRef`

`DeviceKnowledgeModuleData` accepts these surfaces as typed arrays and validates
their required per-record shape in `@device-knowledge/core`. Every record
carries an `id`, `source`,
compatibility `scope`, tags, language, status, confidence, priority, review
dates, validity range, supersession metadata, and citation labels. This will
make records traceable before they are adapted into Moss or exposed through
future MCP resources.

Chunks are represented today by host-facing views plus document `chunkPolicy`
hints rather than a separate `KnowledgeChunk` type. A future `KnowledgeChunk`
object should preserve the parent record id, source span, stable chunk id,
embedding metadata, prompt metadata, and citation label.

## Source And Provenance

Each trusted record should point back to its source. The target
`KnowledgeSourceRef` shape should include:

- `type`: `official-doc`, `github`, `forum`, `community`, `local`, or
  `generated`
- `url` or `repo`
- `commit`
- `documentVersion`
- `retrievedAt`

For RDK official knowledge, prefer official D-Robotics documentation, GitHub
repositories, release notes, and maintained local markdown assets. Generated or
community records must be marked with lower confidence unless reviewed and
promoted.

Roadmap: add repository-level provenance reports that list record counts by
source, missing source metadata, stale review dates, and changed upstream URLs.

## Bundled And Remote Update Flow

RDK Studio should be able to consume knowledge in two modes:

- **Bundled baseline:** ship a known-good artifact inside a desktop release.
  This is the fallback that works offline.
- **Remote update:** fetch a newer published artifact when its schema and
  compatibility metadata match the running Studio version.

The current repo can build the artifact for both modes. RDK Studio implements
the host-side bundled/active/previous/staging selection, checksum-aware remote
artifact validation, and failed-update fallback. Remote hosting, rollout
metadata, and cryptographic signature verification remain outside
`packages/core`.

## RDK Studio And Moss Consumption

RDK Studio and Moss should consume Device Knowledge through stable boundaries:

1. Load a bundled or remote artifact.
2. Validate each module with `@device-knowledge/core`.
3. Resolve priority and compatibility conflicts deterministically.
4. Convert accepted modules with `@device-knowledge/dmoss-adapter`.
5. Register the resulting Moss `KnowledgeModule` without exposing whether the
   source was bundled or remote.

RDK Studio owns user experience, update policy, cache placement, network
policy, telemetry, and failure messaging. Moss owns the runtime
`KnowledgeModule` contract. Device Knowledge owns the trusted data and pure
helpers.

## Compatibility And Conflict Rules

The active module schema is `device-knowledge.module.v2`. A manifest contains
`id`, `name`, `version`, `origin`, optional `family`, `priority`, and
compatibility metadata including `dmossKnowledgeModule` and optional
`minRdkStudio`. Hosts may still accept `device-knowledge.module.v1` packages
through a legacy migration path, but v2 is the producer format for new
artifacts.

Priority ranges are enforced by origin:

| Origin | Priority range |
| --- | --- |
| `official` | `0` to `99` |
| `community` | `100` to `499` |
| `user` | `500` to `999` |

Lower priority wins after specificity and explicit override handling. Platform
specific knowledge wins over family-level defaults. A non-official candidate
must declare `override=true` before it can override official knowledge.

## Current Limits

- `packages/mcp-server` is still a placeholder.
- Rockchip/RK does not yet have a source package because RDK Studio did not
  contain a dedicated local RK module to migrate.
- Remote publishing is documented as an operating model, not an implemented
  upload command.
- Artifact checksums are produced by this repository and validated by the RDK
  Studio update path; cryptographic signature verification and staged rollout
  are roadmap. Hosts should reject signature fields until verification keys and
  payload rules are configured.
- The current validation checks top-level module shape, manifest compatibility,
  typed record shape, source/provenance presence, serialized regex fields, and
  document chunk policy hints.
