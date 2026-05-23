# Architecture

Device Knowledge keeps knowledge assets independent from product hosts.

## Layers

1. Device knowledge packages own data and small pure helpers.
2. The MCP server exposes that knowledge to external agents.
3. The D-Moss adapter maps the same knowledge into D-Moss contracts.
4. RDK Studio consumes the adapter and should remain unaware of whether the
   source is local, published, or hot-plugged.

## Safety Boundary

This repository starts as read-only knowledge infrastructure. Device mutation,
SSH execution, flashing, external messaging, credential loading, and host UI
integration remain outside this repository until explicitly designed.
