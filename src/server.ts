import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { logger } from './logger.js';
import { infoTool, handleInfoCommand } from './tools/info.js';
import { 
  executeMusicCommandTool, 
  handleExecuteMusicCommand, 
  ExecuteMusicCommandInput 
} from './tools/music-control.js';
import { 
  getMusicInfoTool, 
  searchMusicTool, 
  handleGetMusicInfo, 
  handleSearchMusic,
  GetMusicInfoInput,
  SearchMusicInput 
} from './tools/library-management.js';
import { 
  managePlaylistTool, 
  handleManagePlaylist, 
  ManagePlaylistInput 
} from './tools/playlist-management.js';

export async function registerTools(server: Server): Promise<void> {
  // Register tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        infoTool,
        executeMusicCommandTool,
        getMusicInfoTool,
        searchMusicTool,
        managePlaylistTool
      ]
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;
    
    logger.info({ toolName: name }, 'Handling tool call');

    try {
      switch (name) {
        case 'info': {
          const infoResult = await handleInfoCommand();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(infoResult, null, 2)
              }
            ]
          };
        }

        case 'execute_music_command': {
          const commandResult = await handleExecuteMusicCommand(args as ExecuteMusicCommandInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(commandResult, null, 2)
              }
            ]
          };
        }

        case 'get_music_info': {
          const infoData = await handleGetMusicInfo(args as GetMusicInfoInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(infoData, null, 2)
              }
            ]
          };
        }

        case 'search_music': {
          const searchResult = await handleSearchMusic(args as SearchMusicInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(searchResult, null, 2)
              }
            ]
          };
        }

        case 'manage_playlist': {
          const playlistResult = await handleManagePlaylist(args as ManagePlaylistInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(playlistResult, null, 2)
              }
            ]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error({ error, toolName: name }, 'Tool execution failed');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Tool execution failed: ${(error as Error).message}`
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  });

  logger.info('All MCP tools registered successfully');
} 