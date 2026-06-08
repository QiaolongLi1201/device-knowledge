#!/usr/bin/env node
import assert from 'node:assert/strict';
const mod = await import(new URL('../dist/index.js', import.meta.url).href);

const info = mod.getDeviceKnowledgeMcpServerInfo();
assert.equal(info.packageName, '@device-knowledge/mcp-server');
assert.equal(info.status, 'placeholder');
assert.equal(info.readOnly, true);

function makeStream() {
  let output = '';
  return {
    stream: {
      write(chunk) {
        output += chunk;
        return true;
      },
    },
    get output() {
      return output;
    },
  };
}

{
  const stdout = makeStream();
  const code = await mod.main(['--help'], { stdout: stdout.stream });
  assert.equal(code, 0);
  assert.match(stdout.output, /placeholder/i);
}

{
  const stdout = makeStream();
  const code = await mod.main(['--version'], { stdout: stdout.stream });
  assert.equal(code, 0);
  assert.match(stdout.output, /^0\.1\.0\s*$/);
}

{
  const stderr = makeStream();
  const code = await mod.main([], { stderr: stderr.stream });
  assert.equal(code, 1);
  assert.match(stderr.output, /not available yet/i);
}

console.log('[PASS] mcp-server placeholder is buildable and explicit');
