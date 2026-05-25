import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const packageDir = path.resolve(url.fileURLToPath(new URL('..', import.meta.url)));
const srcDir = path.join(packageDir, 'src');
const distDir = path.join(packageDir, 'dist');

for (const name of fs.readdirSync(srcDir)) {
  if (!name.endsWith('.md')) continue;
  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(path.join(srcDir, name), path.join(distDir, name));
}
