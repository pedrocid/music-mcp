# Music MCP

[![npm version](https://badge.fury.io/js/%40pedrocid%2Fmusic-mcp.svg)](https://badge.fury.io/js/%40pedrocid%2Fmusic-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for controlling Apple Music on macOS using AppleScript. This connector provides a structured interface for AI assistants like Claude to interact with the Music app, enabling playback control, library management, and music information retrieval.

## Features

- **Playback Control**: Play, pause, skip tracks, and control volume
- **Current Track Information**: Get detailed track metadata and playback status
- **Library Management**: Search tracks, albums, artists, and browse your library
- **Playlist Management**: Create, manage, and modify playlists
- **Queue Management**: View and control the up next queue
- **Diagnostic Tools**: Built-in info command for troubleshooting

## Requirements

- macOS (required for Apple Music and AppleScript)
- Node.js 18.0.0 or higher
- Apple Music app installed and accessible
- Automation permissions granted to your terminal/app

## Installation

### Via npm (Recommended)

```bash
npx @pedrocid/music-mcp@latest
```

### For Development

```bash
git clone https://github.com/pedrocid/music-mcp.git
cd music-mcp
npm install
npm run build
```

## Configuration

### Claude Desktop Configuration

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "music": {
      "command": "npx",
      "args": ["@pedrocid/music-mcp@latest"]
    }
  }
}
```

### Environment Variables (Optional)

All environment variables are optional. The server uses stderr logging by default and works without any configuration.

| Variable | Default | Description |
|----------|---------|-------------|
| `MUSIC_MCP_LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |
| `MUSIC_MCP_FILE_LOGGING` | `false` | Enable file logging (disabled by default) |
| `MUSIC_MCP_LOG_FILE` | `~/Library/Logs/music-mcp.log` | Log file location (only used if file logging enabled) |
| `MUSIC_MCP_CACHE_TTL` | `300` | Cache timeout in seconds |
| `MUSIC_MCP_MAX_SEARCH_RESULTS` | `50` | Maximum search results |
| `MUSIC_MCP_TIMEOUT_SECONDS` | `30` | Default timeout for operations |
| `MUSIC_MCP_ARTWORK_EXPORT` | `true` | Enable album artwork export |
| `MUSIC_MCP_LENIENT_PARSING` | `true` | Accept variations in parameter names |

## Available Tools

### `info`
Get diagnostic information about the MCP server status.

```json
{
  "command": "info"
}
```

Returns version information, Music app availability, and configuration status.

### `execute_music_command`
Execute music playback control commands.

```json
{
  "command": "play|pause|next|previous|toggle_playback",
  "volume": 75,
  "position": 30,
  "shuffleMode": true,
  "repeatMode": "all",
  "rating": 4
}
```

### `get_music_info`
Retrieve information about current playback or library.

```json
{
  "infoType": "current_track|playback_status|queue|library_stats",
  "format": "simple|detailed"
}
```

### `search_music`
Search the music library.

```json
{
  "query": "artist name or song title",
  "searchType": "all|track|album|artist|playlist",
  "limit": 25
}
```

### `manage_playlist`
Create and manage playlists.

```json
{
  "action": "create|add_track|remove_track|rename|delete|list",
  "playlistName": "My Playlist",
  "trackId": "search term for track",
  "newName": "New Playlist Name"
}
```

## Permissions

When first using the MCP server, macOS will prompt you to grant automation permissions. You need to:

1. Allow your terminal app (Terminal.app, iTerm2, etc.) to control "Music"
2. Go to System Preferences > Security & Privacy > Privacy > Automation
3. Ensure your terminal app has permission to control "Music"

## Troubleshooting

### Check Server Status

```bash
npx @pedrocid/music-mcp@latest
# Then use the info tool to check status
```

### Common Issues

**"Music app is not running"**
- The server automatically launches the Music app when needed
- If issues persist, manually open the Music app first

**"AppleScript execution failed"**
- Grant automation permissions in System Preferences
- Ensure Music app is accessible and not restricted

**"No tracks found"**
- Check that you have music in your library
- Verify your Apple Music subscription is active

### Debugging

The server logs to stderr by default, which Claude Desktop captures. For additional debugging, you can:

1. Check Claude Desktop's MCP logs
2. Enable file logging by setting `MUSIC_MCP_FILE_LOGGING=true` environment variable
3. Use the `info` tool to check server diagnostics

## Example Usage

Here are some example interactions you can have with Claude using this MCP server:

- "Play my music and set the volume to 50%"
- "What song is currently playing?"
- "Search for songs by Taylor Swift"
- "Create a playlist called 'Road Trip' and add some upbeat songs"
- "Skip to the next track"
- "Show me my library statistics"

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test              # Unit tests
npm run test:e2e      # Integration tests
```

### Linting

```bash
npm run lint
```

### Release Preparation

```bash
npm run prepare-release
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Run the release preparation: `npm run prepare-release`
6. Commit your changes: `git commit -am 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [GitHub Issues](https://github.com/pedrocid/music-mcp/issues)
- [Documentation](https://github.com/pedrocid/music-mcp#readme)

## Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol/mcp)
- [Claude Desktop](https://claude.ai/desktop) 