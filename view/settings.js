// Operations to run when the page data has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Style input fields
    $("input:text").button().addClass("input-text");

    // Get the user's appIds from storage and display entries for them
    chrome.storage.local.get('appIdList', function(result) {
        if (result && result.appIdList) {
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
            }

            for (var i = 0; i <  result.appIdList.length; i++) {
                addAppRow(result.appIdList[i]);
            }

            // Add button click listeners for the table
            $("button.up")
                .button()
                .click(function(event) {
                    // Move row above preceding row
                    var element = document.getElementById("appList-" + this.value);
                    if (element.rowIndex > 1){
                        // Move Element Down
                        element.parentNode.insertBefore(element, element.previousSibling);

                        // Save new state
                        saveAppIdList();
                    }
                });

            $("button.down")
                .button()
                .click(function(event) {
                    // Move row above preceding row
                    var element = document.getElementById("appList-" + this.value);
                    var refNode = element.nextSibling;
                    if (refNode) {
                        refNode.parentNode.insertBefore(element, refNode.nextSibling);

                        // Save new state
                        saveAppIdList();
                    }
                });

            $("button#remove-app-id")
                .button()
                .click(function(event) {
                    // Stop displaying row in table
                    var row = document.getElementById("appList-" + this.value);
                    row.parentNode.removeChild(row);

                    // Save new state
                    saveAppIdList();
                });
        }
    });

    // Get all available scrapers
    loadScraperList(function(scrapers) {
        var externalScraperFragment = document.createDocumentFragment();
        var toggleFragment = document.createDocumentFragment();

        for (var entry in scrapers) {
            // Add entry for existing external scraper if this is an external scraper
            if (scrapers[entry].url) {
                var row = document.createElement("tr");
                var removeButton = document.createElement("button");
                removeButton.innerHTML = "Remove";
                removeButton.value = scrapers[entry].url;
                removeButton.className = "remove-external-scraper";
                row.innerHTML = "<tr><td>" + scrapers[entry].name + "</td><td>" + scrapers[entry].url + "</td><td></td></tr>";
                row.getElementsByTagName("td")[2].appendChild(removeButton);
                externalScraperFragment.appendChild(row);
            }

            // Add the html entry for this scraper's enable/disable button
            var row = document.createElement("tr");
            var externalText = "";
            if (scrapers[entry].url) {externalText = "External: "}
            row.innerHTML = "<tr><td>" + externalText + scrapers[entry].name + "</td><td class='settingsValueCell'><button class='scraperToggles' id='" + scrapers[entry].name + "'></button></td></tr>";
            toggleFragment.appendChild(row);

            // Add tables for all the scrapers' custom settings
            loadScraper(scrapers[entry], function(scraper){
                scraper.getSettings(function(settings){
                    var hasValue = false;

                    // Create the table
                    var customSettingsTable = document.createElement("table");
                    customSettingsTable.setAttribute("id", scraper.name() + "Settings");
/*
                    var grid = $("#" + scraper.name() + "Settings");
                    grid.jqGrid({
                        datatype: "local",
                        height: 250,
                        colNames: ['Setting Name', 'Number Value'],
                        colModel: [{
                            name: 'setting',
                            index: 'setting',
                            width: 60,
                            sorttype: "string"},
                        {
                            name: 'value',
                            index: 'value',
                            width: 60,
                            sorttype: "int"}
                        ],
                        caption: scraper.name() + "Settings"
                    });

                    // Populate the table
                    var i = 0;
                    for (var setting in settings) {
                        grid.jqGrid('addRowData', ++i, {setting:setting, value:settings[setting]});
                    }
*/

                    for (var setting in settings) {
                        customSettingsTable.innerHTML += "<tr><td>" + setting + "</td><td><input type='text' name='" + setting + "' value='" + settings[setting] + "' class='" + scraper.name() + "Setting' /></td></tr>";
                        hasValue = true;
                    }

                    if (hasValue) {
                        customSettingsTable.innerHTML += "<tfoot><tr><td colspan='2'><button id='save-" + scraper.name() + "'>Save</button></td></tr></tfoot>";
                        document.getElementById("custom-settings").innerHTML += "<h3>" + scraper.name() + " Settings</h3><div>" + customSettingsTable.outerHTML + "</div>";
                        $("#custom-settings").accordion("refresh");

                        // Add handler for saving the settings
                        var displayedSettings = document.getElementsByClassName(scraper.name() + "Setting");

                        $("button#save-" + scraper.name())
                            .button()
                            .click(function( event ) {
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

                        // Style input fields
                        $("input:text").button().addClass("input-text");
                    }
                });
            })
        }

        // Add the elements to the DOM
        var externalScraperTable = document.getElementById("externalScrapers").getElementsByTagName("tbody")[0];
        var toggleTable = document.getElementById("scraperToggles").getElementsByTagName("tbody")[0];
        externalScraperTable.appendChild(externalScraperFragment);
        toggleTable.appendChild(toggleFragment);


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
        $("button.scraperToggles")
            .button()
            .click(function( event ) {
                    var self = this;
                    chrome.storage.local.get('scraperToggles', function(result) {
                        // Get the current settings
                        var scraperToggles = {};
                        if (result && result.scraperToggles) { scraperToggles = result.scraperToggles;
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




        // Add remove external scraper button handlers
        $("button.remove-external-scraper")
            .button()
            .click(function(event) {
                removeExternalScraper(this);
            });
    });

    // add a listener for the add scraper button
    $("button#addScraper")
        .button()
        .click(function( event ) {
            chrome.storage.local.get('externalScrapers', function(result) {
                var externalScraperList;
                if (result && result.externalScrapers) {
                    externalScraperList = result.externalScrapers;
                } else {
                    externalScraperList = [];
                }

                var newScraperName = document.getElementById("newExternalScraperName").value;
                var newScraperUrl = document.getElementById("newExternalScraperUrl").value;
                if (newScraperName.length > 0 && newScraperUrl.length > 0) {
                    newScraperUrl = "https://googledrive.com/host/" + newScraperUrl;
                    externalScraperList.push({name:newScraperName, url:newScraperUrl});
                    chrome.storage.local.set({externalScrapers: externalScraperList}, function () {
                        window.location.reload();   // Reload whole page since custom setting may need to be grabbed
                    });
                }
            });
        }
    );


    // Add a listener for the add appId button
    $("button#addApp")
        .button()
        .click(function( event ) {
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
            var hiddenUriFragment = document.createDocumentFragment();
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
                    hiddenUriFragment.appendChild(row);
                }
            }
            // Add entries to DOM
            document.getElementById("hiddenUris").appendChild(hiddenUriFragment);

            // Add the button click listeners
            $("button.show-dashboard-row")
                .button()
                .click(function(event) {
                    self = this;
                    var uri = self.value;
                    chrome.storage.local.get('hiddenUriList', function(result) {
                        var uriList = result.hiddenUriList;
                        if (uriList == null) { uriList = []; }
                        for (var entry in uriList) {
                            if (uriList[entry]['uri'] == self.value) {
                                delete uriList[entry]
                            }
                        }
                        // Save the updated list
                        chrome.storage.local.set({hiddenUriList: uriList});
                    });

                    // Remove the row from the page
                    removeElement(self.parentNode.parentNode);
                });
        }
    });

    // Setup tabs
    $("#tabs").tabs().addClass( "ui-tabs-vertical ui-helper-clearfix" );
    $("#tabs li").removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );

    // Setup tables
    /*
    $("table").jqGrid({
      heightStyle: "content",
      shrinkToFit:false,
      width:250
    });
*/

    // Setup custom settings tab
    $("#custom-settings").accordion({
      heightStyle: "content"
    });
});


// Adds the given appId to the table of available apps, and sets up the button used to remove the entry
function addAppRow(appId) {
    var appIdTable = document.getElementById("appIds").getElementsByTagName("tbody")[0];
    // Display a new row for the appId
    var appRow = document.createElement("tr");
    appRow.setAttribute("id", "appList-" + appId);
    appRow.setAttribute("class", "appListEntry");
    appRow.innerHTML = "<td>" + appId + "</td><td class='buttonCell'><button id='remove-app-id' value='" + appId + "'>Remove App</button></td>" +
        "<td class='buttonCell'><button class='up' value='" + appId + "'>↑</button></td><td class='buttonCell'><button class='down' value='" + appId + "'>↓</button></td>";
    appIdTable.appendChild(appRow);
}