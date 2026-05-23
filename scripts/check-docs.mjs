import { readFileSync } from 'node:fs';

const requiredFiles = [
  'README.md',
  'LICENSE',
  'docs/architecture.md',
  'docs/superpowers/specs/2026-05-24-device-knowledge-design.md',
  'packages/rdk-knowledge/README.md',
  'packages/mcp-server/README.md',
  'packages/dmoss-adapter/README.md',
];

for (const file of requiredFiles) {
  const text = readFileSync(file, 'utf8');
  if (!text.trim()) {
    throw new Error(`${file} is empty`);
  }
}

console.log(`[check-docs] checked ${requiredFiles.length} files`);
