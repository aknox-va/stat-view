//
function parseDashboardErrors() {
    self.captionText = 'Dashboard Error List';

    self.style = "";

    self.run = function(doc) {
        // Get the operations table
        var table = doc.getElementById("ae-dash-errors");

        table.getElementsByTagName("caption")[0].getElementsByTagName("strong")[0].innerHTML = "<a href='" + doc.URL + "' target='_BLANK'>" + self.captionText + "</a>";

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
        insertData("parseDashboardErrors", result, applyHandlers);

        // Applies the handlers for the entry buttons that hide the specific entry
        function applyHandlers() {
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
        }
    }

    return this;
}