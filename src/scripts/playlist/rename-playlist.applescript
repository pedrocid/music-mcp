on run argv
    try
        if length of argv < 2 then
            return "Error: Current playlist name and new name required"
        end if
        
        set currentName to item 1 of argv
        set newName to item 2 of argv
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            -- Find the playlist to rename
            set targetPlaylist to null
            repeat with currentPlaylist in user playlists
                if name of currentPlaylist is currentName then
                    set targetPlaylist to currentPlaylist
                    exit repeat
                end if
            end repeat
            
            if targetPlaylist is null then
                return "Error: Playlist '" & currentName & "' not found"
            end if
            
            -- Rename the playlist
            set name of targetPlaylist to newName
            
            return "Renamed playlist from '" & currentName & "' to '" & newName & "'"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 