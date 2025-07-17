on run argv
    try
        if length of argv = 0 then
            return "Error: Track search term required"
        end if
        
        set searchTerm to item 1 of argv
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
                -- Create the queue if it doesn't exist
                set tempQueue to make new user playlist with properties {name:tempQueueName}
            end if
            
            -- Search for the track
            set searchResults to (search playlist 1 for searchTerm)
            if length of searchResults is 0 then
                return "Error: No tracks found for '" & searchTerm & "'"
            end if
            
            -- Add the first matching track to the queue
            set firstTrack to item 1 of searchResults
            duplicate firstTrack to tempQueue
            
            return "Added '" & (name of firstTrack) & "' by " & (artist of firstTrack) & " to up next queue"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 