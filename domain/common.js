// adds the ParentClass properties to the ChildClass object
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
};
Scraper.prototype = {
    //
    name: function() { return this.constructor.name; },

    // The url to scrape data from. Override This
    url: function(appId) { return "No Url Set For Scraper " + this.name(); },

    //
    getSettings: function(callback) {
        var self = this;
        var settings = this.settingsDefaults;
        var settingName = self.name() + 'Settings';

        // get the data from storage if possible. will be keyed to the scraper object name
        getStoredData(settingName, "dictionary", function(data) {
            // Overwrite  default values with any user values
            for (var setting in data) {
                if (data.hasOwnProperty(setting)) {
                    settings[setting] = data[setting];
                }
            }
            callback(settings);
        });
    },

    // The function that does all the scraping and formatting of the raw data. Override This
    process: function(doc, callback, settings) { return "No Run Logic Set For Scraper " + this.name(); },

    // A callback that will run once the data returned by the process function has been displayed on screen. Override This
    onLoad: function() { return null; },

    // Displays the scrapers formatted data to the user
    display: function(doc) {
        var self = this;
        var name = this.constructor.name;

        // Get scraper's settings
        self.getSettings(function(settings){
            // Run the scraper with the found settings
            self.process(doc, settings, function(tableContents) {
                var newContent = document.getElementById(name);                 // Find the table to put data in
                var placeholder = newContent.getElementsByTagName("caption")[0];// Find the placeholder entry
                removeElement(placeholder);                                     // Remove the placeholder entry
                newContent.innerHTML = tableContents;                           // Display the new data
                self.onLoad();
            });
        });
    }
};


//
function loadScraper(scraperInfo, callback) {
    var url = "../domain/internalScrapers/" + scraperInfo.name + ".js";
    if (scraperInfo.url) { url = scraperInfo.url; }

    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.src = url;
    script.onload = function() {
        // Extend the custom from the base scraper
        var scraperFunction = window[scraperInfo.name];
        extend(scraperFunction, Scraper); // All scrapers require the functions defined in Scraper
        callback(new scraperFunction());
    };
    head.appendChild(script);
}


// removes the given element from the page
function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
}


//
function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}


//
function getStoredData(dataName, dataType, callback) {
    chrome.storage.local.get(dataName, function(result) {
        var data = null;
        if (dataType === "list") { data = []; }
        else if (dataType === "dictionary") { data = {}; }

        if (result && result[dataName]) { data = result[dataName]; }
        callback(data);
    });
}


//
function setData(data, callback) {
    chrome.storage.local.set(data, callback);
}