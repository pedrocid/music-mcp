import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getVersion } from '../version.js';
import { validateConfig } from '../config.js';
import { logger } from '../logger.js';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import os from 'os';
import { dirname } from 'path';

export interface InfoInput {
  command: 'info';
}

export interface InfoOutput {
  version: string;
  musicAppAvailable: boolean;
  appleScriptAvailable: boolean;
  loggerPath: string;
  loggerStatus: 'ok' | 'error';
  configurationIssues: string[];
}

export const infoTool: Tool = {
  name: 'info',
  description: 'Get diagnostic information about the Music MCP server status',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        enum: ['info'],
        description: 'Command to execute'
      }
    },
    required: ['command']
  }
};

export async function handleInfoCommand(): Promise<InfoOutput> {
  logger.info('Handling info command');

  const configurationIssues = validateConfig();
  
  // Check Music app availability
  let musicAppAvailable = false;
  try {
    execSync('osascript -e "tell application \\"Music\\" to get version"', { 
      timeout: 5000,
      stdio: 'pipe' 
    });
    musicAppAvailable = true;
  } catch (error) {
    configurationIssues.push('Music app not accessible or not installed');
  }

  // Check AppleScript availability
  let appleScriptAvailable = false;
  try {
    execSync('which osascript', { timeout: 5000, stdio: 'pipe' });
    appleScriptAvailable = true;
  } catch (error) {
    configurationIssues.push('AppleScript (osascript) not available');
  }

  // Check logger status - primarily using stderr now
  let loggerPath = 'stderr (standard error)';
  let loggerStatus: 'ok' | 'error' = 'ok';

  // Check if file logging is enabled and accessible
  if (process.env.NODE_ENV === 'development' || process.env.MUSIC_MCP_FILE_LOGGING === 'true') {
    const logFile = process.env.MUSIC_MCP_LOG_FILE || 
      `${os.homedir()}/Library/Logs/music-mcp.log`;
    
    try {
      const logDir = dirname(logFile);
      if (existsSync(logDir) || existsSync(logFile)) {
        loggerPath = `stderr + file: ${logFile}`;
      } else {
        loggerPath = `stderr (file logging failed: ${logFile})`;
        configurationIssues.push(`Optional log file directory not accessible: ${logDir}`);
      }
    } catch (error) {
      loggerPath = 'stderr (file logging disabled due to error)';
    }
  }

  return {
    version: getVersion(),
    musicAppAvailable,
    appleScriptAvailable,
    loggerPath,
    loggerStatus,
    configurationIssues
  };
} 