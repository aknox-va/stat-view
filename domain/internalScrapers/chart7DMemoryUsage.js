//
function chart7DMemoryUsage() {
    this.scrapeType = "xml";
    this.url = function(appId) { return "https://appengine.google.com/dashboard/stats?type=9&window=7&app_id=s~" + appId; };
    this.captionText = "7 Day Memory Usage Chart (MB)";

    this.process = function (doc, settings, callback) {
        callback("<caption>" + this.captionText + "</caption><img src='" + JSON.parse(doc)['chart_url'] + "' />");
    }
}