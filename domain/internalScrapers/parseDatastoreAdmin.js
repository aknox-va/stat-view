//
function parseDatastoreAdmin() {
    this.url = function(appId) { return "https://ah-builtin-python-bundle-dot-" + appId + ".appspot.com/_ah/datastore_admin/?app_id=s~" + this.appId + "&adminconsolecustompage"; }
    this.captionText = "Datastore Admin - Completed Operation Errors";

    this.process = function(doc, settings, callback) {
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

        callback("<caption><a href='" + doc.URL + "' target='_BLANK'>" + this.captionText + "</a></caption>" + table.innerHTML);
    }
}