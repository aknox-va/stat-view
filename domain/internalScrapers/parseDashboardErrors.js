//
function parseDashboardErrors() {
    this.url = function(appId) { return "https://appengine.google.com/dashboard?app_id=s~" + appId; };
    this.captionText = 'Dashboard Error List';
    this.settingsDefaults = {
            critical_if_error_count_above:10,
            critical_if_failure_rate_above:25,
            if_true_show_only_critical_errors:0
        };
    this.style = "#parseDashboardErrors #db-errors-uri {width: 87%;}" +
                 "#parseDashboardErrors #db-errors-count {width: 5%;}" +
                 "#parseDashboardErrors #db-errors-pc-error {width: 8%;}" +
                 "#parseDashboardErrors .db-errors-sub-heading {background-color: #507976; font-weight: bold; margin: 0.25em; text-align: center;}" +
                 "#parseDashboardErrors #db-errors-pc-error span {font-weight: normal;}";

    this.process = function(doc, settings, callback) {
        // Get the operations table
        var errorTables = []
        errorTables[0] = doc.getElementById("ae-dash-errors");
        errorTables[0].id = "ae-dash-errors-400";
        errorTables[1] = doc.getElementById("ae-dash-errors");
        errorTables[1].id = "ae-dash-errors-500";

        for (var entry in errorTables) {
            var table = errorTables[entry];

            // Remove the help icons
            var icons = table.getElementsByClassName("ae-help-icon");
            while (icons.length > 0) {
                icons[0].parentNode.removeChild(icons[0]);
            }

            // Run through each row in the error table
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
                    if (argument[0] === "app_id") {
                        appId = argument[1];
                    }
                }
                link.href = "https://appengine.google.com/logs?filter_type=regex&severity_level_override=0&severity_level=3&view=search&app_id=" + appId + "&filter=" + encodeURIComponent(link.innerHTML);
                link.target = "_blank";

                // Add a 'hide error for 1 week' button to each row
                column[0].innerHTML = '<button class="hide-dashboard-row" value="' + link.innerHTML + '">Hide</button> ' + link.outerHTML;

                var errorCount = parseInt(column[1].innerHTML);
                var errorRate = parseFloat(column[2].innerHTML);
                if (errorCount > settings.critical_if_error_count_above || errorRate > settings.critical_if_failure_rate_above) {
                    row.setAttribute("style", "background-color: #ae433a;");
                } else {
                    if (settings.if_true_show_only_critical_errors > 0) {
                        removeElement(row);
                    }
                }
            }
        }

        // Remove stuff that is duplicated in the second table
        removeElement(errorTables[1].getElementsByTagName("colgroup")[0]);
        removeElement(errorTables[1].getElementsByTagName("caption")[0]);
        removeElement(errorTables[1].getElementsByTagName("thead")[0]);

        // Add IDs to the th elements
        var thArray = errorTables[0].getElementsByTagName("th");
        thArray[0].id = "db-errors-uri";
        thArray[1].id = "db-errors-count";
        thArray[2].id = "db-errors-pc-error";

        // Add identifiers
        errorTables[0].getElementsByTagName("caption")[0].getElementsByTagName("strong")[0].innerHTML = "<a href='" + doc.URL + "' target='_blank'>" + this.captionText + "</a>";
        var tbody = errorTables[0].getElementsByTagName("tbody")[0];
        tbody.innerHTML = '<trx><td class="db-errors-sub-heading" colspan="3">400 Errors</td></tr>' + tbody.innerHTML;
        tbody = errorTables[1].getElementsByTagName("tbody")[0];
        tbody.innerHTML = '<tr><td class="db-errors-sub-heading" colspan="3">500 Errors</td></tr>' + tbody.innerHTML;

        callback(errorTables[0].innerHTML + errorTables[1].innerHTML);
    };

    this.onLoad = function () {
        var buttons = document.querySelectorAll('.hide-dashboard-row');
        getStoredData('hiddenUriList', 'list', function(uriList) {
            for (var i = buttons.length; i-- > 0;) {
                var hid = false;
                for (var j = uriList.length; j-- > 0 && hid === false;) {
                    // If the row is in the hide list then potentially hide it
                    if (uriList[j].uri === buttons[i].value) {
                        // Remove the entry if the entry is older than a week (604800000ms)
                        if (new Date().getTime() - uriList[j].time > 604800000) {
                            uriList.remove(j);
                            // Update the storage
                            setData({hiddenUriList: uriList});
                        // Remove the row if the entry is less than a week old
                        } else {
                            removeElement(buttons[i].parentNode.parentNode);
                        }
                        hid = true;
                    }
                }
                // Add an event listener if the row wasn't removed
                if (hid === false) {
                    (function(button) {
                        buttons[i].addEventListener('click',
                            function() {
                                // add this URI to the hidden urls storage
                                var uri = button.value;
                                var time = new Date().getTime();
                                getStoredData('hiddenUriList', 'list', function(uriList) {
                                    uriList.push({uri: uri, time: time});

                                    setData({hiddenUriList: uriList}, function() {
                                        // Remove the row from the page
                                        removeElement(button.parentNode.parentNode);
                                    });
                                });
                            }
                        );
                    } (buttons[i]))
                }
            }
        });
    }
}
