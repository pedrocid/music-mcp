on run argv
    try
        if length of argv is 0 then
            return "Error: Playlist name required"
        end if
        
        set playlistName to item 1 of argv
        
        tell application "Music"
            if not running then
                return "Error: Music app is not running"
            end if
            
            set newPlaylist to make new playlist with properties {name:playlistName}
            return "Created playlist: " & playlistName
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 