//
function parseXkcd(doc) {
    // Set Table Parameters
    var caption = "Today's XKCD Comic";

    // No doc to parse so just return the caption text
    if (!doc) { return caption; }

    // Get the xkcd image
    var result = doc.getElementById("comic").innerHTML;

    // Insert the parsed data into the viewing tab
    insertData(arguments.callee.name, "<caption><a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a></caption>" + result);
}
