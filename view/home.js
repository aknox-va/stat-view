var METHOD = "addData";


// Set the appId
var appId = "";
var urlParam = document.location.href.split("?")[1].split("=");
if (urlParam[0] == "appId") {
    var header = document.getElementsByTagName("header")[0];
    appId = urlParam[1];
    header.innerHTML = header.innerHTML + " : " + appId;

    // dashboard/stats return json so it can't be handled by the background script
    getImageFromJson("7 Day Error Details Chart", "https://appengine.google.com/dashboard/stats?type=4&window=7&app_id=s~" + appId);
    getImageFromJson("7 Day Memory Usage Chart (MB)", "https://appengine.google.com/dashboard/stats?type=9&window=7&app_id=s~" + appId);
}


// Handler that adds a given table to the page if the data is for this appId
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        if(message.method == METHOD && message.appId == appId){
            var newContent = document.createElement("table");
            newContent.innerHTML = message.data;

            var body = document.getElementsByTagName("body")[0];
            body.appendChild(newContent);

            // adds the handlers for the buttons that hide rows and hide any rows the user doesn't want to see
            if(message.getDataMethod == "getDashboardErrors") {
                var buttons = document.querySelectorAll('.hide-dashboard-row')
                chrome.storage.local.get('hiddenUriList', function(result) {
                    var uriList = result.hiddenUriList;

                    for (var i = buttons.length; i-- > 0;) {
                        var hid = false;
                        if (uriList != null) {
                            for (var j = uriList.length; j-- > 0 && hid == false;) {
                                // If the row is in the hide list then potentially hide it
                                if (uriList[j].uri == buttons[i].value) {
                                    // Remove the entry if the entry is older than a week
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
    }
);


// removes the given element from the page
function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
}


// produces an html image from a gae dashboard/stats json file containing a url
function getImageFromJson(name, url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var newContent = document.createElement("table");
            newContent.innerHTML = "<caption>" + name + "</caption><img src='" + JSON.parse(xhr.responseText).chart_url + "' />";

            var body = document.getElementsByTagName("body")[0];
            body.appendChild(newContent);
        }
    }
    xhr.send();
}