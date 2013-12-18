var _gaq = _gaq || [];
_gaq.push(['_setAccount', ANALYTICS_CODE]);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

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
            var numScrapersToLoad = 0;
            for (var entry in scrapers) {
                if (scrapers.hasOwnProperty(entry)) {
                    // Pull in the scraping function and load data associated with it once the object is loaded
                    numScrapersToLoad++;
                    loadScraper(scrapers[entry], runScraper);
                }
            }

            function runScraper (scraper) {
                // Load the style now that we have the scraper
                loadStyle(scraper.style);

                // Add the empty display table to the display window
                var newTable = document.createElement("table");
                newTable.setAttribute('id', scraper.name());
                newTable.innerHTML = "<caption><a href='" + scraper.url(appId) + "' target='_blank'>" + scraper.captionText + "</a></caption><thead class='noData'><tr><th>No data available yet. Click heading for manual check</th></tr></thead>";
                document.getElementById("tab-links").innerHTML += '<li><a href="#tabs-' + scraper.name() + '" style="color: #FFFFFF;">' + scraper.name() + '</a></li>';
                document.getElementById("tabs").innerHTML += '<div id="tabs-' + scraper.name() + '">' + newTable.outerHTML + '</div>';

                // get DOM for the url and process it using the provided function
                console.log("get:" + scraper.url(appId));
                var xhr = new XMLHttpRequest();
                xhr.open("GET", scraper.url(appId), true);
                xhr.onload = function(){scraper.display(this.response)};
                xhr.responseType = scraper.scrapeType;
                xhr.send();

                // Try to style tabs
                numScrapersToLoad--;
                if (numScrapersToLoad === 0) {
                    $("#tabs").tabs().addClass( "ui-tabs-vertical ui-helper-clearfix" );
                    $("#tabs li").removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );
                }
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