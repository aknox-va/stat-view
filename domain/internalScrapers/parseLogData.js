//
function parseLogData() {
    this.url = function(appId) { return "https://appengine.google.com/logs?app_id=s~" + appId + "&severity_level_override=0&severity_level=3&limit=200"; };
    this.captionText = "Error Logs";
    this.style = "#parseLogData #log-uri {width: 60%;}" +
                 "#parseLogData #log-code {width: 5%;}" +
                 "#parseLogData #log-newest {width: 15%;}" +
                 "#parseLogData #log-earliest {width: 15%;}" +
                 "#parseLogData #log-count {width: 5%;}" +
                 "#parseLogData tfoot td {text-align: center;}";
    this.settingsDefaults = {
            hide_uri_if_error_count_below:5,
            highlight_level_1_if_error_count_above:20,
            highlight_level_2_if_error_count_above:200,
            max_num_days_checked:3
        };

    this.process = function(doc, settings, callback) {
        var self = this;

        // Initialize the parsed data containers
        self.errors500 = {};
        self.errors400 = {};
        self.errorsOther = {};

        // Get the setting that details the maximum log age
        self.oldestAllowedDate = new Date(new Date().getTime() - settings.max_num_days_checked*24*60*60*1000);    // Set oldest date to 3 days ago


        // Process the first page
        processPages(doc, function() {
            // Build the response
            var parsedData = "";
            var hiddenCount = 0;

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
                    if (self.errors500[newestErrorUri].count >= settings.highlight_level_1_if_error_count_above) {
                        cssClass = "errors500-frequent";
                    }
                    if (self.errors500[newestErrorUri].count >= settings.highlight_level_2_if_error_count_above) {
                        cssClass = "errors500-overload";
                    }
                    if (self.errors500[newestErrorUri].count < settings.hide_uri_if_error_count_below) {
                        hiddenCount++;
                    } else{
                        parsedData += buildUriEntry (cssClass, newestErrorUri, self.errors500[newestErrorUri].errorNum,
                                                     self.errors500[newestErrorUri].latestDate,
                                                     self.errors500[newestErrorUri].oldestDate,
                                                     self.errors500[newestErrorUri].count);
                    }
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
                    if (self.errors400[newestErrorUri].count >= settings.highlight_level_1_if_error_count_above) {
                        cssClass = "errors400-frequent";
                    }
                    if (self.errors400[newestErrorUri].count >= settings.highlight_level_2_if_error_count_above) {
                        cssClass = "errors400-overload";
                    }
                    if (self.errors400[newestErrorUri].count < settings.hide_uri_if_error_count_below) {
                        hiddenCount++;
                    } else {
                        parsedData += buildUriEntry (cssClass, newestErrorUri, self.errors400[newestErrorUri].errorNum,
                                                     self.errors400[newestErrorUri].latestDate,
                                                     self.errors400[newestErrorUri].oldestDate,
                                                     self.errors400[newestErrorUri].count);
                    }
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
                    if (self.errorsOther[newestErrorUri].count >= settings.highlight_level_1_if_error_count_above) {
                        cssClass = "errorsOther-frequent";
                    }
                    if (self.errorsOther[newestErrorUri].count >= settings.highlight_level_2_if_error_count_above) {
                        cssClass = "errorsOther-overload";
                    }
                    if (self.errorsOther[newestErrorUri].count < settings.hide_uri_if_error_count_below) {
                        hiddenCount++;
                    } else {
                        parsedData += buildUriEntry (cssClass, newestErrorUri, self.errorsOther[newestErrorUri].errorNum,
                                                     self.errorsOther[newestErrorUri].latestDate,
                                                     self.errorsOther[newestErrorUri].oldestDate,
                                                     self.errorsOther[newestErrorUri].count);
                    }
                    delete self.errorsOther[newestErrorUri];
                } else {
                    break;
                }
            }

            var tableHead = "<thead><tr>" +
                "<th id='log-uri'>URI</th><th id='log-code'>Code</th><th id='log-newest'>Latest Occurrence</th>" +
                "<th id='log-earliest'>Earliest Occurrence</th><th id='log-count'>Count</th>" +
                "</tr></thead>";

            callback("<caption><a href='" + doc.URL + "' target='_blank'>" + self.captionText + " (Last " + settings.max_num_days_checked + " Days Maximum)" + "</a></caption>"
                + tableHead + parsedData + "<tfoot><tr><td colspan='5'>"+ hiddenCount + " URIs below display threshold of " + settings.hide_uri_if_error_count_below + "</td></tr></tfoot>");
        });

        function buildUriEntry (cssClass, uri, errorNum, latestDate, oldestDate, count) {
            var splitUri = uri.split("?");
            var status = "status%3A" + errorNum;
            var path = "+path%3A" + encodeURIComponent(splitUri[0]).replace(/amp%3B/g, "");
            var queryString = "";
            if (splitUri.length === 2) {
                queryString = "+querystring%3A%5C%3F" + encodeURIComponent(splitUri[1]).replace(/amp%3B/g, "");
            }

            var url = "";
            url += "https://appengine.google.com/logs?";
            url += "filter_type=labels&view=search&severity_level_override=0&severity_level=3";
            url += "&filter=" + status + path + queryString;
            url += "&app_id=" + appId;

            var entry = "";
            entry += "<tr class='" + cssClass + "'>";
            entry += "<td><a href='" + url + "' target='_BLANK'>" + uri + "</a></td>";
            entry += "<td>" + errorNum + "</td>";
            entry += "<td>" + latestDate.toLocaleString() + "</td>";
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
            var oldestDateTime = new Date();
            for (var i = 0; i < numEntries; i++) {
                var spans = entries[i].getElementsByTagName("span");
                var date = new Date(spans[0].innerHTML);
                var uri = spans[1].innerHTML;
                var errorNum = spans[2].innerHTML;
                if (oldestDateTime - date > 0) {
                    oldestDateTime = date;
                }

                // Skip the log entry if it is too old and finish grabbing logs
                if (date < self.oldestAllowedDate) {
                    self.notTooOld = false;
                    if (callback) {
                        callback();
                        return null;
                    }
                }

                // Sort the logs into their correct associative arrays
                if (errorNum.charAt(0) === "5") {
                    if (uri in self.errors500) {
                        self.errors500[uri].count += 1;
                        if (date > self.errors500[uri].latestDate) { self.errors500[uri].latestDate = date; }
                        if (date < self.errors500[uri].oldestDate) { self.errors500[uri].oldestDate = date; }
                    } else {
                        self.errors500[uri] = {errorNum:errorNum, latestDate:date, oldestDate:date, count:1}
                    }
                } else if (errorNum.charAt(0) === "4") {
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
                // URI is too long so start a new search by date
                if (nextUrl.length > 1500) {
                    var date = oldestDateTime.getFullYear() + "-" + String(Number(oldestDateTime.getMonth())+1) + "-" + oldestDateTime.getDate();
                    var time = oldestDateTime.getHours() + "%3A" + oldestDateTime.getMinutes() + "%3A" + oldestDateTime.getSeconds();
                    nextUrl = self.url(appId) + "&date_type=datetime&date=" + date + "&time=" + time;
                }
                console.log("get:" + nextUrl);
                var xhr = new XMLHttpRequest();
                xhr.open("GET", nextUrl, true);
                xhr.responseType = "document";
                xhr.send();

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
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
}