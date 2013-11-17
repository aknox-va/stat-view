// Operations to run when the page data has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the user's appIds from storage and display buttons for them
    chrome.storage.local.get('appIdList', function(result) {
        var appIdList = {};
        if (result && result.appIdList) { appIdList = result.appIdList; }
        var appIdListLength = appIdList.length;
        var documentFragment = document.createDocumentFragment();

        // show a button for each appId
        for (var i = 0; i < appIdListLength; i++) {
            // create a button for this appId
            var appIdButton = document.createElement("button");
            appIdButton.innerHTML = result.appIdList[i];

            // Add event listener to button that will open a tab that will run the scrapers for that appId
            appIdButton.addEventListener('click',
                function() {
                    // Create the tab that will be used to show results (if it is already open, then reload it)
                    var newTabUrl = "view/home.html?appId=" + this.innerText;
                    chrome.tabs.getAllInWindow(null, function(tabs){
                        // Close any existing tabs pointing to this url
                        for (var i = 0; i < tabs.length; i++) {
                            if (tabs[i].url.indexOf(newTabUrl) != -1) {
                                chrome.tabs.remove(tabs[i].id);
                            }
                        }
                        // Create the data viewer tab
                        chrome.tabs.create({active: true, url: newTabUrl});
                    });
                }
             );

            // Add the button to a fragment that will be added to the DOM when filled
            documentFragment.appendChild(appIdButton);
        }

        // Put all the appId buttons in the popup window
        document.body.appendChild(documentFragment);
    });

    // Add a listener for the settings button
    document.getElementById("settings").addEventListener('click',
        function() {
            chrome.tabs.getAllInWindow(null, function(tabs){
                var settingsTab = "view/settings.html";
                // Close any existing tabs pointing to this url
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].url.indexOf(settingsTab) != -1) {
                        chrome.tabs.remove(tabs[i].id);
                    }
                }
                // Show the settings tab
                chrome.tabs.create({active: true, url: settingsTab});
            })
        }
    );
});
