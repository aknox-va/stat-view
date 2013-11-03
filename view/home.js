var appId = "";
var htmlParsers = new Array();


// Setup the page and spool up the data gathering
window.onload = function() {
    // Set the appId
    var urlParam = document.location.href.split("?")[1].split("=");
    if (urlParam[0] == "appId") {
        appId = urlParam[1];

        // Setup the page heading
        var header = document.getElementsByTagName("header")[0];
        header.innerHTML = header.innerHTML + " : " + appId;
        
        // Create the list of all possible sources to grab data from
        htmlParsers = {};
        htmlParsers["http://www.xkcd.com"] = parseXkcd;
        htmlParsers["https://ah-builtin-python-bundle-dot-" + appId + ".appspot.com/_ah/datastore_admin/?app_id=s~" + this.appId + "&adminconsolecustompage"] = parseDatastoreAdmin;
        htmlParsers["https://appengine.google.com/cron?app_id=s~" + appId] = parseCronJobs;
        htmlParsers["https://appengine.google.com/queues?app_id=s~" + appId] = parseTaskQueues;
        htmlParsers["https://appengine.google.com/dashboard?app_id=s~" + appId] = parseDashboardErrors;
        htmlParsers["https://appengine.google.com/logs?app_id=s~" + appId + "&severity_level_override=0&severity_level=3&limit=200&layout=none"] = parseLogData;

        // Remove any sources the settings say the user doesn't want and parse the ones they do want
        chrome.storage.local.get('scraperToggles', function(result) {
            var scraperToggles = {};
            if (result && result.scraperToggles) {
                scraperToggles = result.scraperToggles;
            }
            // Remove unwanted urls
            for (var parserUrl in htmlParsers) {
                var parserId = htmlParsers[parserUrl]();
                var parserCaption = htmlParsers[parserUrl]('getCaption');
                // User has turned off this source so don't grab data for it
                if (scraperToggles[parserId] == "OFF") {
                    // Remove the url from the list of urls to parse
                    delete htmlParsers[parserUrl];
                    // Remove the display table from the display window
                    //removeElement(document.getElementById(parserId));
                }
                // User has not turned off this source so grab data for it
                else {
                    // Add the empty display table to the display window
                    var newTable = document.createElement("table");
                    newTable.setAttribute('id', parserId);
                    newTable.innerHTML = "<caption><a href='" + parserUrl + "' target='_BLANK'>" + parserCaption + "</a></caption><thead class='noData'><tr><th>No data available yet. Click heading for manual check</th></tr></thead>";
                    document.getElementsByTagName("body")[0].appendChild(newTable);

                    // get DOM from the url and process it
                    (function(url) {
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", url, true);
                        xhr.onload = function(){htmlParsers[url](this.response)};
                        xhr.responseType = "document";
                        xhr.send();
                    })(parserUrl);
                }
            }

            // Process each url
            for (var entry in htmlParsers) {

            }
        });

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
function insertData(id, data, callback) {
    var newContent = document.getElementById(id);                   // Find the table to put data in
    removeElement(newContent.getElementsByTagName("caption")[0]);   // Remove the table placeholder
    newContent.innerHTML = data;
    if (callback){callback();}
}


//
function parseXkcd(doc) {
    // Set Table Parameters
    var id = 'getXkcd';
    var caption = "Today's XKCD Comic";

    // No doc to parse so just return the parser id
    if (!doc) {
        return id;
    } else if (doc == "getCaption") {
        return caption;
    }

    // Get the xkcd image
    var result = doc.getElementById("comic").innerHTML;

    // Insert the parsed data into the viewing tab
    insertData(id, "<caption><a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a></caption>" + result);
}


//
function parseDatastoreAdmin(doc) {
    // Set Table Parameters
    var id = 'getDatastoreAdmin';
    var caption = "Datastore Admin - Completed Operation Errors";

    // No doc to parse so just return the parser id
    if (!doc) {
        return id;
    } else if (doc == "getCaption") {
        return caption;
    }

    // Get the operations table
    var table = doc.getElementById("operations");
    var rows = table.getElementsByTagName("tr");

    // Run through each row in the operations table and grab data for rows with errors
    // --i skips row 0
    for (var i = rows.length; --i > 0;) {
        var row = rows[i];
        var column = row.getElementsByTagName("td");
        var status = column[2].innerHTML;
        if (status.indexOf("Completed") != -1) {
            row.parentNode.removeChild(row);
        }
    }
    var result = table.innerHTML;

    // Insert the parsed data into the viewing tab
    insertData(id, "<caption><a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a></caption>" + result);
}


//
function parseCronJobs(doc) {
    // Set Table Parameters
    var id = 'getCronJobs';
    var caption = "Cron Jobs - Non-Ideal Runs";

    // No doc to parse so just return the parser id
    if (!doc) {
        return id;
    } else if (doc == "getCaption") {
        return caption;
    }

    // Get the cron jobs table
    // todo:may have to eventually account for multiple pages
    var table = doc.getElementById("ae-cronjobs-table");
    var rows = table.getElementsByTagName("tr");

    // Run through each row in the operations table and grab data for rows with errors
    // --i skips row 0 (the headings)
    for (var i = rows.length; --i > 0;) {
        var row = rows[i];
        var columns = row.getElementsByTagName("td");
        var spans = columns[1].getElementsByTagName("span");
        var timing = spans[1].innerHTML;
        var status = spans[2].innerHTML;
        if (timing.indexOf("on time") != -1 && status.indexOf("Success") != -1) {
            row.parentNode.removeChild(row);
        }
    }
    var result = table.innerHTML;

    // Insert the parsed data into the viewing tab
    insertData(id, "<caption><a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a></caption>" + result);
}


//
function parseTaskQueues(doc) {
    // Set Table Parameters
    var id = 'getTaskQueues';
    var caption = "Stuck Task Queues";

    // No doc to parse so just return the parser id
    if (!doc) {
        return id;
    } else if (doc == "getCaption") {
        return caption;
    }

    // Get the operations table
    var table = doc.getElementById("ae-tasks-queue-table");
    table.getElementsByTagName("caption")[0].innerHTML = "<a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a>";
    var rows = table.getElementsByTagName("tr");
    var thColumns = rows[0].getElementsByTagName("th");
    removeElement(thColumns[1]);
    removeElement(thColumns[1]);
    removeElement(thColumns[1]);
    removeElement(thColumns[1]);

    // Run through each row in the task queue table and grab data for rows with stuck queues
    // --i skips row 0
    for (var i = rows.length; --i > 0;) {
        var row = rows[i];
        var column = row.getElementsByTagName("td");
        removeElement(column[1]);
        removeElement(column[1]);
        removeElement(column[1]);
        removeElement(column[1]);
        // Only enabled queues can be successful
        if (row.className.indexOf("paused") == -1) {
            var queuedTasks = Number(column[1].innerHTML);
            var runLastMin = Number(column[2].innerHTML);
            //todo: may have queues that are rarely empty so drill into each queue to check for tasks that keep retrying
            // If there are tasks in the queue, and nothing ran in last min then keep the row
            if (!(queuedTasks > 0 && runLastMin == 0)) {
                removeElement(row);
            }
        }
        // Fix the task url
        var link = column[0].getElementsByTagName("a")[0];
        link.href = link.href;  // Want an absolute address
        link.target = "_BLANK";
    }

    var result = table.innerHTML;

    // Insert the parsed data into the viewing tab
    insertData(id, result);
}


//
function parseDashboardErrors(doc) {
    // Set Table Parameters
    var id = 'getDashboardErrors';
    var caption = 'Dashboard Error List';

    // No doc to parse so just return the parser id
    if (!doc) {
        return id;
    } else if (doc == "getCaption") {
        return caption;
    }

    // Get the operations table
    var table = doc.getElementById("ae-dash-errors");

    table.getElementsByTagName("caption")[0].getElementsByTagName("strong")[0].innerHTML = "<a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a>";

    // Remove the help icons
    var icons = table.getElementsByClassName("ae-help-icon");
    while (icons.length > 0) {
        icons[0].parentNode.removeChild(icons[0]);
    }

    // Run through each row in the error table(s?)
    // todo: google has three error tables right now, but they all have the same id. need to be able to differentiate between tables instead of grabbing the first
    var rows = table.getElementsByTagName("tr");
    // --i skips row 0
    for (var i = rows.length; --i > 0;) {
        var row = rows[i];
        var column = row.getElementsByTagName("td");

        // Google cuts off URIs if they are too long, but then searches logs for the exact URI which inevitably fails.
        // This modifies the urls to do a regex search instead of a path search so results will actually be found.
        var link = column[0].getElementsByTagName("a")[0];
        var appId = "";
        var filter = "";
        var getVars = link.href.split("?")[1];
        getVars = getVars.split("&");
        for (var j = getVars.length; j-- > 0;) {
            var argument = getVars[j].split("=");
            if (argument[0] == "app_id") {
                appId = argument[1];
            }
        }
        link.href = "https://appengine.google.com/logs?filter_type=regex&severity_level_override=1&view=search&app_id=" + appId + "&filter=" + link.innerHTML;
        link.target = "_BLANK";

        // Add a 'hide error for 1 week' button to each row
        column[0].innerHTML = '<button class="hide-dashboard-row" value="' + link.innerHTML + '">Hide</button> ' + link.outerHTML;

    }

    var result = table.innerHTML;

    // Insert the parsed data into the viewing tab. Add button handlers when objects are in the document
    insertData(id, result, function() {
        var buttons = document.querySelectorAll('.hide-dashboard-row')
        chrome.storage.local.get('hiddenUriList', function(result) {
            var uriList = result.hiddenUriList;

            for (var i = buttons.length; i-- > 0;) {
                var hid = false;
                if (uriList != null) {
                    for (var j = uriList.length; j-- > 0 && hid == false;) {
                        // If the row is in the hide list then potentially hide it
                        if (uriList[j].uri == buttons[i].value) {
                            // Remove the entry if the entry is older than a week (604800000ms)
                            if (new Date().getTime() - uriList[j].time > 604800000) {
                                uriList.remove(j);
                                // Update the storage
                                chrome.storage.local.set({hiddenUriList: uriList});
                            // Remove the row if the entry is less than a week old
                            } else {
                                removeElement(buttons[i].parentNode.parentNode);
                            }
                            hid = true;
                        }
                    }
                }
                // Add an event listener if the row wasn't removed
                if (hid == false) {
                    (function(button) {
                        buttons[i].addEventListener('click',
                            function() {
                                // add this URI to the hidden urls storage
                                var uri = button.value;
                                var time = new Date().getTime();
                                chrome.storage.local.get('hiddenUriList', function(result) {
                                    var uriList = result.hiddenUriList;
                                    if (uriList == null) {
                                        uriList = [];
                                    }
                                    uriList.push({uri: uri, time: time});

                                    chrome.storage.local.set({hiddenUriList: uriList}, function() {
                                        alert("the uri will be hidden for 7 days");
                                    });
                                });

                                // Remove the row from the page
                                removeElement(button.parentNode.parentNode);
                            }
                        );
                    } (buttons[i]))
                }
            }
        });
    });
}


//
function parseLogData(doc) {
    // Set Table Parameters
    var id = 'getLogData';
    var caption = "Error Logs";
    var self = this;

    // No doc to parse so just return the parser id
    if (!doc) {
        return id;
    } else if (doc == "getCaption") {
        return caption;
    }

    // Initialize the parsed data containers
    self.errors500 = {};
    self.errors400 = {};
    self.errorsOther = {};

    // Get the setting that details the maximum log age
    self.oldestAllowedDate = new Date(new Date().getTime() - 3*24*60*60*1000);    // Set oldest date to 3 days ago


    // Process the first page
    processPages(doc, function() {
        // Build the response
        var parsedData = "";

        // Add the 500 errors to the parsed data in order of date
        while (1) {
            var newestErrorUri = null;
            for (var uri in self.errors500) {
                if (newestErrorUri) {
                    if (self.errors500[newestErrorUri] < self.errors500[uri]) {
                        newestErrorUri = uri;
                    }
                } else {
                    newestErrorUri = uri;
                }
            }
            if (self.errors500.hasOwnProperty(newestErrorUri)) {
                var cssClass = "errors500";
                if (self.errors500[newestErrorUri].count >= 10) {
                    cssClass = "errors500-frequent"
                } else if (self.errors500[newestErrorUri].count >= 100) {
                    cssClass = "errors500-overload"
                }
                parsedData += buildUriEntry (cssClass, newestErrorUri, self.errors500[newestErrorUri].errorNum,
                                             newestErrorUri, self.errors500[newestErrorUri].latestDate,
                                             self.errors500[newestErrorUri].oldestDate,
                                             self.errors500[newestErrorUri].count);

                delete self.errors500[newestErrorUri];
            } else {
                break;
            }
        }

        // Add the 400 errors to the parsed data in order of date
        while (1) {
            var newestErrorUri = null;
            for (var uri in self.errors400) {
                if (newestErrorUri) {
                    if (self.errors400[newestErrorUri] < self.errors400[uri]) {
                        newestErrorUri = uri;
                    }
                } else {
                    newestErrorUri = uri;
                }
            }
            if (self.errors400.hasOwnProperty(newestErrorUri)) {
                var cssClass = "errors400";
                if (self.errors400[newestErrorUri].count >= 10) {
                    cssClass = "errors400-frequent"
                } else if (self.errors400[newestErrorUri].count >= 100) {
                    cssClass = "errors400-overload"
                }
                parsedData += buildUriEntry (cssClass, newestErrorUri, self.errors400[newestErrorUri].errorNum,
                                             newestErrorUri, self.errors400[newestErrorUri].latestDate,
                                             self.errors400[newestErrorUri].oldestDate,
                                             self.errors400[newestErrorUri].count);
                delete self.errors400[newestErrorUri];
            } else {
                break;
            }
        }

        // Add the other errors to the parsed data in order of date
        while (1) {
            var newestErrorUri = null;
            for (var uri in self.errorsOther) {
                if (newestErrorUri) {
                    if (self.errorsOther[newestErrorUri] < self.errorsOther[uri]) {
                        newestErrorUri = uri;
                    }
                } else {
                    newestErrorUri = uri;
                }
            }
            if (self.errorsOther.hasOwnProperty(newestErrorUri)) {
                var cssClass = "errorsOther";
                if (self.errorsOther[newestErrorUri].count >= 10) {
                    cssClass = "errorsOther-frequent"
                } else if (self.errorsOther[newestErrorUri].count >= 100) {
                    cssClass = "errorsOther-overload"
                }
                parsedData += buildUriEntry (cssClass, newestErrorUri, self.errorsOther[newestErrorUri].errorNum,
                                             newestErrorUri, self.errorsOther[newestErrorUri].latestDate,
                                             self.errorsOther[newestErrorUri].oldestDate,
                                             self.errorsOther[newestErrorUri].count);
                delete self.errorsOther[newestErrorUri];
            } else {
                break;
            }
        }

        var tableHead = "<thead></tr><th>URI</th><th>Code</th><th>Latest Occurrence</th><th>Earliest Occurrence</th><th>#Occurrences</th><tr></thead>";

        // Insert the parsed data into the viewing tab
        insertData(id, "<caption><a href='" + doc.URL + "' target='_BLANK'>" + caption + "</a></caption>" + tableHead + parsedData);
    });

    function buildUriEntry (cssClass, uri, errorNum, path, latestDate, oldestDate, count) {
        var url = "";
        url += "https://appengine.google.com/logs?";
        url += "filter_type=labels&view=search&severity_level_override=0&severity_level=3";
        url += "&filter=status%3A" + errorNum + "+path%3A" + uri;
        url += "&app_id=" + appId;

        var entry = "";
        entry += "<tr class='" + cssClass + "'>";
        entry += "<td><a href='" + url + "' target='_BLANK'>" + uri + "</a></td>";
        entry += "<td>" + errorNum + "</td>";
        entry += "<td>" + latestDate.toLocaleString() + "</td>"
        entry += "<td>" + oldestDate.toLocaleString() + "</td>" ;
        entry += "<td>" + count + "</td>";
        entry += "</tr>";
        return entry;
    }


    // Parse the data in the given html page and store it in the un-formatted data arrays
    function processPages(doc, callback) {
        // Get the expanded log entries
        var entries = doc.getElementsByClassName("ae-log");

        // Store the number of log entries
        var numEntries = entries.length;

        // Parse each entry on this page and store it appropriately
        for (var i = 0; i < numEntries; i++) {
            var spans = entries[i].getElementsByTagName("span");
            var date = new Date(spans[0].innerHTML);
            var uri = spans[1].innerHTML;
            var errorNum = spans[2].innerHTML;

            // Skip the log entry if it is too old and finish grabbing logs
            if (date < self.oldestAllowedDate) {
                self.notTooOld = false;
                if (callback) {
                    callback();
                    return null;
                }
            }

            // Sort the logs into their correct associative arrays
            if (errorNum.charAt(0) == "5") {
                if (uri in self.errors500) {
                    self.errors500[uri].count += 1;
                    if (date > self.errors500[uri].latestDate) { self.errors500[uri].latestDate = date; }
                    if (date < self.errors500[uri].oldestDate) { self.errors500[uri].oldestDate = date; }
                } else {
                    self.errors500[uri] = {errorNum:errorNum, latestDate:date, oldestDate:date, count:1}
                }
            } else if (errorNum.charAt(0) == "4") {
                if (uri in self.errors400) {
                    self.errors400[uri].count += 1;
                    if (date > self.errors400[uri].date) { self.errors400[uri].date = date; }
                    if (date < self.errors400[uri].date) { self.errors400[uri].date = date; }
                } else {
                    self.errors400[uri] = {errorNum:errorNum, latestDate:date, oldestDate:date, count:1}
                }
            } else {
                if (uri in self.errorsOther) {
                    self.errorsOther[uri].count += 1;
                    if (date > self.errorsOther[uri].latestDate) { self.errorsOther[uri].latestDate = date; }
                    if (date < self.errorsOther[uri].oldestDate) { self.errorsOther[uri].oldestDate = date; }
                } else {
                    self.errorsOther[uri] = {errorNum:errorNum, latestDate:date, oldestDate:date, count:1}
                }
            }
        }

        // Grab the next page and process it
        var nextUrl = doc.body.getElementsByClassName("ae-paginate-next")[0].href;

        // More logs available on other pages so process the next page
        if (nextUrl) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", nextUrl, true);
            xhr.responseType = "document";
            xhr.send();

            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        processPages(xhr.response, callback);
                    } else {
                        alert ("Error encountered while parsing logs: " + xhr.status + " - " + xhr.statusText);
                        if (callback) {
                            callback();
                            return null;
                        }
                    }
                }
            }
        } else {
            if (callback) {
                callback();
                return null;
            }
        }
    }
}