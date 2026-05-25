#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import url from 'node:url';

const repoRoot = path.resolve(url.fileURLToPath(new URL('..', import.meta.url)));

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const outFile = path.resolve(
  repoRoot,
  readArg('--out') ?? 'dist/artifacts/rdk-device-knowledge.artifact.json',
);
const version = readArg('--version') ?? process.env.DEVICE_KNOWLEDGE_VERSION;
const minRdkStudio = readArg('--min-rdk-studio') ?? process.env.MIN_RDK_STUDIO_VERSION;

const { rdkKnowledgeModuleData } = await import('../packages/rdk-knowledge/dist/index.js');
const artifactVersion = version ?? rdkKnowledgeModuleData.manifest.version;

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256Stable(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

const modules = [
  {
    ...rdkKnowledgeModuleData,
    manifest: {
      ...rdkKnowledgeModuleData.manifest,
      version: artifactVersion,
    },
  },
];

const artifactPayload = {
  schema: 'rdk-device-knowledge.artifact.v1',
  version: artifactVersion,
  ...(minRdkStudio ? { minRdkStudio } : {}),
  createdAt: new Date().toISOString(),
  modules,
};

const artifact = {
  ...artifactPayload,
  checksums: {
    artifactSha256: sha256Stable(artifactPayload),
    modulesSha256: sha256Stable(modules),
    modules: Object.fromEntries(modules.map((moduleData) => [moduleData.manifest.id, sha256Stable(moduleData)])),
  },
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`[device-knowledge] wrote artifact ${path.relative(repoRoot, outFile)} version=${artifactVersion}`);
