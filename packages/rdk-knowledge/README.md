# @device-knowledge/rdk-knowledge

Data-first RDK knowledge package.

This package is the official RDK dataset for the `device-knowledge` workspace.
It contains source-backed board profiles, documentation index entries, prompt
fragments, command patterns, failure hints, endorsed skills, workflow guides,
and ecosystem prompt text.

## Public Surface

- `rdkKnowledgeModuleData`
- `RDK_ECOSYSTEM_TEXT`
- `RDK_RESEARCH_SEEDS`
- `getRdkResearchSeeds(platform)`

The package exports serializable data. Runtime adapters such as
`@device-knowledge/dmoss-adapter` are responsible for turning this data into a
Moss `KnowledgeModule`.
