//
function parseXkcd() {
    this.captionText = "Today's XKCD Comic";

    this.style = "";

    this.run = function (doc) {
        // No doc to parse so just return the caption text
        if (!doc) { return caption; }

        // Get the xkcd image
        var result = doc.getElementById("comic").innerHTML;

        // Insert the parsed data into the viewing tab
        insertData("parseXkcd", "<caption><a href='" + doc.URL + "' target='_BLANK'>" + this.captionText + "</a></caption>" + result);
    }

    return this;
}
