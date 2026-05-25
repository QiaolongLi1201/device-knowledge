import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const requiredFiles = [
  'README.md',
  'LICENSE',
  'docs/architecture.md',
  'docs/superpowers/specs/2026-05-24-device-knowledge-design.md',
  'docs/superpowers/plans/2026-05-24-packages-core-implementation-plan.md',
  'packages/core/README.md',
  'packages/rdk-knowledge/README.md',
  'packages/mcp-server/README.md',
  'packages/dmoss-adapter/README.md',
];

for (const file of requiredFiles) {
  const text = readFileSync(path.join(repoRoot, file), 'utf8');
  if (!text.trim()) {
    throw new Error(`${file} is empty`);
  }
}

console.log(`[check-docs] checked ${requiredFiles.length} files`);
