on run argv
    try
        tell application "Music"
            if not running then
                return "Error: Music app is not running"
            end if
            
            if player state is playing then
                pause
                return "Paused"
            else
                play
                return "Playing"
            end if
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 