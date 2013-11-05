// Create the list of all possible sources to grab data from
function loadParserList(appId) {
    var htmlParsers = {};
    // The url must be defined in the manifest to have permission to access it
    // htmlParsers["<url to scrape data from>"] = "<name of the function/file built to parse the data>"
    htmlParsers["http://www.xkcd.com"] = "parseXkcd";
    htmlParsers["https://ah-builtin-python-bundle-dot-" + appId + ".appspot.com/_ah/datastore_admin/?app_id=s~" + this.appId + "&adminconsolecustompage"] = "parseDatastoreAdmin";
    htmlParsers["https://appengine.google.com/cron?app_id=s~" + appId] = "parseCronJobs";
    htmlParsers["https://appengine.google.com/queues?app_id=s~" + appId] = "parseTaskQueues";
    htmlParsers["https://appengine.google.com/dashboard?app_id=s~" + appId] = "parseDashboardErrors";
    htmlParsers["https://appengine.google.com/logs?app_id=s~" + appId + "&severity_level_override=0&severity_level=3&limit=200&layout=none"] = "parseLogData";

    return htmlParsers;
}


// Returns an associative array of all the urls (keys) the user wants to scrape and their parsing function names (values)
function loadAllowedParserList(appId, callback) {
    var htmlParsers = loadParserList(appId);

    // Remove any sources the settings say the user doesn't want
    chrome.storage.local.get('scraperToggles', function(result) {
        var scraperToggles = {};
        if (result && result.scraperToggles) { scraperToggles = result.scraperToggles; }
        // Remove unwanted urls
        for (var parserUrl in htmlParsers) {
            var parserName = htmlParsers[parserUrl];
            if (scraperToggles[parserName] == "OFF") { delete htmlParsers[parserUrl]; }
        }

        callback(htmlParsers);
    });
}

// Scraper Template
// doc will contain the HTML DOM returned by the fetch
/*
function <scraper function name in the above array>(doc) {
    self.captionText = "<the text to display in the caption tag above the table the formatted data is in>";

    self.style = "<css code to format this table. prefix #<scraper function name> to each entry to ensure it only affect the table for this scraper>"

    // DATA PROCESSING CODE GOES HERE

    var result = <the formatted data that will be placed in the display table>

    // Insert the parsed data into the viewing tab
    insertData(id, "<caption><a href='" + doc.URL + "' target='_BLANK'>" + self.captionText + "</a></caption>" + result, <a callback function if more processing needs to be done after the data is loaded>);
}
*/