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
  for (const moduleData of artifact.modules ?? []) {
    assert.equal(
      moduleData.manifest?.version,
      releaseVersion,
      `${moduleData.manifest?.id ?? 'unknown module'} manifest.version should match artifact release version`,
    );
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log('[check-build-artifact-version] PASS');
