import test from 'node:test';
import assert from 'node:assert';
import { RDK_FAILURE_HINTS } from '../dist/failure-hints.js';

const ATTACK_INPUTS = [
  'a'.repeat(200),
  'NO_PUBKEY ' + 'a'.repeat(200),
  '/'.repeat(200),
  ' '.repeat(100) + 'error' + ' '.repeat(100),
  '<script>' + 'x'.repeat(200) + '</script>',
  '\\'.repeat(200),
  'http://' + 'a'.repeat(200),
  'GPT' + ' '.repeat(200) + 'corrupt',
];

test('RDK_FAILURE_HINTS regexes are ReDoS-safe (<50ms each)', () => {
  for (const hint of RDK_FAILURE_HINTS) {
    for (const input of ATTACK_INPUTS) {
      const t0 = Date.now();
      for (let i = 0; i < 50; i++) hint.errorPattern.test(input);
      const elapsed = Date.now() - t0;
      assert.ok(
        elapsed < 50,
        `regex ${hint.errorPattern} took ${elapsed}ms (>50ms) for input ${JSON.stringify(input.slice(0, 30))}…`,
      );
    }
  }
});
