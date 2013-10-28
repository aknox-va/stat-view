var METHOD = "getLogData";

// grab the wanted html from the page and send the parsed data to the background script
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.method == METHOD){
            // Get the expanded log entries
            var entries = document.getElementsByClassName("ae-log");

            // Run through each log entry and group them
            var numEntries = entries.length;
            var parsedData = "";
            for (var i = 0; i < numEntries; i++) {
                parsedData += entries[i].innerHTML;
            }

            // Return the html string
            sendResponse({data: "<caption>Logs</caption>" + parsedData, method: METHOD});
        }
    }
);