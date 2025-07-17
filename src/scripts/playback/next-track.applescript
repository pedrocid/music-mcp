on run argv
    try
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            next track
            return "Skipped to next track"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 