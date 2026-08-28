import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../logger.js';
import { getConfig, Config } from '../config.js';
import { execSync } from 'child_process';
import { join } from 'path';

// Delimiters used by get-albums.applescript to encode its two parallel lists
// (album names, artist names) into a single text result. ASCII "record
// separator" (0x1E) divides the album blob from the artist blob; ASCII "unit
// separator" (0x1F) divides items within each blob. Real track metadata
// practically never contains control characters, so this needs no per-item
// escaping on the AppleScript side.
const ALBUM_BLOB_RECORD_SEPARATOR = '\u001e';
const ALBUM_BLOB_UNIT_SEPARATOR = '\u001f';

export interface AlbumEntry {
  album: string;
  artist: string;
}

/**
 * Parses the raw delimited text produced by get-albums.applescript into a
 * de-duplicated list of {album, artist} pairs.
 *
 * get-albums.applescript fetches "album of every track ..." and
 * "artist of every track ..." as two bulk property lists -- each a single
 * Apple Event regardless of library size -- instead of looping over every
 * track and fetching "album of currentTrack" / "artist of currentTrack"
 * individually (two Apple Events per track, the dominant cost on large
 * libraries). Pairing the two lists back up and de-duplicating happens here,
 * in JS, with a Set so the whole operation is O(n). The AppleScript this
 * replaced did an O(n^2) linear "is not in processedAlbums" membership check
 * and O(n^2) string concatenation for every track, and additionally
 * hard-capped the result at 100 unique albums -- which silently dropped most
 * of a real library's albums (and any artist whose albums didn't happen to
 * land in the first 100 unique entries encountered) depending on track order.
 */
export function parseAlbumsBlob(raw: string): AlbumEntry[] {
  const [albumBlob = '', artistBlob = ''] = raw.split(ALBUM_BLOB_RECORD_SEPARATOR);
  const albums = albumBlob.length > 0 ? albumBlob.split(ALBUM_BLOB_UNIT_SEPARATOR) : [];
  const artists = artistBlob.length > 0 ? artistBlob.split(ALBUM_BLOB_UNIT_SEPARATOR) : [];

  const seen = new Set<string>();
  const result: AlbumEntry[] = [];

  const count = Math.min(albums.length, artists.length);
  for (let i = 0; i < count; i++) {
    const album = albums[i];
    const artist = artists[i];
    // Same "album - artist" pairing the old AppleScript de-dup key used, so
    // two albums that share a title but have different artists (or vice
    // versa) are still kept as distinct entries.
    const key = `${album}\u0000${artist}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({ album, artist });
  }

  return result;
}

async function getAlbumsJson(config: Config): Promise<string> {
  const raw = await executeAppleScript(
    join(__dirname, '../scripts/library/get-albums.applescript'),
    [],
    config.timeoutSeconds * 1000
  );

  if (raw.startsWith('Error')) {
    return raw;
  }

  // JSON.stringify handles quote/backslash/unicode escaping correctly,
  // unlike the old AppleScript which built the JSON string by hand and
  // could emit invalid JSON for album/artist names containing quotes.
  return JSON.stringify(parseAlbumsBlob(raw));
}

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
          
          const albumsResult = await getAlbumsJson(config);

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
        result = await getAlbumsJson(config);
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
        result = await getAlbumsJson(config);
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