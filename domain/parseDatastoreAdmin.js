//
function parseDatastoreAdmin(doc) {
    this.captionText = "Datastore Admin - Completed Operation Errors";

    this.style = "";

    this.run = function(doc) {
        // Get the operations table
        var table = doc.getElementById("operations");
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
        var result = table.innerHTML;

        // Insert the parsed data into the viewing tab
        insertData("parseDatastoreAdmin", "<caption><a href='" + doc.URL + "' target='_BLANK'>" + self.captionText + "</a></caption>" + result);
    }

    return this;
}