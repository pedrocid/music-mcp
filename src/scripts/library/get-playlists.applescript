on run argv
    try
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            set playlistList to "["
            set playlistCount to 0
            
            repeat with currentPlaylist in playlists
                if playlistCount > 0 then
                    set playlistList to playlistList & ","
                end if
                set playlistList to playlistList & "{"
                set playlistList to playlistList & "\"name\": \"" & (name of currentPlaylist) & "\","
                set playlistList to playlistList & "\"id\": \"" & (id of currentPlaylist) & "\","
                
                try
                    set trackCount to count of tracks of currentPlaylist
                    set playlistList to playlistList & "\"trackCount\": " & trackCount
                on error
                    set playlistList to playlistList & "\"trackCount\": 0"
                end try
                
                set playlistList to playlistList & "}"
                set playlistCount to playlistCount + 1
            end repeat
            
            set playlistList to playlistList & "]"
            return playlistList
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 