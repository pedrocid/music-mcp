on run argv
    try
        tell application "Music"
            if not running then
                return "Error: Music app is not running"
            end if
            
            if current track exists then
                set currentTrack to current track
                set trackInfo to "{"
                set trackInfo to trackInfo & "\"title\": \"" & (name of currentTrack) & "\","
                set trackInfo to trackInfo & "\"artist\": \"" & (artist of currentTrack) & "\","
                set trackInfo to trackInfo & "\"album\": \"" & (album of currentTrack) & "\","
                set trackInfo to trackInfo & "\"duration\": " & (duration of currentTrack) & ","
                set trackInfo to trackInfo & "\"position\": " & player position & ","
                set trackInfo to trackInfo & "\"state\": \"" & (player state as string) & "\""
                set trackInfo to trackInfo & "}"
                return trackInfo
            else
                return "Error: No track currently playing"
            end if
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 