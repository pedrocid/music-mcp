import { describe, it, expect, vi } from 'vitest';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(() => 'ok'),
  execSync: vi.fn(() => {
    throw new Error('execSync must not be used for AppleScript calls');
  })
}));

import { execFileSync, execSync } from 'child_process';
import { handleManagePlaylist } from '../../src/tools/playlist-management.js';

describe('AppleScript argument passing', () => {
  it('passes untrusted names to osascript as a literal argv entry, never via a shell', async () => {
    const hostile = 'x" $(touch /tmp/music-mcp-pwned) `id`';

    const result = await handleManagePlaylist({ action: 'create', playlistName: hostile });

    expect(result.success).toBe(true);
    expect(execSync).not.toHaveBeenCalled();
    const [file, argv] = vi.mocked(execFileSync).mock.calls[0];
    expect(file).toBe('osascript');
    expect(argv).toEqual([expect.stringMatching(/create-playlist\.applescript$/), hostile]);
  });
});
