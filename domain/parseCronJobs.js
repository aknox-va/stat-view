//
function parseCronJobs() {
    this.captionText = "Cron Jobs (First page only)";

    this.style = "#parseCronJobs #cron-name {width: 65%;}" +
                 "#parseCronJobs #cron-state {width: 35%;}";

    this.run = function(doc) {
        // Get the cron jobs table
        // todo:may have to eventually account for multiple pages
        var table = doc.getElementById("ae-cronjobs-table");
        var rows = table.getElementsByTagName("tr");

        // Add IDs to the th elements
        var thArray = rows[0].getElementsByTagName("th");
        thArray[0].id = "cron-name";
        thArray[1].id = "cron-state";

        // Run through each row in the operations table and grab data for rows with errors
        // --i skips row 0 (the headings)
        for (var i = rows.length; --i > 0;) {
            var row = rows[i];
            var columns = row.getElementsByTagName("td");
            var spans = columns[1].getElementsByTagName("span");
            var timing = spans[1].innerHTML;
            var status = spans[2].innerHTML;
            if (timing.indexOf("on time") == -1) {
                row.setAttribute("style", "background-color: #ae433a;")
            }
            if (status.indexOf("Success") == -1) {
                row.setAttribute("style", "background-color: #ac6f65;")
            }
        }
        var result = table.innerHTML;

        // Insert the parsed data into the viewing tab
        insertData("parseCronJobs", "<caption><a href='" + doc.URL + "' target='_BLANK'>" + self.captionText + "</a></caption>" + result);
    }

    return this;
}