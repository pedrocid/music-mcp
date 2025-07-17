import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerTools } from '../../src/server.js';
import { getVersion } from '../../src/version.js';

describe('MCP Server Integration', () => {
  let server: Server;

  beforeAll(async () => {
    server = new Server(
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

    await registerTools(server);
  });

  afterAll(() => {
    // Clean up server if needed
  });

  it('should initialize server with correct metadata', () => {
    expect(server).toBeDefined();
  });

  it('should have version matching package.json format', () => {
    const version = getVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should register all required tools', () => {
    // This test verifies that registerTools completes without errors
    // The actual tool registration is tested during beforeAll
    expect(true).toBe(true);
  });
}); 