import pino from 'pino';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import os from 'os';

const logFile = process.env.MUSIC_MCP_LOG_FILE || 
  `${os.homedir()}/Library/Logs/music-mcp.log`;

// Ensure log directory exists
async function ensureLogDirectory(): Promise<string> {
  try {
    await mkdir(dirname(logFile), { recursive: true });
    return logFile;
  } catch (error) {
    // Fallback to temp directory if cannot create
    return `${os.tmpdir()}/music-mcp.log`;
  }
}

// Initialize logger synchronously with fallback
let logPath = logFile;
ensureLogDirectory().then(path => {
  logPath = path;
}).catch(() => {
  logPath = `${os.tmpdir()}/music-mcp.log`;
});

export const logger = pino({
  level: (process.env.MUSIC_MCP_LOG_LEVEL || 'info').toLowerCase(),
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { destination: logPath }
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
process.on('SIGINT', () => logger.flush());
process.on('SIGTERM', () => logger.flush());

export { logPath }; 