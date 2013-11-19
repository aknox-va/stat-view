var _gaq = _gaq || [];
_gaq.push(['_setAccount', ANALYTICS_CODE]);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// Operations to run when the page data has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load tab data
    loadScraperList(function(scrapers) {
        loadCustomSettings(scrapers);
        loadExternalScrapers(scrapers);
        loadScraperToggles(scrapers);
    });
    loadApps();
    loadHiddenUris();

    // Style static input fields
    $("input:text").button().addClass("input-text");
    $("#newExternalScraperName").on("click", function() { if (this.value === "Scraper Function Name") { this.value = ""; } });
    $("#newExternalScraperName").on("blur", function() { if (this.value === "") { this.value = "Scraper Function Name"; } });
    $("#newExternalScraperUrl").on("click", function() { if (this.value === "Google Drive File ID") { this.value = ""; } });
    $("#newExternalScraperUrl").on("blur", function() { if (this.value === "") { this.value = "Google Drive File ID"; } });

    // Style tabs
    $("#tabs").tabs().addClass( "ui-tabs-vertical ui-helper-clearfix" );
    $("#tabs li").removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );

    // Style custom settings tab
    $("#custom-settings").accordion({
        heightStyle: "content",
        collapsible: true,
        active: false
    });
});


////////////////////////////////////////////////////
// Loads the Apps tab data
////////////////////////////////////////////////////
function loadApps() {
     // Create a jqGrid table to hold the app IDs
    jQuery("#appIds").jqGrid({
        datatype:"local",
        colNames:['App ID','Up', 'Down', 'Remove'],
        colModel:[
            {name:'id',index:'id', width:404, align:"left", sortable:false, resizable:false},
            {name:'up',index:'up', width:50, align:"center", sortable:false, resizable:false},
            {name:'down',index:'down', width:50, align:"center", sortable:false, resizable:false},
            {name:'remove',index:'remove', width:150, align:"center", sortable:false, resizable:false}
        ],
        height:"auto",
        width:674,
        shrinkToFit: false,
        scrollOffset: 21,
        caption: "App IDs available in dropdown"
    });

    // Get the user's appIds from storage and display entries for them
    getStoredData('appIdList', "list", function(appIdList) {
        // Populate the table with the existing app IDs
        for (var i = 0; i <  appIdList.length; i++) { addAppIdRow(appIdList[i]) }
        applyAppButtonHandlers();
    });

    // Add a listener for the add appId button
    $("button#addApp").button().click(function() {
        getStoredData('appIdList', "list", function(appIdList) {
            var appId = document.getElementById("addAppName").value;
            if (appId.length > 0) {
                appIdList.push(appId);
                setData({appIdList: appIdList}, function() {
                    addAppIdRow(appId);
                    applyAppButtonHandlers();
                });
            }
            document.getElementById("addAppName").value = "";
        });
    });

    // Add button click listeners for the table
    function applyAppButtonHandlers() {
        // saves the appId list in the order it currently appears in the settings window
        function saveAppIds() {
            var appIdList = [];

            // Get the data from the list being displayed
            var elements = document.getElementById("appIds").getElementsByTagName("tr");
            for (var i = 1; i < elements.length; i++) {
                var name = elements[i].getElementsByTagName("td")[0].innerHTML;
                appIdList.push(name);
            }

            // Save the list
            setData({appIdList: appIdList});
        }

        // Move appid up in list
        $("button.up").button().click(function() {
            // Move row above preceding row
            var row = $(this).closest("tr")[0];
            if (row.rowIndex > 1){
                row.parentNode.insertBefore(row, row.previousSibling);
                saveAppIds();
            }
        });

        // Move appid down in list
        $("button.down").button().click(function() {
            // Move row above preceding row
            var row = $(this).closest("tr")[0];
            var refNode = row.nextSibling;
            if (refNode) {
                refNode.parentNode.insertBefore(row, refNode.nextSibling);
                saveAppIds();
            }
        });

        // Remove appid from list
        $("button#remove-app-id").button().click(function() {
            // Stop displaying row in table
            var row = $(this).closest("tr")[0];
            row.parentNode.removeChild(row);
            saveAppIds();
        });
    }

    // Displays the given appId in the appId table with a new row
    function addAppIdRow(appId) {
        var data = {
            id:appId,
            up:"<button class='up' value='" + appId + "'>↑</button>",
            down:"<button class='down' value='" + appId + "'>↓</button>",
            remove:"<button id='remove-app-id' value='" + appId + "'>Remove App</button>"
        };
        $("#appIds").addRowData("app-" + appId, data, "last");
    }
}


////////////////////////////////////////////////////
// Loads the external scrapers tab data
////////////////////////////////////////////////////
function loadExternalScrapers(scrapers) {
     // Create a jqGrid table to hold the external scraper list
    jQuery("#externalScrapers").jqGrid({
        datatype:"local",
        colNames:['Scraper Name','Google Drive URL', 'Action'],
        colModel:[
            {name:'scraperName',index:'scraperName', width:160, align:"left", sortable:false, resizable:false},
            {name:'id',index:'id', width:399, align:"left", sortable:false, resizable:false},
            {name:'remove',index:'remove', width:100, align:"center", sortable:false, resizable:false}
        ],
        height:"auto",
        width:674,
        shrinkToFit: false,
        scrollOffset: 21,
        caption: "External Scrapers (Hosted on google drive)"
    });


    // Add entry for existing external scraper if this is an external scraper
    for (var entry in scrapers) {
        if (scrapers.hasOwnProperty(entry) && scrapers[entry].url) {
            // Create the remove button
            var removeButton = document.createElement("button");
            removeButton.innerHTML = "Remove";
            removeButton.value = scrapers[entry].url;
            removeButton.className = "remove-external-scraper";

            // Add the scraper to the table
            var data = { scraperName:scrapers[entry].name, id:scrapers[entry].url, remove:removeButton.outerHTML };
            $("#externalScrapers").addRowData("external-" + scrapers[entry].name, data, "last");

        }
    }

    // Add remove external scraper button handlers
    $("button.remove-external-scraper").button().click(function() {
        removeExternalScraper(this.value);
    });

    // add a handler for the add scraper button
    $("button#addScraper").button().click(function() {
        getStoredData('externalScrapers', "list", function(externalScraperList) {
            var newScraperName = document.getElementById("newExternalScraperName").value;
            var newScraperUrl = document.getElementById("newExternalScraperUrl").value;
            if (newScraperName.length > 0 && newScraperUrl.length > 0) {
                newScraperUrl = "https://googledrive.com/host/" + newScraperUrl;
                externalScraperList.push({name:newScraperName, url:newScraperUrl});
                setData({externalScrapers: externalScraperList}, function () {
                    window.location.reload();   // Reload whole page since custom setting may need to be grabbed
                });
            }
        });
    });
}


////////////////////////////////////////////////////
// Loads the scrapper on/off toggles tab data
////////////////////////////////////////////////////
function loadScraperToggles(scrapers) {
    var scraperOnText = "&#9679;";
    var scraperOffText = "&#9675;";

     // Create a jqGrid table to hold the scraper toggles
    jQuery("#scraperToggles").jqGrid({
        datatype:"local",
        colNames:['Scraper Name','Status'],
        colModel:[
            {name:'scraperName',index:'scraperName', width:564, align:"left", sortable:false, resizable:false},
            {name:'status',index:'status', width:100, align:"center", sortable:false, resizable:false}
        ],
        height:"auto",
        width:674,
        shrinkToFit: false,
        scrollOffset: 21,
        caption: "Scraper Operational Status"
    });

    // Initialize scraper buttons to their current states
    getStoredData('scraperToggles', "dictionary", function(scraperToggles) {
        for (var entry in scrapers) {
            if (scrapers.hasOwnProperty(entry)) {
                // Get scraper name
                var scraperName = scrapers[entry].name;
                if (scrapers[entry].url) { scraperName = "External: " + scraperName; }

                // Get scraper activity state
                var scraperState = scraperOnText;
                if (scraperToggles[scrapers[entry].name] && scraperToggles[scrapers[entry].name] === "OFF") {
                    scraperState = scraperOffText;
                }

                // Add the scraper to the table
                var data = { scraperName:scraperName, status:"<button id='scraperToggle-" + scrapers[entry].name + "'>" + scraperState + "</button>" };
                $("#scraperToggles").addRowData("toggle-" + scraperName, data, "last");

                // Add scraper toggle button click handler
                $("button#scraperToggle-" + scrapers[entry].name).button().click(function() {
                    var self = this;
                    var scraperName = self.id.split("scraperToggle-")[1];

                    getStoredData('scraperToggles', "dictionary", function(scraperToggles) {
                        // Flip the switch
                        var displayText = "";
                        if (!scraperToggles[scraperName] || scraperToggles[scraperName] === "ON") {
                            scraperToggles[scraperName] = "OFF";
                            displayText = scraperOffText;
                        } else {
                            scraperToggles[scraperName] = "ON";
                            displayText = scraperOnText;
                        }

                        // Store the changed settings
                        setData({scraperToggles: scraperToggles}, function() {
                            // Display the setting change
                            $(self).button('option', 'label', displayText);
                        });
                    });
                });
            }
        }
    });
}


////////////////////////////////////////////////////
// Loads the hidden uri tab data
////////////////////////////////////////////////////
function loadHiddenUris() {
    // Create a jqGrid table
    jQuery("#hiddenUris").jqGrid({
        datatype:"local",
        colNames:['URI','Date Hidden', 'Redisplay'],
        colModel:[
            {name:'uri',index:'uri', width:459, align:"left", sortable:false, resizable:false},
            {name:'dateHidden',index:'dateHidden', width:100, align:"left", sortable:false, resizable:false},
            {name:'redisplay',index:'redisplay', width:100, align:"center", sortable:false, resizable:false}
        ],
        height:"auto",
        width:674,
        shrinkToFit: false,
        scrollOffset: 21,
        caption: "Currently Hidden Dashboard URIs"
    });

    // Add a list of all the URIs the user currently is hiding
    getStoredData('hiddenUriList', "list", function(uriList) {
        // Display the hidden URIs in the table
        for (var j = uriList.length; j-- > 0;) {
            // Remove the entry if the entry is older than a week
            if (new Date().getTime() - uriList[j].time > 604800000) {
                uriList.remove(j);

            // Show the row if the entry is less than a week old
            } else {
                addHiddenUri(uriList[j].uri, new Date(uriList[j].time).toDateString());
            }
        }

        // Remove the no URI message if there are any URIs
        if (uriList.length > 0) {
            removeElement(document.getElementById("hiddenUrisNoUrisMessage"));
        }

        // Update the storage in case entries were removed
        setData({hiddenUriList: uriList});

        // Add the button click listeners
        $("button.show-dashboard-row").button().click(function() {
            var self = this;
            var uri = self.value;
            getStoredData('hiddenUriList', "list", function(uriList) {
                for (var entry in uriList) {
                    if (uriList.hasOwnProperty(entry)) {
                        if (uriList[entry]['uri'] === self.value) { delete uriList[entry] }
                    }
                }
                // Save the updated list
                setData({hiddenUriList: uriList});
            });

            // Remove the row from the page
            removeElement(self.parentNode.parentNode);
        });
    });


    // Displays the given hidden URI in the hidden URI table with a new row
    function addHiddenUri(uri, dateHidden) {
        var data = {
            uri:uri,
            dateHidden:dateHidden,
            redisplay:"<button class='show-dashboard-row' value='" + uri + "'>Redisplay</button>"
        };
        $("#hiddenUris").addRowData("hide-" + uri, data, "last");
    }
}


////////////////////////////////////////////////////
// Loads tab data for settings defined in a scraper
////////////////////////////////////////////////////
function loadCustomSettings(scrapers) {

    // Add tables for all the scrapers' custom settings
    for (var entry in scrapers) {
        if (scrapers.hasOwnProperty(entry)) {
            loadScraper(scrapers[entry], function(scraper){
                scraper.getSettings(function(settings){
                    var hasValue = false;

                    // Create the table
                    var customSettingsTable = document.createElement("table");
                    customSettingsTable.setAttribute("id", scraper.name() + "Settings");
                    for (var setting in settings) {
                        if (settings.hasOwnProperty(setting)) {
                            customSettingsTable.innerHTML += "<tr><td>" + setting.replace(/_/g, " ") + "</td><td><input type='text' name='" + setting + "' value='" + settings[setting] + "' class='" + scraper.name() + "Setting' /></td></tr>";
                            hasValue = true;
                        }
                    }

                    if (hasValue) {
                        customSettingsTable.innerHTML += "<tfoot><tr><td colspan='2'><button id='save-" + scraper.name() + "'>Save</button></td></tr></tfoot>";
                        document.getElementById("custom-settings").innerHTML += "<h3>" + scraper.name() + " Settings</h3><div>" + customSettingsTable.outerHTML + "</div>";

                        // Add handler for saving the settings
                        $(document).on('click', "button#save-" + scraper.name(), function() {
                            var displayedSettings = document.getElementsByClassName(scraper.name() + "Setting");
                            var newSettings = {};
                            for (var row in displayedSettings) {
                                if (displayedSettings.hasOwnProperty(row)) {
                                    newSettings[displayedSettings[row].name] = displayedSettings[row].value;
                                }
                            }
                            var dic = {};
                            var dicKey = scraper.name()+"Settings";
                            dic[dicKey] = newSettings;
                            setData(dic, function () {
                                setTimeout(function() { $("#custom-settings button#save-" + scraper.name()).blur();}, 2000);
                            });
                        });

                        // Style input fields
                        $("input:text").button().addClass("input-text");
                        $("#custom-settings button#save-" + scraper.name()).button();
                        $("#custom-settings").accordion("refresh");
                    }
                });
            })
        }
    }
}