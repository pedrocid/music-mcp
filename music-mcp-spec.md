# Music App MCP Connector Specification

## Overview

This specification outlines the design and implementation of a Model Context Protocol (MCP) server for controlling Apple Music on macOS using AppleScript. The connector will provide a structured interface for AI assistants like Claude to interact with the Music app, enabling playback control, library management, and music information retrieval.

## Project Structure

```
music-mcp/
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.md
├── LICENSE
├── CHANGELOG.md
├── .gitignore
├── .eslintrc.js
├── .npmignore
├── .npmrc
├── vitest.config.ts
├── scripts/
│   ├── prepare-release.js
│   └── build.js
├── src/
│   ├── index.ts               # Entry point with shebang
│   ├── server.ts
│   ├── config.ts
│   ├── logger.ts
│   ├── version.ts
│   ├── tools/
│   │   ├── info.ts
│   │   ├── music-control.ts
│   │   ├── library-management.ts
│   │   └── playlist-management.ts
│   └── scripts/
│       ├── playback/
│       │   ├── play-pause.applescript
│       │   ├── next-track.applescript
│       │   ├── previous-track.applescript
│       │   └── set-volume.applescript
│       ├── library/
│       │   ├── get-current-track.applescript
│       │   ├── search-tracks.applescript
│       │   ├── get-playlists.applescript
│       │   └── get-albums.applescript
│       └── playlist/
│           ├── create-playlist.applescript
│           ├── add-to-playlist.applescript
│           └── get-playlist-tracks.applescript
├── tests/
│   ├── unit/
│   │   ├── tools.test.ts
│   │   ├── scripts.test.ts
│   │   └── logger.test.ts
│   └── e2e/
│       └── integration.test.ts
└── dist/                      # Compiled output (git ignored)
    └── index.js              # Will have executable permissions
```

### Additional Files

#### .npmignore
```
# Source files
src/
tests/
scripts/prepare-release.js

# Config files
.eslintrc.js
vitest.config.ts
vitest.e2e.config.ts
tsconfig.json

# Development files
.gitignore
.npmignore
CHANGELOG.md
*.log
.DS_Store

# Keep only dist/, README.md, LICENSE, and package.json
```

#### .npmrc
```
# Ensure consistent package-lock
package-lock=true

# Save exact versions
save-exact=true

# Use public registry
registry=https://registry.npmjs.org/
```

## Core Features

### 1. Info Command (Required)
Provides essential diagnostic information:
- Tool version (dynamically read from package.json)
- AppleScript runtime status
- Music app availability
- Configuration status
- Logger path and status

### 2. Playback Control
- Play/Pause music
- Skip to next/previous track
- Set volume and mute/unmute
- Seek within current track
- Set shuffle and repeat modes
- Control playback speed

### 3. Current Track Information
- Get current track details (title, artist, album, duration, position)
- Get album artwork
- Get track metadata (genre, year, rating)
- Get playback status

### 4. Library Management
- Search for tracks, albums, artists
- Get library statistics
- Browse albums and artists
- Get recently played tracks
- Access loved/favorite tracks

### 5. Playlist Management
- List all playlists
- Create new playlists
- Add/remove tracks from playlists
- Rename playlists
- Get playlist contents
- Play specific playlist

### 6. Queue Management
- View upcoming tracks
- Add tracks to up next
- Clear queue
- Reorder queue

## Tool Definitions

### info
Diagnostic information about the MCP tool status.

```typescript
interface InfoInput {
  command: 'info';
}

interface InfoOutput {
  version: string;
  musicAppAvailable: boolean;
  appleScriptAvailable: boolean;
  loggerPath: string;
  loggerStatus: 'ok' | 'error';
  configurationIssues: string[];
}
```

### execute_music_command
Primary tool for executing Music app commands.

```typescript
interface ExecuteMusicCommandInput {
  command: 'play' | 'pause' | 'next' | 'previous' | 'toggle_playback';
  volume?: number; // 0-100, optional with default
  position?: number; // seconds, optional
  shuffleMode?: boolean; // optional, default: current setting
  repeatMode?: 'off' | 'one' | 'all'; // optional, default: current setting
  rating?: number; // 0-5, optional
  timeoutSeconds?: number; // optional, default: 30
}
```

### get_music_info
Retrieve information about current playback or library.

```typescript
interface GetMusicInfoInput {
  infoType: 'current_track' | 'playback_status' | 'queue' | 'library_stats';
  format?: 'simple' | 'detailed'; // optional, default: 'simple'
}
```

### search_music
Search the music library.

```typescript
interface SearchMusicInput {
  query: string; // required
  searchType?: 'all' | 'track' | 'album' | 'artist' | 'playlist'; // optional, default: 'all'
  limit?: number; // optional, default: 50
}
```

### manage_playlist
Create and manage playlists.

```typescript
interface ManagePlaylistInput {
  action: 'create' | 'add_track' | 'remove_track' | 'rename' | 'delete' | 'list';
  playlistName?: string; // required for most actions
  trackId?: string; // required for add/remove track
  newName?: string; // required for rename
}
```

## Configuration & Environment Variables

All environment variables have sensible defaults:

```bash
# Logging Configuration
MUSIC_MCP_LOG_FILE="~/Library/Logs/music-mcp.log"  # Log file location
MUSIC_MCP_LOG_LEVEL="info"                         # Log level (debug, info, warn, error)
MUSIC_MCP_CONSOLE_LOGGING="false"                  # Enable console logging

# Performance Configuration
MUSIC_MCP_CACHE_TTL=300                           # Cache timeout in seconds
MUSIC_MCP_MAX_SEARCH_RESULTS=50                   # Maximum search results
MUSIC_MCP_TIMEOUT_SECONDS=30                      # Default timeout for operations

# Feature Flags
MUSIC_MCP_ARTWORK_EXPORT="true"                   # Enable album artwork export
MUSIC_MCP_LENIENT_PARSING="true"                  # Accept variations in parameter names
```

## Logging Implementation (Pino)

```typescript
// src/logger.ts
import pino from 'pino';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import os from 'os';

const logFile = process.env.MUSIC_MCP_LOG_FILE || 
  `${os.homedir()}/Library/Logs/music-mcp.log`;

// Ensure log directory exists
await mkdir(dirname(logFile), { recursive: true }).catch(() => {
  // Fallback to temp directory if cannot create
  return os.tmpdir();
});

export const logger = pino({
  level: (process.env.MUSIC_MCP_LOG_LEVEL || 'info').toLowerCase(),
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { destination: logFile }
      },
      ...(process.env.MUSIC_MCP_CONSOLE_LOGGING === 'true' ? [{
        target: 'pino-pretty',
        options: { destination: 1 }
      }] : [])
    ]
  }
});

// Ensure flush on exit
process.on('exit', () => logger.flush());
```

## Error Handling Strategy

### Runtime Errors
```typescript
try {
  const result = await executeAppleScript(script);
  return { success: true, data: result };
} catch (error) {
  logger.error({ error }, 'AppleScript execution failed');
  return {
    success: false,
    error: `Failed to execute command: ${error.message}. Ensure Music app is running and you have granted automation permissions.`
  };
}
```

### Configuration Errors
```typescript
// In info command
if (!process.env.MUSIC_MCP_LOG_FILE) {
  configurationIssues.push('MUSIC_MCP_LOG_FILE not set, using default');
}

if (!await checkMusicAppAvailable()) {
  configurationIssues.push('Music app not found or not accessible');
}
```

## Testing Strategy

### Unit Tests (Vitest)
```typescript
// tests/unit/tools.test.ts
import { describe, it, expect } from 'vitest';
import { executeCommand } from '../src/tools/music-control';

describe('Music Control', () => {
  it('should handle play command', async () => {
    const result = await executeCommand({ command: 'play' });
    expect(result.success).toBe(true);
  });
  
  it('should validate volume range', () => {
    expect(() => executeCommand({ command: 'play', volume: 150 }))
      .toThrow('Volume must be between 0 and 100');
  });
});
```

### E2E Tests
```typescript
// tests/e2e/integration.test.ts
describe('MCP Server Integration', () => {
  it('should respond to info command', async () => {
    const response = await sendMCPRequest('info', {});
    expect(response.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
```

## Build Configuration

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Package.json
```json
{
  "name": "@yourusername/music-mcp",
  "version": "1.0.0",
  "description": "MCP server for controlling Apple Music on macOS (v1.0.0)",
  "main": "dist/index.js",
  "bin": {
    "music-mcp": "dist/index.js"
  },
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc && npm run postbuild",
    "postbuild": "chmod +x dist/index.js",
    "prepublishOnly": "npm run build && npm run test",
    "test": "vitest",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "lint": "eslint src --ext .ts",
    "prepare-release": "node scripts/prepare-release.js",
    "inspector": "npx @modelcontextprotocol/inspector node dist/index.js"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "music",
    "apple-music",
    "macos",
    "automation",
    "applescript"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/music-mcp.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/music-mcp/issues"
  },
  "homepage": "https://github.com/yourusername/music-mcp#readme",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.2.0",
    "pino": "^8.0.0",
    "applescript": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "pino-pretty": "^10.0.0"
  }
}
```

### Entry Point (src/index.ts)
```typescript
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

async function main() {
  const server = new Server(
    {
      name: 'music-mcp',
      vendor: 'yourusername',
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
```

## Release Process

### prepare-release.js Script
Following the best practices, implement comprehensive checks:

1. **Git & Version Control**
   - Check current branch (warn if not main)
   - Check for uncommitted changes
   - Check sync with origin/main
   - Version availability check
   - Version consistency check
   - Changelog entry check

2. **Code Quality**
   - Dependency installation
   - Outdated dependencies (warning)
   - Security audit
   - TypeScript compilation
   - TypeScript tests
   - ESLint checks
   - File size limits (no file > 500 LOC)

3. **Package Validation**
   - Required package.json fields
   - Package size check (warn if > 2MB)
   - Critical files included
   - MCP server smoke test

4. **Beta Release**
   - First release with `beta` tag
   - Test with `npx @yourusername/music-mcp@beta`

## AppleScript Best Practices

### Error Handling in AppleScript
```applescript
on run argv
    try
        tell application "Music"
            if not running then
                return "Error: Music app is not running"
            end if
            
            -- Main logic here
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run
```

### Parameter Validation
```applescript
on setVolume(volumeLevel)
    if volumeLevel < 0 or volumeLevel > 100 then
        return "Error: Volume must be between 0 and 100"
    end if
    
    tell application "Music"
        set sound volume to volumeLevel
    end tell
end setVolume
```

## MCP Configuration

### For npm Published Version
Users can run the MCP server directly via npx:

```json
{
  "mcpServers": {
    "music": {
      "command": "npx",
      "args": ["@yourusername/music-mcp@latest"],
      "env": {
        "MUSIC_MCP_LOG_LEVEL": "info",
        "MUSIC_MCP_LOG_FILE": "~/Library/Logs/music-mcp.log"
      }
    }
  }
}
```

### For Development/Local Version
```json
{
  "mcpServers": {
    "music": {
      "command": "node",
      "args": ["path/to/music-mcp/dist/index.js"],
      "env": {
        "MUSIC_MCP_LOG_LEVEL": "debug",
        "MUSIC_MCP_CONSOLE_LOGGING": "true"
      }
    }
  }
}
```

## Publishing to npm

### Pre-publish Checklist
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run prepare-release`
4. Commit all changes
5. Create git tag: `git tag v1.0.0`

### Publishing Steps
```bash
# Build the project
npm run build

# Login to npm (if not already)
npm login

# Publish beta version first
npm publish --tag beta

# Test the beta version
npx @yourusername/music-mcp@beta

# If everything works, publish stable
npm publish

# Push tags to GitHub
git push origin main --tags
```

### Testing npx Installation
```bash
# Clear npm cache to ensure fresh install
npm cache clean --force

# Test direct execution
npx @yourusername/music-mcp@latest

# Test with MCP Inspector
npx @modelcontextprotocol/inspector npx @yourusername/music-mcp@latest
```

## Code Quality Standards

1. **No file exceeds 300 lines** (max 500)
2. **All dependencies at latest stable versions**
3. **No ESLint or TypeScript errors**
4. **Comprehensive error messages** that help users self-correct
5. **No console output during normal operation**
6. **Dynamic version reading** from package.json
7. **Lenient parameter parsing** while maintaining strict schemas

## Future Enhancements

1. **Smart Playlists**: Support for creating and managing smart playlists
2. **Radio Stations**: Control Apple Music radio stations
3. **Recommendations**: Access Apple Music recommendations
4. **Lyrics**: Retrieve and display song lyrics
5. **Social Features**: Share tracks and playlists
6. **Advanced Search**: Support for complex search queries
7. **Batch Operations**: Bulk add/remove tracks from playlists
8. **Export Features**: Export playlists to various formats

## License

MIT License - Same as the original macos-automator-mcp project

## Contributing

Contributions should follow these MCP best practices:
- Run `npm run prepare-release` before submitting PRs
- Keep files under 300 LOC
- Include comprehensive tests
- Update CHANGELOG.md
- Follow semantic versioning
- Test with beta releases first