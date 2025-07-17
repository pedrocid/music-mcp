import { describe, it, expect, beforeEach } from 'vitest';
import { handleInfoCommand } from '../../src/tools/info.js';
import { handleExecuteMusicCommand } from '../../src/tools/music-control.js';

describe('Info Tool', () => {
  it('should return version information', async () => {
    const result = await handleInfoCommand({ command: 'info' });
    
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(typeof result.musicAppAvailable).toBe('boolean');
    expect(typeof result.appleScriptAvailable).toBe('boolean');
    expect(typeof result.loggerPath).toBe('string');
    expect(['ok', 'error']).toContain(result.loggerStatus);
    expect(Array.isArray(result.configurationIssues)).toBe(true);
  });
});

describe('Music Control Tool', () => {
  it('should validate volume range', async () => {
    const result = await handleExecuteMusicCommand({ 
      command: 'play', 
      volume: 150 
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid volume range');
  });

  it('should validate rating range', async () => {
    const result = await handleExecuteMusicCommand({ 
      command: 'play', 
      rating: 10 
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid rating range');
  });

  it('should accept valid volume', async () => {
    const result = await handleExecuteMusicCommand({ 
      command: 'play', 
      volume: 50 
    });
    
    // Result depends on Music app availability, but should not fail validation
    expect(result.error).not.toBe('Invalid volume range');
  });

  it('should accept valid rating', async () => {
    const result = await handleExecuteMusicCommand({ 
      command: 'play', 
      rating: 3 
    });
    
    // Result depends on Music app availability, but should not fail validation
    expect(result.error).not.toBe('Invalid rating range');
  });
}); 