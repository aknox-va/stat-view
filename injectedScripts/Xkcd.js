var METHOD = "getXkcd";


// grab the wanted html from the page and send the parsed data to the background script
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.method == METHOD){
            // Get the xkcd image
            var image = document.getElementById("comic").innerHTML;

            // Return the html string
            sendResponse({data: "<caption>Today's XKCD Comic</caption>" + image, method: METHOD});
        }
    }
);