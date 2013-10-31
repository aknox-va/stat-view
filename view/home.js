var appId = "";
var htmlUrls = new Array();


// Setup the page and spool up the data gathering
window.onload = function() {
    // Set the appId
    var urlParam = document.location.href.split("?")[1].split("=");
    if (urlParam[0] == "appId") {
        appId = urlParam[1];

        // Setup the page heading
        var header = document.getElementsByTagName("header")[0];
        header.innerHTML = header.innerHTML + " : " + appId;
        
        // Create the list of sources to grab data from
        // todo: allow the user to edit this list in settings and pull it from storage
        htmlUrls = {};
        htmlUrls["http://www.xkcd.com"] = parseXkcd;
        htmlUrls["https://ah-builtin-python-bundle-dot-" + appId + ".appspot.com/_ah/datastore_admin/?app_id=s~" + this.appId + "&adminconsolecustompage"] = parseDatastoreAdmin;
        htmlUrls["https://appengine.google.com/cron?app_id=s~" + appId] = parseCronJobs;
        htmlUrls["https://appengine.google.com/queues?app_id=s~" + appId] = parseTaskQueues;
        htmlUrls["https://appengine.google.com/dashboard?app_id=s~" + appId] = parseDashboardErrors;
        htmlUrls["https://appengine.google.com/logs?app_id=s~" + appId + "&severity_level_override=0&severity_level=3&limit=200"] = parseLogData;

        // Process each url
        for (var entry in htmlUrls) {
            // get DOM from the url and process it
            (function(entry, parseMethod) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", entry, true);
                xhr.onload = function(){htmlUrls[entry](this.response)};
                xhr.responseType = "document";
                xhr.send();
            })(entry, htmlUrls[entry]);
        }

        // dashboard/stats return json so it needs to be handled differently
        getImageFromJson("7 Day Error Details Chart", "https://appengine.google.com/dashboard/stats?type=4&window=7&app_id=s~" + appId);
        getImageFromJson("7 Day Memory Usage Chart (MB)", "https://appengine.google.com/dashboard/stats?type=9&window=7&app_id=s~" + appId);
    }
};


// Handler that adds a given table to the page if the data is for this appId
function parseHtml(name, doc) {
                         // Put the new content in the table
/*
    // adds the handlers for the buttons that hide rows and hide any rows the user doesn't want to see
    if(message.getDataMethod == "getDashboardErrors") {

    }*/
}


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


//
function insertData(id, data, callback) {
    var newContent = document.getElementById(id);    // Find the table to put data in
    removeElement(newContent.getElementsByTagName("caption")[0])        // Remove the table placeholder
    newContent.innerHTML = data;
    callback();
}


//
function parseXkcd(doc) {
    // Set Table Parameters
    var id = 'getXkcd';
    var caption = "Today's XKCD Comic";

    // Get the xkcd image
    var result = doc.getElementById("comic").innerHTML;

    // Insert the parsed data into the viewing tab
    insertData(id, "<caption>" + caption + "</caption>" + result);
}


//
function parseDatastoreAdmin(doc) {
    // Set Table Parameters
    var id = 'getDatastoreAdmin';
    var caption = "Datastore Admin - Completed Operation Errors";

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
    insertData(id, "<caption>" + caption + "</caption>" + result);
}


//
function parseCronJobs(doc) {
    // Set Table Parameters
    var id = 'getCronJobs';
    var caption = "Cron Jobs - Non-Ideal Runs";

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
    insertData(id, "<caption>" + caption + "</caption>" + result);
}


//
function parseTaskQueues(doc) {
    // Set Table Parameters
    var id = 'getTaskQueues';
    var caption = "Stuck Task Queues";

    // Get the operations table
    var table = doc.getElementById("ae-tasks-queue-table");
    table.getElementsByTagName("caption")[0].innerHTML = caption;
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

    // Get the operations table
    var table = doc.getElementById("ae-dash-errors");

    var caption = table.getElementsByTagName("caption")[0].getElementsByTagName("strong")[0];
    caption.innerHTML = "Dashboard " + caption.innerHTML + " List";

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
    var caption = "Stuck Task Queues";

    // Get the expanded log entries
    var entries = doc.getElementsByClassName("ae-log");

    // Run through each log entry and group them
    var numEntries = entries.length;
    var parsedData = "";
    var uniqueUris = {};
    for (var i = 0; i < numEntries; i++) {
        var spans = entries[i].getElementsByTagName("span");
        var date = spans[0].innerHTML;
        var uri = spans[1].innerHTML;
        var errorNum = spans[2].innerHTML;

        if (uri in uniqueUris) {
            uniqueUris[uri].count += 1;
            if (new Date(date) > new Date(uniqueUris[uri].date)) {
                uniqueUris[uri].date = date;
            }
        } else {
            uniqueUris[uri] = {errorNum:errorNum, date:date, count:1}
        }
    }

    // Build the response
    for (var uri in uniqueUris) {
        parsedData += "<tr><td><a href='https://appengine.google.com/logs?filter_type=regex&severity_level_override=1&view=search&app_id=" + appId + "&filter=" + uri + "' target='_BLANK'>" + uri + "</a></td><td>" + uniqueUris[uri].errorNum + "</td><td>" + uniqueUris[uri].date + "</td><td>" + uniqueUris[uri].count + "</td></tr>"
    }
    var tableHead = "<thead></tr><th>URI</th><th>Code</th><th>NewestDate</th><th>#Occurrences</th><tr></thead>";

    // Insert the parsed data into the viewing tab
    insertData(id, "<caption>" + caption + "</caption>" + tableHead + parsedData);
}