on run argv
    try
        if length of argv < 2 then
            return "Error: Playlist name and track search term required"
        end if
        
        set playlistName to item 1 of argv
        set searchTerm to item 2 of argv
        
        tell application "Music"
            if not running then
                return "Error: Music app is not running"
            end if
            
            -- Find the playlist
            set targetPlaylist to null
            repeat with currentPlaylist in playlists
                if name of currentPlaylist is playlistName then
                    set targetPlaylist to currentPlaylist
                    exit repeat
                end if
            end repeat
            
            if targetPlaylist is null then
                return "Error: Playlist '" & playlistName & "' not found"
            end if
            
            -- Search for tracks
            set searchResults to (search library for searchTerm)
            if length of searchResults is 0 then
                return "Error: No tracks found for '" & searchTerm & "'"
            end if
            
            -- Add first matching track
            set firstTrack to item 1 of searchResults
            duplicate firstTrack to targetPlaylist
            
            return "Added '" & (name of firstTrack) & "' to playlist '" & playlistName & "'"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 