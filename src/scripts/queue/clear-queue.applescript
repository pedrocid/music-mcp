on run argv
    try
        set tempQueueName to "MCP Up Next Queue"
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            -- Find the temporary queue playlist
            set tempQueue to null
            repeat with currentPlaylist in user playlists
                if name of currentPlaylist is tempQueueName then
                    set tempQueue to currentPlaylist
                    exit repeat
                end if
            end repeat
            
            if tempQueue is null then
                return "Up next queue not found - nothing to clear"
            end if
            
            -- Clear all tracks from the queue
            set trackCount to count of tracks in tempQueue
            delete (every track of tempQueue)
            
            return "Cleared " & trackCount & " track(s) from up next queue"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 