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


//
function extend(ChildClass, ParentClass) {
    ChildClass.prototype = new ParentClass();
    ChildClass.prototype.constructor = ChildClass;
}


// This is the base scraper functionality that is required. All scrapers inherit from this
var Scraper = function() {
    // The type of file that data is going to be scraped from. Override this if not scraping an html page
    this.scrapeType = "document";
    // Text that describes this scraper. Override This
    this.captionText = "No Caption Text Set For This Scraper";

    // CSS specifically for styling the data returned by this scraper. Override This
    this.style = "";

    // The default values for any settings needed solely by this scraper. Override This
    this.settingsDefaults = {};
}
Scraper.prototype = {
    // The url to scrape data from. Override This
    url: function(appId) { return "No Url Set For Scraper " + this.constructor.name; },

    //
    getSettings: function() {
        /*
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
        */
        return this.settingsDefaults;
    },

    // The function that does all the scraping and formatting of the raw data. Override This
    process: function(doc, callback) { return "No Run Logic Set For Scraper " + this.constructor.name; },

    // A callback that will run once the data returned by the process function has been displayed on screen. Override This
    onLoad: function() { return null; },

    // Displays the scrapers formatted data to the user
    display: function(doc) {
        var self = this;
        var name = this.constructor.name;
        this.process(doc, function(tableContents) {
            var newContent = document.getElementById(name);                 // Find the table to put data in
            var placeholder = newContent.getElementsByTagName("caption")[0] // Find the placeholder entry
            removeElement(placeholder);                                     // Remove the placeholder entry
            newContent.innerHTML = tableContents;                           // Display the new data
            self.onLoad();
        });
    }
}

