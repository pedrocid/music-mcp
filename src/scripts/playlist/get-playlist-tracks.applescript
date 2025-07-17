on run argv
    try
        if length of argv is 0 then
            return "Error: Playlist name required"
        end if
        
        set playlistName to item 1 of argv
        
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
            
            set trackList to "["
            set trackCount to 0
            
            repeat with currentTrack in tracks of targetPlaylist
                if trackCount > 0 then
                    set trackList to trackList & ","
                end if
                set trackList to trackList & "{"
                set trackList to trackList & "\"title\": \"" & (name of currentTrack) & "\","
                set trackList to trackList & "\"artist\": \"" & (artist of currentTrack) & "\","
                set trackList to trackList & "\"album\": \"" & (album of currentTrack) & "\","
                set trackList to trackList & "\"duration\": " & (duration of currentTrack)
                set trackList to trackList & "}"
                set trackCount to trackCount + 1
            end repeat
            
            set trackList to trackList & "]"
            return trackList
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 