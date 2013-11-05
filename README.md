stat-view
=========

A google app engine administration panel information filter and aggregator.

Adding a new scraper steps:

1. Make sure the url is in the manifest under 'permissions'
2. Add an entry to the scrapers array in domain/scraper.js with the value being the name of the scraper function/file
3. Create a javascript file in the domain folder and give it the name you specified in scraper.js. Now create a function in the file with the same name and follow the template listed below

function <name listed in scraper_list>() {
    this.url = function(appId) { return "<url from which to grab data>"; }
    this.captionText = "<text to display in the display table caption>";
    this.style = "<css formatting for the table. Preface each entry with #<scraper name> so the css will only be applied to this scraper's table>";

    // Settings you want persistently stored and adjustable in the settings window. Can be used within the scraper by calling this.getSettings()
    this.settingsDefaults = {
            <setting 1 name>:"<setting 1 value>",
            <setting 2 name>:"<setting 2 value>",
            <setting 3 name>:"<setting 3 value>",
            ...
        };

    this.process = function (doc, callback) {
        <parsing code here, doc is the dom containing the data from the above url>

        var result = <parsed and formatted data to place in the scraper's table>;

        // Return the html code to output to the table through a callback
        callback("<caption><a href='" + doc.URL + "' target='_BLANK'>" + this.captionText + "</a></caption>" + result);
    }

    this.postProcess() {
        <code you want to run after your html has been added to the view window>
    }

    return this;
}

