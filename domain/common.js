// adds the ParentClass properties to the ChildClass object
function extend(ChildClass, ParentClass) {
    ChildClass.prototype = new ParentClass();
    ChildClass.prototype.constructor = ChildClass;
}


// This is the base scraper functionality that is required. All scrapers inherit from this
var Scraper = function() {
    // A name for the scraper
    this.captionText = "No Caption Text Set For This Scraper";

    // CSS code that will be injected into the view window for styling the html code produced by this scraper
    this.style = "";

    //
    this.settingsDefaults = {};
}
Scraper.prototype = {
    //
    name: function() { return this.constructor.name; },
    url: function(appId) { return "No Url Set For Scraper " + this.name(); },


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

        return this.settingsDefaults;
    },

    //
    getSettingsTable: function() {
        return null;
    },

    //
    process: function(doc, callback) { return "No Run Logic Set For Scraper " + this.name(); },

    //
    postProcess: function() { return null; },

    //
    display: function(doc) {
        var name = this.constructor.name;
        this.process(doc, function(tableContents) { insertData(name, tableContents, this.postProcess); });
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