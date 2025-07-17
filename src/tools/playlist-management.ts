import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../logger.js';
import { getConfig } from '../config.js';
import applescript from 'applescript';
import { join } from 'path';

export interface ManagePlaylistInput {
  action: 'create' | 'add_track' | 'remove_track' | 'rename' | 'delete' | 'list' | 'get_tracks';
  playlistName?: string; // required for most actions
  trackId?: string; // required for add/remove track
  newName?: string; // required for rename
}

export interface PlaylistOutput {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

export const managePlaylistTool: Tool = {
  name: 'manage_playlist',
  description: 'Create and manage playlists',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'add_track', 'remove_track', 'rename', 'delete', 'list', 'get_tracks'],
        description: 'Action to perform on playlists'
      },
      playlistName: {
        type: 'string',
        description: 'Name of the playlist (required for most actions)'
      },
      trackId: {
        type: 'string',
        description: 'Track identifier or search term (required for add/remove track)'
      },
      newName: {
        type: 'string',
        description: 'New name for the playlist (required for rename)'
      }
    },
    required: ['action']
  }
};

export async function handleManagePlaylist(input: ManagePlaylistInput): Promise<PlaylistOutput> {
  logger.info({ action: input.action, playlistName: input.playlistName }, 'Managing playlist');
  
  const config = getConfig();

  try {
    let result: string;

    switch (input.action) {
      case 'list':
        result = await executeAppleScript(
          join(__dirname, '../scripts/library/get-playlists.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        break;

      case 'create':
        if (!input.playlistName) {
          return {
            success: false,
            message: 'Playlist name is required for create action',
            error: 'Missing playlist name'
          };
        }
        result = await executeAppleScript(
          join(__dirname, '../scripts/playlist/create-playlist.applescript'),
          [input.playlistName],
          config.timeoutSeconds * 1000
        );
        break;

      case 'add_track':
        if (!input.playlistName || !input.trackId) {
          return {
            success: false,
            message: 'Playlist name and track ID/search term are required for add_track action',
            error: 'Missing required parameters'
          };
        }
        result = await executeAppleScript(
          join(__dirname, '../scripts/playlist/add-to-playlist.applescript'),
          [input.playlistName, input.trackId],
          config.timeoutSeconds * 1000
        );
        break;

      case 'get_tracks':
        if (!input.playlistName) {
          return {
            success: false,
            message: 'Playlist name is required for get_tracks action',
            error: 'Missing playlist name'
          };
        }
        result = await executeAppleScript(
          join(__dirname, '../scripts/playlist/get-playlist-tracks.applescript'),
          [input.playlistName],
          config.timeoutSeconds * 1000
        );
        break;

      case 'rename':
        if (!input.playlistName || !input.newName) {
          return {
            success: false,
            message: 'Current playlist name and new name are required for rename action',
            error: 'Missing required parameters'
          };
        }
        // For rename, we'll use AppleScript to change the playlist name
        result = await executeAppleScript(
          join(__dirname, '../scripts/playlist/rename-playlist.applescript'),
          [input.playlistName, input.newName],
          config.timeoutSeconds * 1000
        );
        break;

      case 'delete':
        if (!input.playlistName) {
          return {
            success: false,
            message: 'Playlist name is required for delete action',
            error: 'Missing playlist name'
          };
        }
        // For delete, we'll use AppleScript to remove the playlist
        result = await executeAppleScript(
          join(__dirname, '../scripts/playlist/delete-playlist.applescript'),
          [input.playlistName],
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

    // Try to parse JSON result for list operations
    let data;
    if (input.action === 'list' || input.action === 'get_tracks') {
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
    logger.error({ error, action: input.action }, 'Playlist management failed');
    return {
      success: false,
      message: `Playlist ${input.action} failed: ${errorMessage}`,
      error: errorMessage
    };
  }
}

async function executeAppleScript(scriptPath: string, args: string[] = [], timeout: number = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`AppleScript execution timed out after ${timeout}ms`));
    }, timeout);

    applescript.execFile(scriptPath, args, (error: Error | null, result: string) => {
      clearTimeout(timeoutId);
      
      if (error) {
        reject(error);
      } else {
        resolve(result || '');
      }
    });
  });
} 