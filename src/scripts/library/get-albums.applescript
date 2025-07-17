on run argv
    try
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            set albumList to "["
            set albumCount to 0
            set processedAlbums to {}
            
            repeat with currentTrack in tracks of library playlist 1
                try
                    set albumName to album of currentTrack
                    set artistName to artist of currentTrack
                    set albumKey to albumName & " - " & artistName
                    
                    if albumKey is not in processedAlbums and albumCount < 100 then
                        set processedAlbums to processedAlbums & {albumKey}
                        
                        if albumCount > 0 then
                            set albumList to albumList & ","
                        end if
                        set albumList to albumList & "{"
                        set albumList to albumList & "\"album\": \"" & albumName & "\","
                        set albumList to albumList & "\"artist\": \"" & artistName & "\""
                        set albumList to albumList & "}"
                        set albumCount to albumCount + 1
                    end if
                on error
                    -- Skip tracks with missing album/artist info
                end try
            end repeat
            
            set albumList to albumList & "]"
            return albumList
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 