var appId = "";

// Setup the page and spool up the data gathering
window.onload = function() {
    // Set the appId
    var urlParam = document.location.href.split("?")[1].split("=");
    if (urlParam[0] == "appId") {
        appId = urlParam[1];

        // Setup the page heading and title
        var header = document.getElementsByTagName("header")[0];
        header.innerHTML = header.innerHTML + " : " + appId;
        document.getElementsByTagName("head")[0].getElementsByTagName("title")[0].innerHTML = appId;

        // Load the locations that data may be grabbed from and grab from them
        loadAllowedScraperList(loadScrapers);

        function loadScrapers(htmlScrapers) {
            for (var entry in htmlScrapers) {
                // Pull in the scraping function and load data associated with it once the object is loaded
                loadScript(htmlScrapers[entry], runScraper);
            }

            function loadScript(scraperName, callback) {
                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                script.src = "../domain/" + scraperName + ".js";
                script.onload = function() {callback(scraperName)};
                head.appendChild(script);
            }

            function runScraper (scraperName) {
                var scraper = window[scraperName];
                extend(scraper, Scraper); // All scrapers require the functions defined in Scraper
                scraper = new scraper();

                // Load the style now that we have the scraper
                loadStyle(scraper.style);

                // Add the empty display table to the display window
                var newTable = document.createElement("table");
                newTable.setAttribute('id', scraperName);
                newTable.innerHTML = "<caption><a href='" + scraper.url(appId) + "' target='_BLANK'>" + scraper.captionText + "</a></caption><thead class='noData'><tr><th>No data available yet. Click heading for manual check</th></tr></thead>";
                document.body.appendChild(newTable);

                // get DOM for the url and process it using the provided function
                var xhr = new XMLHttpRequest();
                xhr.open("GET", scraper.url(appId), true);
                xhr.onload = function(){scraper.display(this.response)};
                xhr.responseType = "document";
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


        // dashboard/stats return json so it needs to be handled differently
        getImageFromJson("7 Day Error Details Chart", "https://appengine.google.com/dashboard/stats?type=4&window=7&app_id=s~" + appId);
        getImageFromJson("7 Day Memory Usage Chart (MB)", "https://appengine.google.com/dashboard/stats?type=9&window=7&app_id=s~" + appId);
    }
};

// produces an html image from a gae dashboard/stats json file containing a url
function getImageFromJson(name, url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var newContent = document.getElementById(name);
            newContent.innerHTML = "<caption>" + name + "</caption><img src='" + JSON.parse(xhr.responseText).chart_url + "' />";
        }
    }
    xhr.send();
}


//
function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
}
