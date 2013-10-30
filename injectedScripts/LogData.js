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
            var uniqueUris = {};
            for (var i = 0; i < numEntries; i++) {
                var spans = entries[i].getElementsByTagName("span");
                var date = spans[0].innerHTML;
                var uri = spans[1].innerHTML;
                var errorNum = spans[2].innerHTML;

                if (uri in uniqueUris) {
                    uniqueUris[uri].count += 1;
                    if (new Date(date) > new Date(uniqueUris[uri].date)) {
                        uniqueUris[uri].date = date;
                    }
                } else {
                    uniqueUris[uri] = {errorNum:errorNum, date:date, count:1}
                }
            }
            // get the appId
            var link = window.location;
            var appId = "";
            var filter = "";
            var getVars = link.href.split("?")[1];
            getVars = getVars.split("&");
            for (var j = getVars.length; j-- > 0;) {
                var argument = getVars[j].split("=");
                if (argument[0] == "app_id") {
                    appId = argument[1];
                }
            }

            // Build the response
            for (var uri in uniqueUris) {
                parsedData += "<tr><td><a href='https://appengine.google.com/logs?filter_type=regex&severity_level_override=1&view=search&app_id=" + appId + "&filter=" + uri + "' target='_BLANK'>" + uri + "</a></td><td>" + uniqueUris[uri].errorNum + "</td><td>" + uniqueUris[uri].date + "</td><td>" + uniqueUris[uri].count + "</td></tr>"
            }

            var tableHead = "<thead></tr><th>URI</th><th>Code</th><th>NewestDate</th><th>#Occurrences</th><tr></thead>";

            // Return the html string
            sendResponse({data: "<caption>Logs</caption>" + tableHead + parsedData, method: METHOD});
        }
    }
);