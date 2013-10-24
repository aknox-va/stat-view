var METHOD = "getTaskQueues";


// grab the wanted html from the page and send the parsed data to the background script
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.method == METHOD){
            // Get the operations table
            var table = document.getElementById("ae-tasks-queue-table");
            table.getElementsByTagName("caption")[0].innerHTML = "Stuck Task Queues";
            var rows = table.getElementsByTagName("tr");
            var thColumns = rows[0].getElementsByTagName("th");
            removeElement(thColumns[1]);
            removeElement(thColumns[1]);
            removeElement(thColumns[1]);
            removeElement(thColumns[1]);

            // Run through each row in the task queue table and grab data for rows with stuck queues
            // --i skips row 0
            for (var i = rows.length; --i > 0;) {
                var row = rows[i];
                var column = row.getElementsByTagName("td");
                removeElement(column[1]);
                removeElement(column[1]);
                removeElement(column[1]);
                removeElement(column[1]);
                // Only enabled queues can be successful
                if (row.className.indexOf("paused") == -1) {
                    var queuedTasks = Number(column[1].innerHTML);
                    var runLastMin = Number(column[2].innerHTML);
                    //todo: may have queues that are rarely empty so drill into each queue to check for tasks that keep retrying
                    // If there are tasks in the queue, and nothing ran in last min then keep the row
                    if (!(queuedTasks > 0 && runLastMin == 0)) {
                        removeElement(row);
                    }
                }
                // Fix the task url
                var link = column[0].getElementsByTagName("a")[0];
                link.href = link.href;  // Want an absolute address
                link.target = "_BLANK";
            }

            // Return the html string
            sendResponse({data: table.innerHTML, method: METHOD});
        }
    }
);


// removes the given element from the page
function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
}