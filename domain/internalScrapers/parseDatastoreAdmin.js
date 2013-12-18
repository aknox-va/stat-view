//
function parseDatastoreAdmin() {
    this.url = function(appId) { return "https://ah-builtin-python-bundle-dot-" + appId + ".appspot.com/_ah/datastore_admin"; };
    this.captionText = "Datastore Admin - Completed Operation Errors";
    this.style = "#parseDatastoreAdmin #da-success-message {font-weight: bold; text-align: center; margin: 0.25em;}";



    this.process = function(doc, settings, callback) {
        // Get the operations table
        var table = doc.getElementsByTagName("table");
        table = table[table.length - 1];
        var rows = table.getElementsByTagName("tr");

        // Run through each row in the operations table and only keep data for rows with errors
        // --i skips row 0
        var message = "Status of all backups is 'Completed'";
        for (var i = rows.length; --i > 0;) {
            var row = rows[i];
            var column = row.getElementsByTagName("td");
            var status = column[2].innerHTML;
            if (status.indexOf("Completed") == -1) {
                message = "";
            } else {
                row.parentNode.removeChild(row);
            }
        }

        if (message.length > 0) {
            table.innerHTML = table.innerHTML + "<tr><td id='da-success-message' colspan='4'>" + message + "</td></tr>";
        }

        callback("<caption><a href='" + doc.URL + "' target='_blank'>" + this.captionText + "</a></caption>" + table.innerHTML);
    }
}