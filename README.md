# Device Knowledge

Open device knowledge modules and MCP access for robotics agents.

This repository is intended to host device-domain knowledge independently from
RDK Studio. RDK Studio should consume the published packages without changing
the user experience, while other agents can attach the same knowledge through
MCP.

## Goals

- Maintain RDK and future device knowledge in a public, standalone repository.
- Publish reusable knowledge packages that do not depend on RDK Studio runtime
  state, credentials, SSH sessions, or UI code.
- Provide an MCP server so agents can read device profiles, documentation
  indexes, failure hints, and prompt context on demand.
- Keep D-Moss integration as an adapter layer, not as the primary knowledge
  format.
- Support hot-pluggable community or user modules through a stable module
  schema and priority rules.

## Initial Package Boundaries

| Path | Purpose |
| --- | --- |
| `packages/rdk-knowledge` | RDK device knowledge module data and exports. |
| `packages/mcp-server` | Standalone read-only MCP server for agent access. |
| `packages/dmoss-adapter` | Adapter from device knowledge modules to D-Moss `KnowledgeModule`. |
| `modules/` | Data-first device module bundles and examples. |
| `docs/` | Architecture, schema, migration, and release notes. |

## First Implementation Direction

The first useful version should be read-only:

1. Extract the existing RDK knowledge package from RDK Studio.
2. Move MCP-facing knowledge assembly out of RDK Studio internals.
3. Publish an MCP server that exposes resources, tools, and prompts for device
   knowledge lookup.
4. Update RDK Studio to consume the external packages with the same local import
   boundary it has today.

Device mutation, SSH execution, flashing, and credential handling are out of
scope for this repository's first phase.
