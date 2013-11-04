var appId = "";

// Setup the page and spool up the data gathering
window.onload = function() {
    // Set the appId
    var urlParam = document.location.href.split("?")[1].split("=");
    if (urlParam[0] == "appId") {
        appId = urlParam[1];

        // Setup the page heading
        var header = document.getElementsByTagName("header")[0];
        header.innerHTML = header.innerHTML + " : " + appId;

        // Load the locations that data may be grabbed from
        loadAllowedParserList(appId, loadParsers);

        function loadParsers(htmlParsers) {
            for (var parserUrl in htmlParsers) {
                // Pull in the parsing function and load data associated with it once it is loaded
                loadScript(htmlParsers[parserUrl], parserUrl, runParser);
            }

            function loadScript(parserName, parserUrl, callback) {
                // Adding the script tag to the head as suggested before
                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');

                script.src = "../domain/" + parserName + ".js";
                script.onload = function() {callback(parserName, parserUrl)};

                head.appendChild(script);
            }

            function runParser (parserName, parserUrl) {
                // Add the empty display table to the display window
                var parserCaption = window[parserName]();

                var newTable = document.createElement("table");
                newTable.setAttribute('id', parserName);
                newTable.innerHTML = "<caption><a href='" + parserUrl + "' target='_BLANK'>" + parserCaption + "</a></caption><thead class='noData'><tr><th>No data available yet. Click heading for manual check</th></tr></thead>";
                document.body.appendChild(newTable);

                // get DOM for the url and process it using the provided function
                var xhr = new XMLHttpRequest();
                xhr.open("GET", parserUrl, true);
                xhr.onload = function(){window[parserName](this.response)};
                xhr.responseType = "document";
                xhr.send();

            }
        }


        // dashboard/stats return json so it needs to be handled differently
        getImageFromJson("7 Day Error Details Chart", "https://appengine.google.com/dashboard/stats?type=4&window=7&app_id=s~" + appId);
        getImageFromJson("7 Day Memory Usage Chart (MB)", "https://appengine.google.com/dashboard/stats?type=9&window=7&app_id=s~" + appId);
    }
};


// removes the given element from the page
function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
}


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


// put the given parsed data into the data with the label id
function insertData(scraperName, data, callback) {
    var newContent = document.getElementById(scraperName);          // Find the table to put data in
    removeElement(newContent.getElementsByTagName("caption")[0]);   // Remove the table placeholder
    newContent.innerHTML = data;
    if (callback){callback();}
}