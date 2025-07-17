import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../logger.js';
import { getConfig } from '../config.js';
import { execSync } from 'child_process';
import { join } from 'path';

export interface QueueMusicInput {
  action: 'view_queue' | 'add_to_queue' | 'play_queue' | 'clear_queue' | 'play_playlist';
  trackSearchTerm?: string; // required for add_to_queue
  playlistName?: string; // required for play_playlist
  shuffle?: boolean; // optional for play_playlist
}

export interface QueueMusicOutput {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

export const queueMusicTool: Tool = {
  name: 'queue_music',
  description: 'Manage music queue and enhanced playlist control',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['view_queue', 'add_to_queue', 'play_queue', 'clear_queue', 'play_playlist'],
        description: 'Queue management action to perform'
      },
      trackSearchTerm: {
        type: 'string',
        description: 'Track name or search term (required for add_to_queue)'
      },
      playlistName: {
        type: 'string',
        description: 'Name of the playlist (required for play_playlist)'
      },
      shuffle: {
        type: 'boolean',
        description: 'Whether to shuffle the playlist (optional for play_playlist)'
      }
    },
    required: ['action']
  }
};

export async function handleQueueMusic(input: QueueMusicInput): Promise<QueueMusicOutput> {
  logger.info({ action: input.action }, 'Managing music queue');
  
  const config = getConfig();

  try {
    let result: string;

    switch (input.action) {
      case 'view_queue':
        result = await executeAppleScript(
          join(__dirname, '../scripts/queue/get-queue-info.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        break;

      case 'add_to_queue':
        if (!input.trackSearchTerm) {
          return {
            success: false,
            message: 'Track search term is required for add_to_queue action',
            error: 'Missing track search term'
          };
        }
        result = await executeAppleScript(
          join(__dirname, '../scripts/queue/add-to-queue.applescript'),
          [input.trackSearchTerm],
          config.timeoutSeconds * 1000
        );
        break;

      case 'play_queue':
        result = await executeAppleScript(
          join(__dirname, '../scripts/queue/play-queue.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        break;

      case 'clear_queue':
        result = await executeAppleScript(
          join(__dirname, '../scripts/queue/clear-queue.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        break;

      case 'play_playlist':
        if (!input.playlistName) {
          return {
            success: false,
            message: 'Playlist name is required for play_playlist action',
            error: 'Missing playlist name'
          };
        }
        const shuffleParam = input.shuffle ? 'true' : 'false';
        result = await executeAppleScript(
          join(__dirname, '../scripts/playlist/play-playlist.applescript'),
          [input.playlistName, shuffleParam],
          config.timeoutSeconds * 1000
        );
        break;

      default:
        return {
          success: false,
          message: `Unknown action: ${input.action}`,
          error: 'Invalid action'
        };
    }

    if (result.startsWith('Error')) {
      return {
        success: false,
        message: result,
        error: result
      };
    }

    // Try to parse JSON result for view_queue
    let data;
    if (input.action === 'view_queue') {
      try {
        data = JSON.parse(result);
      } catch {
        // If not JSON, return as string
        data = result;
      }
    } else {
      data = result;
    }

    return {
      success: true,
      data,
      message: result
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error, action: input.action }, 'Queue management failed');
    return {
      success: false,
      message: `Queue ${input.action} failed: ${errorMessage}`,
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