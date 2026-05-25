# Release And Acceptance

This document defines how RDK Studio releases should consume Device Knowledge
artifacts and how knowledge-only releases should be accepted. It uses commands
that exist in this repository and the RDK Studio consuming host today; future
remote publishing capabilities are marked as roadmap.

## Release Units

- **Source package:** `@device-knowledge/rdk-knowledge` in
  `packages/rdk-knowledge`.
- **Validation package:** `@device-knowledge/core`.
- **Moss adapter:** `@device-knowledge/dmoss-adapter`.
- **Release artifact:** `dist/artifacts/rdk-device-knowledge.artifact.json`.

The artifact schema is `rdk-device-knowledge.artifact.v1`. It contains a
top-level artifact version, optional `minRdkStudio`, `createdAt`, and one or
more validated modules. The current build script emits the official RDK module.

## Updating Knowledge For An RDK Studio Release

1. Update knowledge data in `packages/rdk-knowledge/src/**`.
2. Record source metadata in the data entry. The typed record shape supports:
   - `source.type`
   - `source.url` or `source.repo`
   - `source.commit`, `source.documentVersion`, or `source.retrievedAt` when
     available
   - compatibility `scope` when the fact applies only to specific boards,
     SoCs, RDK versions, OS versions, or toolchains
3. Run repository verification:

   ```bash
   npm run verify
   ```

4. Build the release artifact with the Studio compatibility floor:

   ```bash
   npm run build:rdk-artifact -- --version 2026.05.25.1 --min-rdk-studio 1.2.0
   ```

5. Hand `dist/artifacts/rdk-device-knowledge.artifact.json` to the RDK Studio
   release process as the bundled baseline.
6. In the consuming Studio build, verify that the bundled artifact loads, the
   RDK Moss knowledge module registers, and the user-facing knowledge behavior
   is unchanged except for the intended knowledge updates.

Use the real release version and minimum Studio version for step 4. The date
style in the example is only a convention, not a script requirement.

## Remote Knowledge Package Publishing

Remote publishing is a roadmap distribution path. The repository currently
builds the JSON artifact, and RDK Studio can fetch/validate a remote artifact
when `RDK_DEVICE_KNOWLEDGE_UPDATE_URL` is configured. This repository does not
provide upload, signing, or remote manifest commands.

When remote publishing is implemented, the release should use this sequence:

1. Build the artifact with the same command used for bundled releases.
2. Publish the exact artifact bytes to the remote knowledge package location.
3. Publish a remote manifest that names:
   - artifact URL
   - artifact schema
   - artifact version
   - minimum RDK Studio version
   - checksum or signature
   - release notes
   - rollout or channel metadata
4. Keep the previously accepted artifact available until the new version is
   verified in production.
5. Update RDK Studio remote metadata only after the bundled fallback for that
   Studio version is known-good.

Do not document a concrete upload command until the remote publisher exists.

## Failure And Rollback

Bundled baseline behavior:

- If a new bundled artifact fails validation during Studio release testing,
  rebuild Studio with the last accepted
  `rdk-device-knowledge.artifact.json`.
- If the artifact loads but a knowledge regression is found, fix the source
  data, rerun `npm run verify`, rebuild the artifact, and repeat Studio
  acceptance.

Remote update behavior:

- If remote fetch fails, Studio should keep using the bundled baseline or last
  valid cached artifact.
- If checksum metadata, signature metadata, schema, or module validation fails,
  Studio rejects the remote artifact and keeps the previous accepted artifact.
- If post-load validation or Moss registration fails, Studio should disable the
  candidate artifact, report the reason, and fall back without changing user
  workflows.
- Remote rollback can be done by publishing an older accepted artifact version
  that is still newer than the client cache, or by shipping a new Studio
  bundled baseline. A signed remote manifest is roadmap.

Device Knowledge artifacts must not require credentials, SSH sessions, active
devices, or network access after they are loaded.

## Acceptance Criteria

Repository acceptance:

- `npm run verify` passes from the repository root.
- `npm run build:rdk-artifact -- --version <version> --min-rdk-studio <version>`
  writes `dist/artifacts/rdk-device-knowledge.artifact.json`.
- The artifact has schema `rdk-device-knowledge.artifact.v1`.
- The artifact version matches the requested release version.
- Every module manifest uses schema `device-knowledge.module.v1`.
- Official module priorities stay in the `0` to `99` range.
- Changed knowledge records have source/provenance recorded in typed fields.
- New roadmap text is clearly marked as roadmap and does not imply existing
  upload commands or hosting behavior.

RDK Studio acceptance:

- Studio can load the bundled artifact without network access.
- Moss receives a valid `KnowledgeModule` converted by
  `@device-knowledge/dmoss-adapter`.
- Existing RDK knowledge workflows still work for device profiles,
  documentation index lookup, prompt fragments, command patterns, failure
  hints, endorsed skills, and ecosystem prompt text.
- The release can fall back to the previous bundled artifact if validation or
  user-facing checks fail.

Remote acceptance:

- Studio rejects artifacts with incompatible schema, invalid checksum metadata,
  invalid signature metadata, or failed module validation.
- Studio can continue from bundled or cached knowledge when remote update is
  unavailable.
- Remote release notes identify changed source domains, affected boards, and
  known limitations.

## Release Checklist

- [ ] Source records updated in `packages/rdk-knowledge/src/**`.
- [ ] Sources and compatibility scopes reviewed.
- [ ] `npm run verify` passed.
- [ ] Artifact built with the intended version and `--min-rdk-studio`.
- [ ] Artifact path recorded:
      `dist/artifacts/rdk-device-knowledge.artifact.json`.
- [ ] RDK Studio bundled-load acceptance passed.
- [ ] Rollback artifact version identified.
- [ ] Remote publishing fields prepared if using the remote path.

## Current Open Assumptions

- RDK Studio owns the storage location for bundled and cached artifacts.
- The remote publisher, manifest format, signing method, and rollout policy are
  not implemented in this repository yet.
- Cryptographic signature verification is not implemented yet; current Studio
  validation checks signature metadata shape and verifiable checksums.
- Artifact versioning should be aligned with Studio release management, but this
  repository only requires a non-empty `--version` value or falls back to the
  module manifest version.
