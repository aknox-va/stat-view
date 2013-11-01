var settingsTab = "view/settings.html";

if (!chrome.cookies) {
    chrome.cookies = chrome.experimental.cookies;
}


// Operations to run when the page data has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the user's appIds from storage and display entrys for them
    chrome.storage.local.get('appIdList', function(result) {
        if (result && result.appIdList) {
            for (var i = result.appIdList.length; i-- > 0;) {
                addAppRow(result.appIdList[i]);
            }
        }
    });

    // Initialize general settings buttons
    chrome.storage.local.get('generalSettings', function(result) {
        var generalSettings = result.generalSettings;
        var buttons = document.getElementsByClassName("generalSettings");
        for (var j = buttons.length; j-- > 0;) {
            // Initialize the button setting
            if (buttons[j].id in generalSettings) {
                buttons[j].innerHTML = generalSettings[buttons[j].id];
            } else {
                buttons[j].innerHTML = "ON";
            }
        }
    });

    // Add general settings button handlers
    var buttons = document.getElementsByClassName("generalSettings");
    for (var j = buttons.length; j-- > 0;) {
        // Setup the button click listener
        buttons[j].addEventListener('click',
            function() {
                var self = this;
                chrome.storage.local.get('generalSettings', function(result) {
                    // Get the current settings
                    var generalSettings =  result.generalSettings;
                    // Flip the switch
                    if (generalSettings[self.id] == "ON") {
                        generalSettings[self.id] = "OFF";
                    } else {
                        generalSettings[self.id] = "ON";
                    }
                    // Display the setting change
                    self.innerHTML = generalSettings[self.id];
                    // Store the changed settings
                    chrome.storage.local.set({generalSettings: generalSettings});
                });
            }
        );
    }

    // Add other general settings handlers


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
                    row.innerHTML = "<td>" + uriList[j].uri + "</td><td>" + new Date(uriList[j].time).toDateString() + "</td>";
                    hiddenUriTable.appendChild(row);
                }
            }
        }
    });




});


// Adds the given appId to the table of available apps, and sets up the button used to remove the entry
function addAppRow(appId) {
    var appIdTable = document.getElementById("appIds");
    // Display a new row for the appId
    var appRow = document.createElement("tr");
    appRow.setAttribute("id", "appList-" + appId);
    appRow.innerHTML = "<td>" + appId + "</td><td class='buttonCell'><button id='remove-" + appId + "'>Remove App</button></td>";
    appIdTable.appendChild(appRow);

    // Add event listener to the remove button
    var removeButton = document.getElementById("remove-" + appId);
    removeButton.addEventListener('click',
        function() {
            chrome.storage.local.get('appIdList', function(result) {

                // Stop displaying row in table
                var row = document.getElementById("appList-" + appId);
                row.parentNode.removeChild(row);

                // Remove appId from stored appId list
                var appIdIndex = result.appIdList.indexOf(appId);
                if (appIdIndex != -1) {
                    result.appIdList.splice(appIdIndex, 1);
                    chrome.storage.local.set({appIdList: result.appIdList});
                }
            });
        }
    );
}