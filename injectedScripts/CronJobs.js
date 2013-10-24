var METHOD = "getCronJobs";

// grab the wanted html from the page and send the parsed data to the background script
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.method == METHOD){
            // Get the cron jobs table
            // todo:may have to eventually account for multiple pages
            var table = document.getElementById("ae-cronjobs-table");
            var rows = table.getElementsByTagName("tr");

            // Run through each row in the operations table and grab data for rows with errors
            // --i skips row 0 (the headings)
            for (var i = rows.length; --i > 0;) {
                var row = rows[i];
                var columns = row.getElementsByTagName("td");
                var spans = columns[1].getElementsByTagName("span");
                var timing = spans[1].innerHTML;
                var status = spans[2].innerHTML;
                if (timing.indexOf("on time") != -1 && status.indexOf("Success") != -1) {
                    row.parentNode.removeChild(row);
                }
            }

            // Return the html string
            sendResponse({data: "<caption>Cron Jobs - Non-Ideal Runs</caption>" + table.innerHTML, method: METHOD});
        }
    }
);