on run argv
    try
        if length of argv is 0 then
            return "Error: Track search term required"
        end if
        
        set searchTerm to item 1 of argv
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            -- Search for the track in the main library
            set searchResults to (search playlist 1 for searchTerm)
            
            if length of searchResults is 0 then
                return "Error: No tracks found for '" & searchTerm & "'"
            end if
            
            -- Play the first matching track
            set firstTrack to item 1 of searchResults
            play firstTrack
            
            -- Return confirmation with track info
            return "Now playing: '" & (name of firstTrack) & "' by " & (artist of firstTrack)
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 