on run argv
    try
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            set queueInfo to "{"
            
            -- Get current track if playing
            if current track exists then
                set currentTrack to current track
                set queueInfo to queueInfo & "\"currentTrack\": {"
                set queueInfo to queueInfo & "\"title\": \"" & (name of currentTrack) & "\","
                set queueInfo to queueInfo & "\"artist\": \"" & (artist of currentTrack) & "\","
                set queueInfo to queueInfo & "\"album\": \"" & (album of currentTrack) & "\","
                set queueInfo to queueInfo & "\"position\": " & player position & ","
                set queueInfo to queueInfo & "\"duration\": " & (duration of currentTrack)
                set queueInfo to queueInfo & "},"
                
                -- Try to get the current playlist context
                try
                    set currentPlaylistName to "Unknown"
                    set currentSource to current playlist
                    if currentSource exists then
                        set currentPlaylistName to name of currentSource
                    end if
                    set queueInfo to queueInfo & "\"currentPlaylist\": \"" & currentPlaylistName & "\","
                on error
                    set queueInfo to queueInfo & "\"currentPlaylist\": \"Library\","
                end try
                
                -- Get shuffle and repeat status
                set queueInfo to queueInfo & "\"shuffleEnabled\": " & (shuffle enabled as string) & ","
                set queueInfo to queueInfo & "\"repeatMode\": \"" & (song repeat of current playlist as string) & "\","
                set queueInfo to queueInfo & "\"playerState\": \"" & (player state as string) & "\""
            else
                set queueInfo to queueInfo & "\"currentTrack\": null,"
                set queueInfo to queueInfo & "\"currentPlaylist\": null,"
                set queueInfo to queueInfo & "\"shuffleEnabled\": false,"
                set queueInfo to queueInfo & "\"repeatMode\": \"off\","
                set queueInfo to queueInfo & "\"playerState\": \"stopped\""
            end if
            
            set queueInfo to queueInfo & "}"
            return queueInfo
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 