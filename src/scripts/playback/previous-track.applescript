on run argv
    try
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            previous track
            return "Skipped to previous track"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 