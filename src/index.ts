#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './logger.js';
import { getVersion } from './version.js';
import { registerTools } from './server.js';

// Ensure clean exit
process.on('SIGINT', () => {
  logger.info('Shutting down Music MCP server');
  logger.flush();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down Music MCP server');
  logger.flush();
  process.exit(0);
});

async function main(): Promise<void> {
  const server = new Server(
    {
      name: 'music-mcp',
      vendor: 'pedrocid',
      version: getVersion(),
      description: `MCP server for controlling Apple Music on macOS (v${getVersion()})`
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register all tools
  await registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info(`Music MCP server v${getVersion()} started`);
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start Music MCP server');
  console.error('Failed to start Music MCP server:', error.message);
  process.exit(1);
}); 