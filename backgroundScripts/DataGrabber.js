// Listens for button clicks from the extension popup and uses the appId sent to kick off a data request
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.method == "runAnalysis") {
        new request(message.data);
    }
});


// Tries to get the needed cookies and send a data request to the server
function request(appId) {
    var self = this;
    this.appId = appId;
    this.dataLocations = new Array();
    this.htmlQueue = new Array();

    // Set the pages to grab stats from. Comment out a line to not fetch data for that url
    this.dataLocations[this.dataLocations.length] = {method: "getXkcd", url: "http://www.xkcd.com"};
    this.dataLocations[this.dataLocations.length] = {method: "getDatastoreAdmin", url: "https://ah-builtin-python-bundle-dot-" + this.appId + ".appspot.com/_ah/datastore_admin/?app_id=s~" + this.appId + "&adminconsolecustompage"};
    this.dataLocations[this.dataLocations.length] = {method: "getCronJobs", url: "https://appengine.google.com/cron?app_id=s~" + this.appId};
    this.dataLocations[this.dataLocations.length] = {method: "getTaskQueues", url: "https://appengine.google.com/queues?app_id=s~" + this.appId};
    this.dataLocations[this.dataLocations.length] = {method: "getDashboardErrors", url: "https://appengine.google.com/dashboard?app_id=s~" + this.appId};
    this.dataLocations[this.dataLocations.length] = {method: "getLogData", url: "https://appengine.google.com/logs?app_id=s~" + this.appId + "&severity_level_override=0&severity_level=3&limit=200"};

    // When this variable is zero, then processing will complete (unless timeout is hit first)
    this.pagesNotYetParsed = this.dataLocations.length;

    // Grab stats from each page
    for (var i = this.dataLocations.length; i-- > 0;) {
        getTabData(this, this.dataLocations[i]);
    }

    // Start trying to populate the view results tab with the processed data
    setTimeout(checkForResults(self, 60),1000);
}


function checkForResults(self, retriesLeft) {
    if (retriesLeft > 0) {
        while (self.htmlQueue.length > 0) {
            var entry = self.htmlQueue.pop();
            if (entry != null) {
                self.pagesNotYetParsed--;
                chrome.runtime.sendMessage({method: 'addData', data: entry.data, appId: self.appId, getDataMethod: entry.getDataMethod});
            }
        }

        // Still waiting for some data so check back for it later
        if (self.pagesNotYetParsed > 0) {
            setTimeout(function(){checkForResults(self, --retriesLeft)},1000);
        }
    }
}


// Opens the url of the given page in a new tab, then when it loads a request for the data is made.
// When the data is received it is added to the array of data that needs to be added to the display page
function getTabData(self, page) {
    // Open the page in a new tab to generate the data
    chrome.tabs.create({
        active: false,
        url: page.url
    }, function(newTab) {
        // when the tab is created, add a listener to grab the data once the page has loaded
        chrome.tabs.onUpdated.addListener(function( tabId , info , tab) {
            if (info.status == "complete" && tabId == newTab.id) {
                // Get the body html from the page using injected js
                chrome.tabs.sendRequest(tabId, {method: page.method}, function(response) {
                    if(response.method == page.method){
                        // Save the data
                        self.htmlQueue[self.htmlQueue.length] = {getDataMethod: response.method, data:response.data};

                        // Don't need this tab anymore so remove it
                        chrome.tabs.remove(tabId);
                    }
                });
            }
        });
    });
}