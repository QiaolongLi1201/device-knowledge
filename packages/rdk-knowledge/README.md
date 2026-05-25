# @device-knowledge/rdk-knowledge

Minimal data-first RDK knowledge package.

This package is the first external RDK dataset for the `device-knowledge`
workspace. It intentionally starts with one small RDK X5 module so the schema,
validation, D-Moss adapter, and Studio compatibility path can be verified before
the full RDK Studio knowledge surface is migrated.

## Public Surface

- `rdkKnowledgeModuleData`
- `RDK_ECOSYSTEM_TEXT`
- `RDK_RESEARCH_SEEDS`
- `getRdkResearchSeeds(platform)`

The package exports serializable data. Runtime adapters such as
`@device-knowledge/dmoss-adapter` are responsible for turning this data into a
Moss `KnowledgeModule`.
