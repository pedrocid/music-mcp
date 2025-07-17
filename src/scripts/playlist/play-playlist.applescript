on run argv
    try
        if length of argv = 0 then
            return "Error: Playlist name required"
        end if
        
        set playlistName to item 1 of argv
        set shouldShuffle to false
        
        -- Check if shuffle parameter is provided
        if length of argv > 1 then
            if item 2 of argv is "true" then
                set shouldShuffle to true
            end if
        end if
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            -- Find the playlist
            set targetPlaylist to null
            repeat with currentPlaylist in playlists
                if name of currentPlaylist is playlistName then
                    set targetPlaylist to currentPlaylist
                    exit repeat
                end if
            end repeat
            
            if targetPlaylist is null then
                return "Error: Playlist '" & playlistName & "' not found"
            end if
            
            -- Check if playlist has tracks
            set trackCount to count of tracks in targetPlaylist
            if trackCount is 0 then
                return "Error: Playlist '" & playlistName & "' is empty"
            end if
            
            -- Set shuffle mode if requested
            if shouldShuffle then
                set shuffle of targetPlaylist to true
            end if
            
            -- Play the playlist
            play targetPlaylist
            
            set shuffleText to ""
            if shouldShuffle then
                set shuffleText to " (shuffled)"
            end if
            
            return "Now playing playlist '" & playlistName & "'" & shuffleText & " with " & trackCount & " track(s)"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 