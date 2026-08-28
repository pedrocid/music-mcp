import { describe, it, expect } from 'vitest';
import { parseAlbumsBlob } from '../../src/tools/library-management.js';

const RS = '\u001e';
const US = '\u001f';

describe('parseAlbumsBlob', () => {
  it('pairs up parallel album/artist lists', () => {
    const raw = ['Album A', 'Album B'].join(US) + RS + ['Artist A', 'Artist B'].join(US);

    expect(parseAlbumsBlob(raw)).toEqual([
      { album: 'Album A', artist: 'Artist A' },
      { album: 'Album B', artist: 'Artist B' }
    ]);
  });

  it('de-duplicates repeated album/artist pairs without dropping unrelated ones', () => {
    // Simulates a library where many tracks share the same album -- the
    // real-world case (a 1000+ track library with a couple hundred unique
    // albums) the old O(n^2) AppleScript membership check + 100-album cap
    // handled incorrectly.
    const albums = ['Freedom', 'Freedom', 'Freedom', 'Confessions', 'Trouble'];
    const artists = ['Wiz Khalifa', 'Wiz Khalifa', 'Wiz Khalifa', 'Usher', 'Trey Songz'];
    const raw = albums.join(US) + RS + artists.join(US);

    expect(parseAlbumsBlob(raw)).toEqual([
      { album: 'Freedom', artist: 'Wiz Khalifa' },
      { album: 'Confessions', artist: 'Usher' },
      { album: 'Trouble', artist: 'Trey Songz' }
    ]);
  });

  it('keeps albums with the same title by different artists as distinct entries', () => {
    const albums = ['Greatest Hits', 'Greatest Hits'];
    const artists = ['Artist One', 'Artist Two'];
    const raw = albums.join(US) + RS + artists.join(US);

    expect(parseAlbumsBlob(raw)).toEqual([
      { album: 'Greatest Hits', artist: 'Artist One' },
      { album: 'Greatest Hits', artist: 'Artist Two' }
    ]);
  });

  it('does not cap results at 100 unique albums', () => {
    const albums = Array.from({ length: 250 }, (_, i) => `Album ${i}`);
    const artists = Array.from({ length: 250 }, (_, i) => `Artist ${i}`);
    const raw = albums.join(US) + RS + artists.join(US);

    expect(parseAlbumsBlob(raw)).toHaveLength(250);
  });

  it('handles an empty library', () => {
    const raw = '' + RS + '';

    expect(parseAlbumsBlob(raw)).toEqual([]);
  });

  it('ignores trailing/mismatched entries beyond the shorter list', () => {
    // Defensive: if the two lists ever come back different lengths, only
    // pair up what both lists actually have rather than throwing or reading
    // past the end of either array.
    const raw = ['A', 'B', 'C'].join(US) + RS + ['X', 'Y'].join(US);

    expect(parseAlbumsBlob(raw)).toEqual([
      { album: 'A', artist: 'X' },
      { album: 'B', artist: 'Y' }
    ]);
  });
});
