import pino from 'pino';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import os from 'os';

// Create logger with stderr output (for Claude Desktop) and optional file logging
function createLogger() {
  const targets: any[] = [];

  // Try to add stderr logging with pino-pretty, fallback to basic stderr
  try {
    targets.push({
      target: 'pino-pretty',
      options: { 
        destination: 2, // stderr
        colorize: false,
        translateTime: true
      }
    });
  } catch (error) {
    // Fallback to basic stderr logging without pino-pretty
    targets.push({
      target: 'pino/file',
      options: { destination: 2 }
    });
  }

  // Only add file logging in development or if explicitly requested
  if (process.env.NODE_ENV === 'development' || process.env.MUSIC_MCP_FILE_LOGGING === 'true') {
    const logFile = process.env.MUSIC_MCP_LOG_FILE || 
      `${os.homedir()}/Library/Logs/music-mcp.log`;
    
    try {
      // Ensure log directory exists synchronously
      const logDir = dirname(logFile);
      require('fs').mkdirSync(logDir, { recursive: true });
      
      targets.push({
        target: 'pino/file',
        options: { destination: logFile }
      });
    } catch (error) {
      // If file logging fails, continue with just stderr
      console.error(`Warning: Could not setup file logging: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  try {
    return pino({
      level: (process.env.MUSIC_MCP_LOG_LEVEL || 'info').toLowerCase(),
      transport: { targets }
    });
  } catch (error) {
    // Ultimate fallback to basic console logging
    console.error(`Warning: Could not create advanced logger, using console: ${error instanceof Error ? error.message : String(error)}`);
    return pino({
      level: (process.env.MUSIC_MCP_LOG_LEVEL || 'info').toLowerCase()
    });
  }
}

export const logger = createLogger();

// Ensure flush on exit
process.on('exit', () => logger.flush());
process.on('SIGINT', () => logger.flush());
process.on('SIGTERM', () => logger.flush()); 