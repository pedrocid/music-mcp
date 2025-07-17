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
                return "Error: Up next queue not found. Add tracks to queue first."
            end if
            
            -- Check if queue has tracks
            set trackCount to count of tracks in tempQueue
            if trackCount is 0 then
                return "Error: Up next queue is empty. Add tracks to queue first."
            end if
            
            -- Play the queue
            play tempQueue
            
            return "Now playing up next queue with " & trackCount & " track(s)"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 