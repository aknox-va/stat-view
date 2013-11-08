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
}
Scraper.prototype = {
    //
    name: function() { return this.constructor.name; },

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


// removes the given element from the page
function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
}


// put the given parsed data into the view table with the given id
function insertData(scraperName, data, callback) {
    var newContent = document.getElementById(scraperName);  // Find the table to put data in
    var placeholder = newContent.getElementsByTagName("caption")[0]
    removeElement(placeholder);   // Remove the table placeholder
    newContent.innerHTML = data;
    if (callback){callback();}
}


//
function loadScraper(scraperName, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.src = "../domain/" + scraperName + ".js";
    script.onload = function() {
        // Extend the custom from the base scraper
        var scraper = window[scraperName];
        extend(scraper, Scraper); // All scrapers require the functions defined in Scraper
        callback(new scraper());
    };
    head.appendChild(script);
}