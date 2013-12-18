//
function parseXkcd() {
    this.url = function() { return "http://www.xkcd.com"; };
    this.captionText = "Today's XKCD Comic";

    this.process = function (doc, settings, callback) {
        // Get the xkcd image
        var result = doc.getElementById("comic").innerHTML;
        var viewTableContents = "<caption><a href='" + doc.URL + "' target='_blank'>" + this.captionText + "</a></caption>" + result;
        callback(viewTableContents);
    }
}