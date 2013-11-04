stat-view
=========

a google app engine administration panel information filter and aggregator

Adding a new scraper steps
1. make sure the url is in the manifest under 'permissions'
2. add an entry to the htmlScrapers associative array in domain/scraper_list.js with the key being the url to scrape and the value being the name of the scraper function/file
3. create a javascript file in the domain folder and give it the name you specified in scraper_list.js. Now create a function in the file with the same name and follow the template in scraper_list.js
4. implement the parsing code in the new scraper function