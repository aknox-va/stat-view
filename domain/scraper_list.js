

// Create the list of all possible sources to grab data from
function loadScraperList(callback) {
    var internalScrapers = new Array();

    // Add the function/file name of any new scraper to the list below
    internalScrapers[internalScrapers.length] = "parseXkcd";
    internalScrapers[internalScrapers.length] = "parseDatastoreAdmin";
    internalScrapers[internalScrapers.length] = "parseCronJobs";
    internalScrapers[internalScrapers.length] = "parseTaskQueues";
    internalScrapers[internalScrapers.length] = "parseDashboardErrors";
    internalScrapers[internalScrapers.length] = "parseLogData";
    internalScrapers[internalScrapers.length] = "chart7DErrorDetails";
    internalScrapers[internalScrapers.length] = "chart7DMemoryUsage";

    // Format internal scrapers
    var scrapers = new Array();
    for (var row in internalScrapers) {
        scrapers[scrapers.length] = {name: internalScrapers[row], url:null}
    }

    // Add in the external scrapers
    chrome.storage.local.get('externalScrapers', function(result) {
        var externalScrapers = {};
        if (result && result.externalScrapers) { externalScrapers = result.externalScrapers; }

        for (var row in externalScrapers) {
        scrapers[scrapers.length] = externalScrapers[row]
        }

        callback(scrapers);
    });
}


// Returns an array of function names for all the scrapers the user wants to run
function loadAllowedScraperList(callback) {
    loadScraperList(function(scrapers) {
        // Remove any sources the settings say the user doesn't want
        chrome.storage.local.get('scraperToggles', function(result) {
            var scraperToggles = {};
            if (result && result.scraperToggles) { scraperToggles = result.scraperToggles; }
            // Remove unwanted urls
            for (var entry in scrapers) {
                var scraperName = scrapers[entry].name;
                if (scraperToggles[scraperName] == "OFF") { delete scrapers[entry]; }
            }

            callback(scrapers);
        });
    });
}

function removeExternalScraper(button) {
    var scraperUrl = button.value;
    chrome.storage.local.get('externalScrapers', function(result) {
        var externalScrapers = {};
        if (result && result.externalScrapers) { externalScrapers = result.externalScrapers; }
        // Remove unwanted external scraper from list
        for (var row in externalScrapers) {
            if (externalScrapers[row].url == scraperUrl) {
                delete externalScrapers[row];
                window.location.reload();   // Reload whole page since custom setting may need to be grabbed
            }
        }

        // Save the new list
        chrome.storage.local.set({externalScrapers: externalScrapers});
    });
}