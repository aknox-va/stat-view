var METHOD = "getDashboardErrors";


// grab the wanted html from the page and send the parsed data to the background script
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.method == METHOD){
            // Get the operations table
            var table = document.getElementById("ae-dash-errors");

            var caption = table.getElementsByTagName("caption")[0].getElementsByTagName("strong")[0];
            caption.innerHTML = "Dashboard " + caption.innerHTML + " List";

            // Remove the help icons
            var icons = table.getElementsByClassName("ae-help-icon");
            while (icons.length > 0) {
                icons[0].parentNode.removeChild(icons[0]);
            }

            // Run through each row in the error table(s?)
            // todo: google has three error tables right now, but they all have the same id. need to be able to differentiate between tables instead of grabbing the first
            var rows = table.getElementsByTagName("tr");
            // --i skips row 0
            for (var i = rows.length; --i > 0;) {
                var row = rows[i];
                var column = row.getElementsByTagName("td");

                // Google cuts off URIs if they are too long, but then searches logs for the exact URI which inevitably fails.
                // This modifies the urls to do a regex search instead of a path search so results will actually be found.
                var link = column[0].getElementsByTagName("a")[0];
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
                link.href = "https://appengine.google.com/logs?filter_type=regex&severity_level_override=1&view=search&app_id=" + appId + "&filter=" + link.innerHTML;
                link.target = "_BLANK";

                // Add a 'hide error for 1 week' button to each row
                column[0].innerHTML = '<button class="hide-dashboard-row" value="' + link.innerHTML + '">Hide</button> ' + link.outerHTML;

            }

            // Return the html string
            sendResponse({data: table.innerHTML, method: METHOD});
        }
    }
);