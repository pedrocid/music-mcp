import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../logger.js';
import { getConfig } from '../config.js';
import { execSync } from 'child_process';
import { join } from 'path';

export interface ExecuteMusicCommandInput {
  command: 'play' | 'pause' | 'next' | 'previous' | 'toggle_playback';
  volume?: number; // 0-100, optional with default
  position?: number; // seconds, optional
  shuffleMode?: boolean; // optional, default: current setting
  repeatMode?: 'off' | 'one' | 'all'; // optional, default: current setting
  rating?: number; // 0-5, optional
  timeoutSeconds?: number; // optional, default: 30
}

export interface ExecuteMusicCommandOutput {
  success: boolean;
  message: string;
  error?: string;
}

export const executeMusicCommandTool: Tool = {
  name: 'execute_music_command',
  description: 'Execute music playback control commands',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        enum: ['play', 'pause', 'next', 'previous', 'toggle_playback'],
        description: 'The playback command to execute'
      },
      volume: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Volume level (0-100)'
      },
      position: {
        type: 'number',
        minimum: 0,
        description: 'Position in track (seconds)'
      },
      shuffleMode: {
        type: 'boolean',
        description: 'Enable or disable shuffle mode'
      },
      repeatMode: {
        type: 'string',
        enum: ['off', 'one', 'all'],
        description: 'Repeat mode setting'
      },
      rating: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        description: 'Track rating (0-5 stars)'
      },
      timeoutSeconds: {
        type: 'number',
        minimum: 1,
        description: 'Timeout for the operation in seconds'
      }
    },
    required: ['command']
  }
};

export async function handleExecuteMusicCommand(input: ExecuteMusicCommandInput): Promise<ExecuteMusicCommandOutput> {
  logger.info({ command: input.command }, 'Executing music command');
  
  const config = getConfig();
  const timeout = (input.timeoutSeconds || config.timeoutSeconds) * 1000;

  try {
    // Validate volume if provided
    if (input.volume !== undefined && (input.volume < 0 || input.volume > 100)) {
      return {
        success: false,
        message: 'Volume must be between 0 and 100',
        error: 'Invalid volume range'
      };
    }

    // Validate rating if provided
    if (input.rating !== undefined && (input.rating < 0 || input.rating > 5)) {
      return {
        success: false,
        message: 'Rating must be between 0 and 5',
        error: 'Invalid rating range'
      };
    }

    let result: string;

    switch (input.command) {
      case 'play':
      case 'pause':
      case 'toggle_playback':
        result = await executeAppleScript(
          join(__dirname, '../scripts/playback/play-pause.applescript'),
          [],
          timeout
        );
        break;

      case 'next':
        result = await executeAppleScript(
          join(__dirname, '../scripts/playback/next-track.applescript'),
          [],
          timeout
        );
        break;

      case 'previous':
        result = await executeAppleScript(
          join(__dirname, '../scripts/playback/previous-track.applescript'),
          [],
          timeout
        );
        break;

      default:
        return {
          success: false,
          message: `Unknown command: ${input.command}`,
          error: 'Invalid command'
        };
    }

    // Handle volume setting separately if provided
    if (input.volume !== undefined) {
      await executeAppleScript(
        join(__dirname, '../scripts/playback/set-volume.applescript'),
        [input.volume.toString()],
        timeout
      );
    }

    if (result.startsWith('Error')) {
      return {
        success: false,
        message: result,
        error: result
      };
    }

    return {
      success: true,
      message: result
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error, command: input.command }, 'Music command execution failed');
    return {
      success: false,
      message: `Failed to execute command: ${errorMessage}. Ensure Music app is running and you have granted automation permissions.`,
      error: errorMessage
    };
  }
}

async function executeAppleScript(scriptPath: string, args: string[] = [], timeout: number = 30000): Promise<string> {
  try {
    // Build the command with properly escaped arguments
    const quotedArgs = args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ');
    const command = `osascript "${scriptPath}" ${quotedArgs}`;
    
    const result = execSync(command, {
      timeout,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    return result.toString().trim();
  } catch (error: any) {
    if (error.code === 'TIMEOUT') {
      throw new Error(`AppleScript execution timed out after ${timeout}ms`);
    }
    throw new Error(`AppleScript execution failed: ${error.message}`);
  }
} 