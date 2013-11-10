// Operations to run when the page data has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the user's appIds from storage and display entries for them
    chrome.storage.local.get('appIdList', function(result) {
        if (result && result.appIdList) {
            for (var i = 0; i <  result.appIdList.length; i++) {
                addAppRow(result.appIdList[i]);
            }
        }
    });

    // Get all available scrapers
    var scrapers = loadScraperList();

    // Add the html entries for each enable/disable scraper button
    var table = document.getElementById("scraperToggles").getElementsByTagName("tbody")[0];
    for (var entry in scrapers) {
        var row = document.createElement("tr");
        row.innerHTML = "<tr><td>" + scrapers[entry] + "</td><td class='settingsValueCell'><button class='scraperToggles' id='" + scrapers[entry] + "'></button></td></tr>";
        table.appendChild(row);
    }

    // Initialize scraper buttons
    chrome.storage.local.get('scraperToggles', function(result) {
        var scraperToggles = {};
        if (result && result.scraperToggles) {
            scraperToggles = result.scraperToggles;
        }
        // Get the buttons and set their initial values according to the general settings
        var buttons = document.getElementsByClassName("scraperToggles");
        for (var j = buttons.length; j-- > 0;) {
            // Initialize the button setting
            if (buttons[j].id in scraperToggles) {
                buttons[j].innerHTML = scraperToggles[buttons[j].id];
            } else {
                buttons[j].innerHTML = "ON";
            }
        }
    });


    // Add scraper toggle button handlers
    var buttons = document.getElementsByClassName("scraperToggles");
    for (var j = buttons.length; j-- > 0;) {
        // Setup the button click listener
        buttons[j].addEventListener('click',
            function() {
                var self = this;
                chrome.storage.local.get('scraperToggles', function(result) {
                    // Get the current settings
                    var scraperToggles = {};
                    if (result && result.scraperToggles) {
                        scraperToggles = result.scraperToggles;
                    }
                    // Flip the switch
                    if (!scraperToggles[self.id] || scraperToggles[self.id] == "ON") {
                        scraperToggles[self.id] = "OFF";
                    } else {
                        scraperToggles[self.id] = "ON";
                    }
                    // Display the setting change
                    self.innerHTML = scraperToggles[self.id];
                    // Store the changed settings
                    chrome.storage.local.set({scraperToggles: scraperToggles});
                });
            }
        );
    }


    // Add a listener for the add appId button
    document.getElementById("addApp").addEventListener('click',
        function() {
            chrome.storage.local.get('appIdList', function(result) {
                var appIdList;
                if (result == null || result.appIdList == null) {
                    appIdList = [];
                } else {
                    appIdList = result.appIdList;
                }
                var appId = document.getElementById("addAppName").value;
                if (appId.length > 0) {
                    appIdList.push(appId);
                    chrome.storage.local.set({appIdList: appIdList}, addAppRow(appId));
                }
                document.getElementById("addAppName").value = "";
            });
        }
    );

    // Add a list of all the URIs the user currently is hiding
    chrome.storage.local.get('hiddenUriList', function(result) {
        var uriList = result.hiddenUriList;
        if (uriList) {
            // Display the entries in the table
            var hiddenUriTable = document.getElementById("hiddenUris");
            for (var j = uriList.length; j-- > 0;) {
                // Remove the entry if the entry is older than a week
                if (new Date().getTime() - uriList[j].time > 604800000) {
                    uriList.remove(j);
                    // Update the storage
                    chrome.storage.local.set({hiddenUriList: uriList});

                // Show the row if the entry is less than a week old
                } else {
                    var row = document.createElement("tr");
                    row.innerHTML = "<td><button class='show-dashboard-row' value='" + uriList[j].uri + "'>Show</button> " + uriList[j].uri + "</td><td>" + new Date(uriList[j].time).toDateString() + "</td>";
                    hiddenUriTable.appendChild(row);
                }
            }

            var buttons = document.querySelectorAll('.show-dashboard-row')
            chrome.storage.local.get('hiddenUriList', function(result) {
                var uriList = result.hiddenUriList;

                for (var i = buttons.length; i-- > 0;) {
                    // Add an event listener if the row wasn't removed
                    (function(button) {
                        buttons[i].addEventListener('click',
                            function() {
                                // add this URI to the hidden urls storage
                                var uri = button.value;
                                chrome.storage.local.get('hiddenUriList', function(result) {
                                    var uriList = result.hiddenUriList;
                                    if (uriList == null) { uriList = []; }
                                    for (var entry in uriList) {
                                        if (uriList[entry]['uri'] == button.value) {
                                            delete uriList[entry]
                                        }
                                    }
                                    // Save the updated list
                                    chrome.storage.local.set({hiddenUriList: uriList});
                                });

                                // Remove the row from the page
                                removeElement(button.parentNode.parentNode);
                            }
                        );
                    } (buttons[i]))
                }
            });
        }
    });

    // Add tables for all the scrapers' custom settings
    for (var entry in scrapers) {
        loadScraper(scrapers[entry], function(scraper){
            scraper.getSettings(function(settings){
                if (settings) {
                    var hasValue = false;
                    var customSettingsTable = document.createElement("table");
                    customSettingsTable.setAttribute("id", scraper.name() + "Settings");
                    customSettingsTable.innerHTML += "<caption>" + scraper.name() + " Settings</caption><thead><tr><th>Setting Name</th><th>Value</th></tr></thead>";
                    for (var setting in settings) {
                        customSettingsTable.innerHTML += "<tr><td>" + setting + "</td><td><input type='text' name='" + setting + "' value='" + settings[setting] + "' class='" + scraper.name() + "Setting' /></td></tr>";
                        hasValue = true;
                    }
                    if (hasValue) {
                        customSettingsTable.innerHTML += "<tfoot><tr><td colspan='2'><button id='save-" + scraper.name() + "'>Save</button></td></tr></tfoot>";
                        document.body.appendChild(customSettingsTable);

                        // Add handler for saving the settings
                        var saveButton = document.getElementById("save-" + scraper.name());
                        var displayedSettings = document.getElementsByClassName(scraper.name() + "Setting");
                        saveButton.addEventListener('click', function() {
                            var newSettings = {};
                            for (var row in displayedSettings) {
                                var name = displayedSettings[row].name;
                                var value = displayedSettings[row].value;
                                newSettings[name] = value;
                            }
                            var dic = {};
                            dic[scraper.name()+"Settings"] = newSettings;
                            chrome.storage.local.set(dic);
                        });
                    }
                }
            });
        })
    }
});


// Adds the given appId to the table of available apps, and sets up the button used to remove the entry
function addAppRow(appId) {
    var appIdTable = document.getElementById("appIds").getElementsByTagName("tbody")[0];
    // Display a new row for the appId
    var appRow = document.createElement("tr");
    appRow.setAttribute("id", "appList-" + appId);
    appRow.setAttribute("class", "appListEntry");
    appRow.innerHTML = "<td>" + appId + "</td><td class='buttonCell'><button id='remove-" + appId + "'>Remove App</button></td>" +
        "<td class='buttonCell'><button class='up'>&#x25B2;</button></td><td class='buttonCell'><button class='down'>&#x25BC;</button></td>";
    appIdTable.appendChild(appRow);

    // Add event listener to the remove button
    var removeButton = document.getElementById("remove-" + appId);
    removeButton.addEventListener('click',
        function() {
            // Stop displaying row in table
            var row = document.getElementById("appList-" + appId);
            row.parentNode.removeChild(row);

            // Save new state
            saveAppIdList();
        }
    );
    //
    var upButton = appRow.getElementsByClassName("up")[0];
    upButton.addEventListener('click',
        function() {
            // Move row above preceding row
            var element = document.getElementById("appList-" + appId);
            if (element.rowIndex > 1){
                // Move Element Down
                element.parentNode.insertBefore(element, element.previousSibling);

                // Save new state
                saveAppIdList();
            }
        }
    );
    //
    var downButton = appRow.getElementsByClassName("down")[0];
    downButton.addEventListener('click',
        function() {
            // Move row above preceding row
            var element = document.getElementById("appList-" + appId);
            var refNode = element.nextSibling;
            refNode.parentNode.insertBefore(element, refNode.nextSibling);
            insertAfter(element.nextSibling, element)

            // Save new state
            saveAppIdList();
        }
    );
    // saves the appId list in the order it currently appears in the settings window
    function saveAppIdList() {
        // Create the new appId list
        var appIdList = [];

        // Get the data from the list being displayed
        var elements = document.getElementById("appIds").getElementsByClassName("appListEntry");
        for (var i = 0; i < elements.length; i++) {
            var name = elements[i].getElementsByTagName("td")[0].innerHTML;
            appIdList.push(name);
        }

        // Save the list
        chrome.storage.local.set({appIdList: appIdList});
    };
}