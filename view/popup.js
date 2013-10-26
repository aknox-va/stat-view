var settingsTab = "view/settings.html";


if (!chrome.cookies) {
    chrome.cookies = chrome.experimental.cookies;
}


// Operations to run when the page data has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the user's appIds from storage and display buttons for them
    chrome.storage.local.get('appIdList', function(result) {
        if (result != null && result.appIdList != null) {
            var appIdButtons = document.getElementById("appIdButtons")
            for (var i = result.appIdList.length; i-- > 0;) {
                // Display a new button for the appId
                var appIdButton = document.createElement("button");
                appIdButton.innerHTML = result.appIdList[i];
                appIdButtons.appendChild(appIdButton);

                // Add event listener to button that will grab and display the data for that appId
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
            }
        }
    });

    // Make it so that the buttons in the popup will set the appropriate urls, then get the cookies from them
    var buttons = document.querySelectorAll('.appId')
    for (var i = buttons.length; i-- > 0;) {

    }

    // Add a listener for the settings button
    document.getElementById("settings").addEventListener('click',
        function() {
            chrome.tabs.getAllInWindow(null, function(tabs){
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
