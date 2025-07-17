import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getVersion } from '../version.js';
import { validateConfig } from '../config.js';
import { logPath, logger } from '../logger.js';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

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

  // Check logger status
  const loggerStatus = existsSync(logPath) ? 'ok' : 'error';
  if (loggerStatus === 'error') {
    configurationIssues.push(`Log file not accessible: ${logPath}`);
  }

  return {
    version: getVersion(),
    musicAppAvailable,
    appleScriptAvailable,
    loggerPath: logPath,
    loggerStatus,
    configurationIssues
  };
} 