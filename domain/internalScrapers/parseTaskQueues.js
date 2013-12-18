//
function parseTaskQueues() {
    this.url = function(appId) { return "https://appengine.google.com/queues?app_id=s~" + appId; };
    this.captionText = "Stuck Task Queues";
    this.settingsDefaults = {
            if_true_hide_successful_task_queues:0,
            highlight_if_queued_tasks_greater_than:0,
            highlight_if_run_last_min_less_than:1
        };

    this.process = function (doc, settings, callback) {
        // Get the operations table
        var table = doc.getElementById("ae-tasks-queue-table");
        table.getElementsByTagName("caption")[0].innerHTML = "<a href='" + doc.URL + "' target='_blank'>" + this.captionText + "</a>";
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
            // Remove the maximum rate, enforced rate, bucket size, and maximum concurrent columns
            removeElement(column[1]);
            removeElement(column[1]);
            removeElement(column[1]);
            removeElement(column[1]);

            // Only enabled queues can be successful
            if (row.className.indexOf("paused") === -1) {
                var queuedTasks = parseInt(column[2].innerHTML);
                var runLastMin = parseInt(column[3].innerHTML);
                //todo: may have queues that are rarely empty so drill into each queue to check for tasks that keep retrying
                // If there are tasks in the queue, and nothing ran in last min then keep the row
                if (queuedTasks > settings.highlight_if_queued_tasks_greater_than && runLastMin < settings.highlight_if_run_last_min_less_than) {
                    row.setAttribute("style", "background-color: #ae433a;");
                } else {
                    if (settings.if_true_hide_successful_task_queues > 0) {
                        removeElement(row);
                    }
                }
            } else {
                row.setAttribute("style", "background-color: #ac6f65;");
            }
            // Fix the task url
            var link = column[0].getElementsByTagName("a")[0];
            link.href = link.href;  // Want an absolute address
            link.target = "_blank";
        }

        callback(table.innerHTML);
    }
}
