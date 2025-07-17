# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- Initial release of Music MCP server
- Playback control tools (play, pause, next, previous, volume)
- Current track information retrieval
- Library management and search functionality
- Playlist creation and management
- Queue management capabilities
- Comprehensive AppleScript integration
- Robust error handling and logging with Pino
- Environment variable configuration
- Comprehensive test suite with Vitest
- Release preparation script with automated checks
- TypeScript support with full type definitions
- MCP SDK integration for Claude Desktop compatibility

### Features
- **Core Tools**: `info`, `execute_music_command`, `get_music_info`, `search_music`, `manage_playlist`
- **AppleScript Integration**: Full Apple Music app control via AppleScript
- **Configuration**: Environment-based configuration with sensible defaults
- **Logging**: Structured logging with file and console output options
- **Testing**: Unit and integration tests for all components
- **Documentation**: Comprehensive README and inline documentation

### Technical Details
- Node.js 18+ support
- TypeScript compilation with CommonJS output
- ESLint configuration for code quality
- Vitest for testing framework
- Pino for structured logging
- Comprehensive error handling
- Automated release preparation

### Requirements
- macOS (for Apple Music and AppleScript)
- Node.js 18.0.0 or higher
- Apple Music app
- Automation permissions for terminal application 