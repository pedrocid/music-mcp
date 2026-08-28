on run argv
    try
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if

            -- Bulk property access: "album of every track of library playlist 1"
            -- (and the same for "artist") resolves in a single Apple Event
            -- round-trip, regardless of library size. This is dramatically
            -- faster than looping over every track and asking for
            -- "album of currentTrack" / "artist of currentTrack" one at a
            -- time, which sends two Apple Events per track and dominates
            -- runtime on large libraries. Note: this only works when the
            -- property is fetched directly off the "every track of ..."
            -- specifier chain -- storing it in an intermediate variable
            -- first (e.g. "set allTracks to every track of ...") breaks the
            -- bulk-fetch optimization and Music.app raises error -1700.
            set albumValues to album of every track of library playlist 1
            set artistValues to artist of every track of library playlist 1

            -- Join each list into a single string, using ASCII "unit separator"
            -- (0x1F) between items. Real track metadata practically never
            -- contains control characters, so this is a safe delimiter that
            -- doesn't require per-item escaping here in AppleScript (escaping
            -- for the eventual JSON output is done on the JS side instead).
            set AppleScript's text item delimiters to (ASCII character 31)
            set albumBlob to albumValues as string
            set artistBlob to artistValues as string
            set AppleScript's text item delimiters to ""

            -- ASCII "record separator" (0x1E) divides the two blobs so the
            -- caller can split the combined result back into the album list
            -- and the parallel artist list. Pairing, de-duplication, and JSON
            -- construction happen on the JS side, where an O(n) Map/Set is
            -- trivial (vs. the O(n^2) linear-membership-check-and-string-concat
            -- work this script used to do for every track).
            return albumBlob & (ASCII character 30) & artistBlob
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run
