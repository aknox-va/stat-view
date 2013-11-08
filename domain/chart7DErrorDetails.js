//
function chart7DErrorDetails() {
    this.scrapeType = "xml";
    this.url = function(appId) { return "https://appengine.google.com/dashboard/stats?type=4&window=7&app_id=s~" + appId; };
    this.captionText = "7 Day Error Details Chart";

    this.process = function (doc, callback) {
        callback("<caption>" + this.captionText + "</caption><img src='" + JSON.parse(doc).chart_url + "' />");
    }
}