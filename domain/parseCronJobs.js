//
function parseCronJobs(doc) {
    // Set Table Parameters
    var caption = "Cron Jobs - Non-Ideal Runs";

    // No doc to parse so just return the caption text
    if (!doc) { return caption; }

    // Get the cron jobs table
    // todo:may have to eventually account for multiple pages
    var table = doc.getElementById("ae-cronjobs-table");
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
    var result = table.innerHTML;

    // Insert the parsed data into the viewing tab
    insertData(arguments.callee.name, "<caption><a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a></caption>" + result);
}