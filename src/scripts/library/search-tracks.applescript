on run argv
    try
        if length of argv is 0 then
            return "Error: Search query required"
        end if
        
        set searchQuery to item 1 of argv
        
        tell application "Music"
            if not running then
                launch
                delay 2 -- give it time to start
            end if
            
            set searchResults to (search playlist 1 for searchQuery)
            set resultList to "["
            set resultCount to 0
            
            repeat with searchResult in searchResults
                if resultCount < 50 then -- Limit to 50 results
                    if resultCount > 0 then
                        set resultList to resultList & ","
                    end if
                    set resultList to resultList & "{"
                    set resultList to resultList & "\"title\": \"" & (name of searchResult) & "\","
                    set resultList to resultList & "\"artist\": \"" & (artist of searchResult) & "\","
                    set resultList to resultList & "\"album\": \"" & (album of searchResult) & "\""
                    set resultList to resultList & "}"
                    set resultCount to resultCount + 1
                end if
            end repeat
            
            set resultList to resultList & "]"
            return resultList
        end tell
    on error errMsg number errNum
        return "Error " & errNum & ": " & errMsg
    end try
end run 