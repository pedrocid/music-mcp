on run argv
    try
        if length of argv < 2 then
            return "Error: Playlist name and track search term required"
        end if
        
        set playlistName to item 1 of argv
        set searchTerm to item 2 of argv
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            -- Find the playlist
            set targetPlaylist to null
            repeat with currentPlaylist in user playlists
                if name of currentPlaylist is playlistName then
                    set targetPlaylist to currentPlaylist
                    exit repeat
                end if
            end repeat
            
            if targetPlaylist is null then
                return "Error: Playlist '" & playlistName & "' not found"
            end if
            
            -- Find tracks to remove in the playlist
            set tracksToRemove to {}
            repeat with currentTrack in tracks of targetPlaylist
                set trackName to (name of currentTrack as string)
                set artistName to (artist of currentTrack as string)
                if trackName contains searchTerm or artistName contains searchTerm then
                    set end of tracksToRemove to currentTrack
                end if
            end repeat
            
            if length of tracksToRemove is 0 then
                return "Error: No tracks matching '" & searchTerm & "' found in playlist '" & playlistName & "'"
            end if
            
            -- Remove the tracks
            set removedCount to 0
            repeat with trackToRemove in tracksToRemove
                delete trackToRemove
                set removedCount to removedCount + 1
            end repeat
            
            return "Removed " & removedCount & " track(s) matching '" & searchTerm & "' from playlist '" & playlistName & "'"
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 