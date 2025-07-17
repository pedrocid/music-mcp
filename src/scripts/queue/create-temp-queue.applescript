on run argv
    try
        set tempQueueName to "MCP Up Next Queue"
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            -- Check if temp queue playlist exists, if not create it
            set tempQueue to null
            repeat with currentPlaylist in user playlists
                if name of currentPlaylist is tempQueueName then
                    set tempQueue to currentPlaylist
                    exit repeat
                end if
            end repeat
            
            if tempQueue is null then
                -- Create the temporary queue playlist
                set tempQueue to make new user playlist with properties {name:tempQueueName}
                return "Created temporary queue playlist: " & tempQueueName
            else
                return "Temporary queue playlist already exists: " & tempQueueName
            end if
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 