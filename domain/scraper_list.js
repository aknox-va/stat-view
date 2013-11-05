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

    return scrapers;
}


// Returns an associative array of all the urls (keys) the user wants to scrape and their parsing function names (values)
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


//
function extend(ChildClass, ParentClass) {
    ChildClass.prototype = new ParentClass();
    ChildClass.prototype.constructor = ChildClass;
}


// This is the base scraper functionality that is required. All scrapers inherit from this
var Scraper = function() {
    //
    this.captionText = "No Caption Text Set For This Scraper";

    //
    this.style = "";

    //
    this.settingsDefaults = {};
}
Scraper.prototype = {
    //
    url: function(appId) { return "No Url Set For Scraper " + this.constructor.name; },

/*
    getSettings: function(callback) {
        var settings = this.settingsNames;
        // get the data from storage if possible. will be keyed to the scraper object name
        chrome.storage.local.get(this.constructor.name + 'Settings', function(result) {
            if (result && result[this.constructor.name + 'Settings']) {
                // Overwrite  default values with any user values
                for (var setting in result[this.constructor.name + 'Settings']) {
                    settings[setting] = result[this.constructor.name + 'Settings'][setting];
                }
            }

            callback(settings);
        });
    },
*/
    //
    process: function(doc, callback) { return "No Run Logic Set For Scraper " + this.constructor.name; },

    //
    postProcess: function() { return null; },

    //
    display: function(doc) {
        var name = this.constructor.name;
        this.process(doc, function(tableContents) { insertData(name, tableContents, this.postProcess); });
    }
}

