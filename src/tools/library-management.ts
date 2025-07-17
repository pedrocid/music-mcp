import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../logger.js';
import { getConfig } from '../config.js';
import { execSync } from 'child_process';
import { join } from 'path';

export interface GetMusicInfoInput {
  infoType: 'current_track' | 'playback_status' | 'queue' | 'library_stats';
  format?: 'simple' | 'detailed'; // optional, default: 'simple'
}

export interface SearchMusicInput {
  query: string; // required
  searchType?: 'all' | 'track' | 'album' | 'artist' | 'playlist'; // optional, default: 'all'
  limit?: number; // optional, default: 50
}

export interface MusicInfoOutput {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

export const getMusicInfoTool: Tool = {
  name: 'get_music_info',
  description: 'Retrieve information about current playback or library',
  inputSchema: {
    type: 'object',
    properties: {
      infoType: {
        type: 'string',
        enum: ['current_track', 'playback_status', 'queue', 'library_stats'],
        description: 'Type of information to retrieve'
      },
      format: {
        type: 'string',
        enum: ['simple', 'detailed'],
        description: 'Output format detail level'
      }
    },
    required: ['infoType']
  }
};

export const searchMusicTool: Tool = {
  name: 'search_music',
  description: 'Search the music library',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string'
      },
      searchType: {
        type: 'string',
        enum: ['all', 'track', 'album', 'artist', 'playlist'],
        description: 'Type of content to search for'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: 'Maximum number of results to return'
      }
    },
    required: ['query']
  }
};

export async function handleGetMusicInfo(input: GetMusicInfoInput): Promise<MusicInfoOutput> {
  logger.info({ infoType: input.infoType }, 'Getting music info');
  
  const config = getConfig();

  try {
    let result: string;

    switch (input.infoType) {
      case 'current_track':
      case 'playback_status':
        result = await executeAppleScript(
          join(__dirname, '../scripts/library/get-current-track.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        break;

              case 'library_stats': {
          // For library stats, we'll get playlists and albums
          const playlistsResult = await executeAppleScript(
            join(__dirname, '../scripts/library/get-playlists.applescript'),
            [],
            config.timeoutSeconds * 1000
          );
          
          const albumsResult = await executeAppleScript(
            join(__dirname, '../scripts/library/get-albums.applescript'),
            [],
            config.timeoutSeconds * 1000
          );

          result = JSON.stringify({
            playlists: JSON.parse(playlistsResult),
            albums: JSON.parse(albumsResult)
          });
          break;
        }

      case 'queue':
        // For queue info, we'll return current track info for now
        // (Apple Music's queue access is limited via AppleScript)
        result = await executeAppleScript(
          join(__dirname, '../scripts/library/get-current-track.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        break;

      default:
        return {
          success: false,
          message: `Unknown info type: ${input.infoType}`,
          error: 'Invalid info type'
        };
    }

    if (result.startsWith('Error')) {
      return {
        success: false,
        message: result,
        error: result
      };
    }

    // Try to parse JSON result
    let data;
    try {
      data = JSON.parse(result);
    } catch {
      // If not JSON, return as string
      data = result;
    }

    return {
      success: true,
      data,
      message: 'Music info retrieved successfully'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error, infoType: input.infoType }, 'Failed to get music info');
    return {
      success: false,
      message: `Failed to retrieve music info: ${errorMessage}`,
      error: errorMessage
    };
  }
}

export async function handleSearchMusic(input: SearchMusicInput): Promise<MusicInfoOutput> {
  logger.info({ query: input.query, searchType: input.searchType }, 'Searching music');
  
  const config = getConfig();
  const limit = Math.min(input.limit || config.maxSearchResults, 100);

  try {
    if (!input.query.trim()) {
      return {
        success: false,
        message: 'Search query cannot be empty',
        error: 'Empty query'
      };
    }

    let result: string;

    switch (input.searchType || 'all') {
      case 'all':
      case 'track':
        result = await executeAppleScript(
          join(__dirname, '../scripts/library/search-tracks.applescript'),
          [input.query],
          config.timeoutSeconds * 1000
        );
        break;

      case 'playlist':
        result = await executeAppleScript(
          join(__dirname, '../scripts/library/get-playlists.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        // Filter playlists by search query
        try {
          const playlists = JSON.parse(result);
          const filtered = playlists.filter((playlist: any) => 
            playlist.name.toLowerCase().includes(input.query.toLowerCase())
          );
          result = JSON.stringify(filtered.slice(0, limit));
        } catch {
          // If parsing fails, return original result
        }
        break;

      case 'album':
        result = await executeAppleScript(
          join(__dirname, '../scripts/library/get-albums.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        // Filter albums by search query
        try {
          const albums = JSON.parse(result);
          const filtered = albums.filter((album: any) => 
            album.album.toLowerCase().includes(input.query.toLowerCase()) ||
            album.artist.toLowerCase().includes(input.query.toLowerCase())
          );
          result = JSON.stringify(filtered.slice(0, limit));
        } catch {
          // If parsing fails, return original result
        }
        break;

      case 'artist':
        result = await executeAppleScript(
          join(__dirname, '../scripts/library/get-albums.applescript'),
          [],
          config.timeoutSeconds * 1000
        );
        // Filter by artist
        try {
          const albums = JSON.parse(result);
          const filtered = albums.filter((album: any) => 
            album.artist.toLowerCase().includes(input.query.toLowerCase())
          );
          result = JSON.stringify(filtered.slice(0, limit));
        } catch {
          // If parsing fails, return original result
        }
        break;

      default:
        return {
          success: false,
          message: `Unknown search type: ${input.searchType}`,
          error: 'Invalid search type'
        };
    }

    if (result.startsWith('Error')) {
      return {
        success: false,
        message: result,
        error: result
      };
    }

    // Try to parse JSON result
    let data;
    try {
      data = JSON.parse(result);
      // Apply limit if it's an array
      if (Array.isArray(data)) {
        data = data.slice(0, limit);
      }
    } catch {
      // If not JSON, return as string
      data = result;
    }

    return {
      success: true,
      data,
      message: `Found ${Array.isArray(data) ? data.length : 1} result(s)`
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error, query: input.query }, 'Music search failed');
    return {
      success: false,
      message: `Search failed: ${errorMessage}`,
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