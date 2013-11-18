var appId = "";

// Setup the page and spool up the data gathering
window.onload = function() {
    // Set the appId
    var urlParam = document.location.href.split("?")[1].split("=");
    if (urlParam[0] === "appId") {
        appId = urlParam[1];

        // Setup the page heading and title
        var header = document.getElementsByTagName("header")[0];
        header.innerHTML = header.innerHTML + " : " + appId;
        document.getElementsByTagName("head")[0].getElementsByTagName("title")[0].innerHTML = appId;

        // Load the locations that data may be grabbed from and grab from them
        loadAllowedScraperList(loadScrapers);

        function loadScrapers(scrapers) {
            for (var entry in scrapers) {
                // Pull in the scraping function and load data associated with it once the object is loaded
                loadScraper(scrapers[entry], runScraper);
            }

            function runScraper (scraper) {

                // Load the style now that we have the scraper
                loadStyle(scraper.style);

                // Add the empty display table to the display window
                var newTable = document.createElement("table");
                newTable.setAttribute('id', scraper.name());
                newTable.innerHTML = "<caption><a href='" + scraper.url(appId) + "' target='_BLANK'>" + scraper.captionText + "</a></caption><thead class='noData'><tr><th>No data available yet. Click heading for manual check</th></tr></thead>";
                document.getElementById("content").appendChild(newTable);

                // get DOM for the url and process it using the provided function
                var xhr = new XMLHttpRequest();
                xhr.open("GET", scraper.url(appId), true);
                xhr.onload = function(){scraper.display(this.response)};
                xhr.responseType = scraper.scrapeType;
                xhr.send();

            }

            // Loads the styling specific to the scraper table into the document head
            function loadStyle(scraperStyle) {
                var head = document.getElementsByTagName('head')[0];
                var style = document.createElement('style');
                style.innerHTML = scraperStyle;
                head.appendChild(style);
            }
        }
    }
};