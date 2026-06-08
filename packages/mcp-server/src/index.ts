#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

export interface DeviceKnowledgeMcpServerInfo {
  packageName: '@device-knowledge/mcp-server';
  status: 'placeholder';
  readOnly: true;
  description: string;
}

export function getDeviceKnowledgeMcpServerInfo(): DeviceKnowledgeMcpServerInfo {
  return {
    packageName: '@device-knowledge/mcp-server',
    status: 'placeholder',
    readOnly: true,
    description:
      'Planned read-only MCP server for exposing device-knowledge modules to MCP clients.',
  };
}

export interface DeviceKnowledgeMcpCliIo {
  stdout?: Pick<NodeJS.WriteStream, 'write'>;
  stderr?: Pick<NodeJS.WriteStream, 'write'>;
}

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, text: string): void {
  stream.write(`${text}\n`);
}

export async function main(
  argv = process.argv.slice(2),
  io: DeviceKnowledgeMcpCliIo = {},
): Promise<number> {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const info = getDeviceKnowledgeMcpServerInfo();

  if (argv.includes('--version')) {
    writeLine(stdout, '0.1.0');
    return 0;
  }

  if (argv.includes('--help') || argv.includes('-h')) {
    writeLine(stdout, `${info.packageName}: ${info.description}`);
    writeLine(stdout, 'Status: placeholder; no MCP resources or tools are served yet.');
    return 0;
  }

  writeLine(
    stderr,
    `${info.packageName} is a placeholder package; the MCP server implementation is not available yet.`,
  );
  return 1;
}

function isDirectCliEntrypoint(): boolean {
  const entry = process.argv[1];
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}

if (isDirectCliEntrypoint()) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    },
  );
}
