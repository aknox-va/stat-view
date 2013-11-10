// Create the list of all possible sources to grab data from
function loadScraperList() {
    var scrapers = new Array();

    // Add the function/file name of any new scraper to the list below
    scrapers[scrapers.length] = "parseXkcd";
    scrapers[scrapers.length] = "parseDatastoreAdmin";
    scrapers[scrapers.length] = "parseCronJobs";
    scrapers[scrapers.length] = "parseTaskQueues";
    scrapers[scrapers.length] = "parseDashboardErrors";
    scrapers[scrapers.length] = "parseLogData";
    scrapers[scrapers.length] = "chart7DErrorDetails";
    scrapers[scrapers.length] = "chart7DMemoryUsage";

    return scrapers;
}


// Returns an array of function names for all the scrapers the user wants to run
function loadAllowedScraperList(callback) {
    var scrapers = loadScraperList();

    // Remove any sources the settings say the user doesn't want
    chrome.storage.local.get('scraperToggles', function(result) {
        var scraperToggles = {};
        if (result && result.scraperToggles) { scraperToggles = result.scraperToggles; }
        // Remove unwanted urls
        for (var entry in scrapers) {
            var scraperName = scrapers[entry];
            if (scraperToggles[scraperName] == "OFF") { delete scrapers[entry]; }
        }

        callback(scrapers);
    });
}