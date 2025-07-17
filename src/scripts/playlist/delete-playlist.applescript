on run argv
    try
        if length of argv = 0 then
            return "Error: Playlist name required"
        end if
        
        set playlistName to item 1 of argv
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            -- Find the playlist to delete
            set targetPlaylist to null
            repeat with currentPlaylist in user playlists
                if name of currentPlaylist is playlistName then
                    set targetPlaylist to currentPlaylist
                    exit repeat
                end if
            end repeat
            
            if targetPlaylist is null then
                return "Error: Playlist '" & playlistName & "' not found"
            end if
            
            -- Delete the playlist
            delete targetPlaylist
            
            return "Deleted playlist '" & playlistName & "'"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 