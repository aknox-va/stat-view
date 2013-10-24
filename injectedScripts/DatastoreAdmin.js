var METHOD = "getDatastoreAdmin";


// grab the wanted html from the page and send the parsed data to the background script
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.method == METHOD){
            // Get the operations table
            var table = document.getElementById("operations");
            var rows = table.getElementsByTagName("tr");

            // Run through each row in the operations table and grab data for rows with errors
            // --i skips row 0
            for (var i = rows.length; --i > 0;) {
                var row = rows[i];
                var column = row.getElementsByTagName("td");
                var status = column[2].innerHTML;
                if (status.indexOf("Completed") != -1) {
                    row.parentNode.removeChild(row);
                }
            }

            // Return the html string
            sendResponse({data: "<caption>Datastore Admin - Completed Operation Errors</caption>" + table.innerHTML, method: METHOD});
        }
    }
);