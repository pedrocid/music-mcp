import os from 'os';

export interface Config {
  logFile: string;
  logLevel: string;
  consoleLogging: boolean;
  cacheTtl: number;
  maxSearchResults: number;
  timeoutSeconds: number;
  artworkExport: boolean;
  lenientParsing: boolean;
}

export function getConfig(): Config {
  return {
    logFile: process.env.MUSIC_MCP_LOG_FILE || `${os.homedir()}/Library/Logs/music-mcp.log`,
    logLevel: (process.env.MUSIC_MCP_LOG_LEVEL || 'info').toLowerCase(),
    consoleLogging: process.env.MUSIC_MCP_CONSOLE_LOGGING === 'true',
    cacheTtl: parseInt(process.env.MUSIC_MCP_CACHE_TTL || '300', 10),
    maxSearchResults: parseInt(process.env.MUSIC_MCP_MAX_SEARCH_RESULTS || '50', 10),
    timeoutSeconds: parseInt(process.env.MUSIC_MCP_TIMEOUT_SECONDS || '30', 10),
    artworkExport: process.env.MUSIC_MCP_ARTWORK_EXPORT !== 'false',
    lenientParsing: process.env.MUSIC_MCP_LENIENT_PARSING !== 'false'
  };
}

export function validateConfig(): string[] {
  const issues: string[] = [];
  const config = getConfig();

  if (config.cacheTtl < 0) {
    issues.push('MUSIC_MCP_CACHE_TTL must be non-negative');
  }

  if (config.maxSearchResults < 1) {
    issues.push('MUSIC_MCP_MAX_SEARCH_RESULTS must be positive');
  }

  if (config.timeoutSeconds < 1) {
    issues.push('MUSIC_MCP_TIMEOUT_SECONDS must be positive');
  }

  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    issues.push('MUSIC_MCP_LOG_LEVEL must be one of: debug, info, warn, error');
  }

  return issues;
} 