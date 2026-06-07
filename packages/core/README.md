# @device-knowledge/core

Core schema and validation helpers for data-first device knowledge modules.

This package owns serializable data contracts, priority rules, conflict
resolution, and regex helpers. It does not import RDK Studio, Moss runtime
packages, MCP server code, credentials, SSH sessions, device execution, flashing
flows, or UI state.

## Public Surface

- `DeviceKnowledgeModuleManifest`
- `SerializedRegex`
- `WorkflowGuide`
- `validateManifest`
- `validateDeviceKnowledgeModule`
- `buildAgentKnowledgeContext`
- `compileSerializedRegex`
- `serializedRegexFromLegacyRobotHubPattern`
- `resolveModuleConflict`

The D-Moss adapter and MCP server should consume this package instead of
redefining schema rules.
