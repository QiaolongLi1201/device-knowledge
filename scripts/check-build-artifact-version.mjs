#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';

const repoRoot = path.resolve(url.fileURLToPath(new URL('..', import.meta.url)));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'device-knowledge-artifact-'));
const outFile = path.join(tmpDir, 'rdk-device-knowledge.artifact.json');
const releaseVersion = '2099.01.02.3';

try {
  const result = spawnSync(
    'npm',
    [
      'run',
      'build:rdk-artifact',
      '--',
      '--version',
      releaseVersion,
      '--min-rdk-studio',
      '9.9.9',
      '--out',
      outFile,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
  }
  assert.equal(result.status, 0, 'artifact builder should succeed');

  const artifact = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  assert.equal(artifact.version, releaseVersion);

  const crypto = await import('node:crypto');
  function stableStringify(value) {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).sort().filter((k) => value[k] !== undefined);
      return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }
  function sha256Stable(value) {
    return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
  }

  // Validate artifact schema identifier.
  assert.equal(
    artifact.schema,
    'rdk-device-knowledge.artifact.v1',
    'artifact.schema should be the expected schema identifier',
  );

  // Validate top-level checksums exist and are 64-char hex.
  const HEX64 = /^[0-9a-f]{64}$/;
  assert.ok(artifact.checksums, 'artifact.checksums must be present');
  assert.match(
    artifact.checksums.artifactSha256,
    HEX64,
    'checksums.artifactSha256 must be a 64-char lowercase hex sha256',
  );
  assert.match(
    artifact.checksums.modulesSha256,
    HEX64,
    'checksums.modulesSha256 must be a 64-char lowercase hex sha256',
  );
  assert.ok(
    artifact.checksums.modules && typeof artifact.checksums.modules === 'object',
    'checksums.modules must be an object',
  );

  const { checksums: _checksums, signature: _signature, ...artifactPayload } = artifact;
  assert.equal(
    artifact.checksums.artifactSha256,
    sha256Stable(artifactPayload),
    'checksums.artifactSha256 must match the artifact payload hash',
  );
  assert.equal(
    artifact.checksums.modulesSha256,
    sha256Stable(artifact.modules),
    'checksums.modulesSha256 must match the modules payload hash',
  );

  // Validate per-module checksums exist for every module id.
  for (const moduleData of artifact.modules ?? []) {
    const moduleId = moduleData.manifest?.id ?? 'unknown module';
    const moduleChecksum = artifact.checksums.modules[moduleId];
    assert.match(
      moduleChecksum,
      HEX64,
      `${moduleId} checksum must be a 64-char lowercase hex sha256`,
    );
    assert.equal(
      moduleChecksum,
      sha256Stable(moduleData),
      `${moduleId} checksum must match the module content hash`,
    );
    assert.equal(
      moduleData.manifest?.version,
      releaseVersion,
      `${moduleId} manifest.version should match artifact release version`,
    );
  }

  // modulesSha256 should reflect module content, not just be a static value.
  // Mutate a module field and verify the checksum would change.
  const mutatedModules = JSON.parse(JSON.stringify(artifact.modules));
  mutatedModules[0].manifest.version = '0.0.0-tampered';
  const mutatedModulesSha = sha256Stable(mutatedModules);
  assert.notEqual(
    mutatedModulesSha,
    artifact.checksums.modulesSha256,
    'modulesSha256 must change when module content changes',
  );
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log('[check-build-artifact-version] PASS');
