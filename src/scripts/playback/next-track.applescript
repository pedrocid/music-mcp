on run argv
    try
        tell application "Music"
            if not running then
                return "Error: Music app is not running"
            end if
            
            next track
            return "Skipped to next track"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 