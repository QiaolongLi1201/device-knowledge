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

const [
  { jetsonKnowledgeModuleData },
  { rdkKnowledgeModuleData },
  { rkKnowledgeModuleData },
  { rpiKnowledgeModuleData },
] = await Promise.all([
  import('../packages/jetson-knowledge/dist/index.js'),
  import('../packages/rdk-knowledge/dist/index.js'),
  import('../packages/rk-knowledge/dist/index.js'),
  import('../packages/rpi-knowledge/dist/index.js'),
]);
const sourceModules = [rdkKnowledgeModuleData, jetsonKnowledgeModuleData, rpiKnowledgeModuleData, rkKnowledgeModuleData];
const artifactVersion = version ?? rdkKnowledgeModuleData.manifest.version;
const releaseModules = sourceModules.map((moduleData) => ({
  ...moduleData,
  manifest: {
    ...moduleData.manifest,
    version: artifactVersion,
  },
}));
const artifactMinRdkStudio =
  minRdkStudio ??
  sourceModules
    .map((moduleData) => moduleData.manifest.compatibility?.minRdkStudio)
    .filter(Boolean)
    .sort(compareVersionLike)
    .at(-1);

function compareVersionLike(a, b) {
  const aa = String(a).match(/\d+/g)?.map(Number) ?? [];
  const bb = String(b).match(/\d+/g)?.map(Number) ?? [];
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < len; i++) {
    const av = aa[i] ?? 0;
    const bv = bb[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return String(a).localeCompare(String(b));
}

function stableStringify(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort().filter(k => value[k] !== undefined);
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256Stable(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

const artifactPayload = {
  schema: 'rdk-device-knowledge.artifact.v1',
  version: artifactVersion,
  ...(artifactMinRdkStudio ? { minRdkStudio: artifactMinRdkStudio } : {}),
  createdAt: new Date().toISOString(),
  modules: releaseModules,
};

const artifact = {
  ...artifactPayload,
  checksums: {
    artifactSha256: sha256Stable(artifactPayload),
    modulesSha256: sha256Stable(releaseModules),
    modules: Object.fromEntries(
      releaseModules.map((moduleData) => [moduleData.manifest.id, sha256Stable(moduleData)]),
    ),
  },
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`[device-knowledge] wrote artifact ${path.relative(repoRoot, outFile)} version=${artifactVersion}`);
