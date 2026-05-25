# Architecture

Device Knowledge keeps knowledge assets independent from product hosts.

## Layers

1. Device knowledge packages own data and small pure helpers.
2. The MCP server exposes that knowledge to external agents.
3. The D-Moss adapter maps the same knowledge into D-Moss contracts.
4. RDK Studio consumes the adapter and should remain unaware of whether the
   source is local, published, or hot-plugged.

## Current Baseline

- `@device-knowledge/core` owns the v1 module schema, validation, serialized
  regex helpers, and priority/conflict rules.
- `@device-knowledge/dmoss-adapter` converts validated data modules into Moss
  `KnowledgeModule` objects.
- `@device-knowledge/rdk-knowledge` currently starts with a minimal RDK X5 data
  module so the validation and adapter path can be verified before the full RDK
  Studio knowledge surface is migrated.

## Safety Boundary

This repository starts as read-only knowledge infrastructure. Device mutation,
SSH execution, flashing, external messaging, credential loading, and host UI
integration remain outside this repository until explicitly designed.
