// Operations to run when the page data has loaded
document.addEventListener('DOMContentLoaded', function() {
    getStoredData('appIdList', "list", function(appIdList) {
        // create a button for each appId
        var documentFragment = document.createDocumentFragment();
        for (var i = 0; i < appIdList.length; i++) {
            var appIdButton = document.createElement("button");
            appIdButton.innerHTML = appIdList[i];

            // Add the button to a fragment that will be added to the DOM when filled
            documentFragment.appendChild(appIdButton);
        }

        // Put all the appId buttons in the popup window
        document.body.appendChild(documentFragment);

        // Add click listeners to the buttons
        $("button:not(#settings)")
            .button()
            .click(function(event) {
                // Create the tab that will be used to show results (if it is already open, then reload it)
                var newTabUrl = "view/home.html?appId=" + this.innerText;
                chrome.tabs.getAllInWindow(null, function(tabs){
                    // Close any existing tabs pointing to this url
                    for (var i = 0; i < tabs.length; i++) {
                        if (tabs[i].url.indexOf(newTabUrl) != -1) { chrome.tabs.remove(tabs[i].id); }
                    }
                    // Create the data viewer tab
                    chrome.tabs.create({active: true, url: newTabUrl});
                });
            });
    });

    // Add a listener for the settings button
    $("button#settings").button().click(function() {
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
        });
    });
});