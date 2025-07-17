on run argv
    try
        if length of argv is 0 then
            return "Error: Volume level required (0-100)"
        end if
        
        set volumeLevel to item 1 of argv as integer
        
        if volumeLevel < 0 or volumeLevel > 100 then
            return "Error: Volume must be between 0 and 100"
        end if
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            set sound volume to volumeLevel
            return "Volume set to " & volumeLevel
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 