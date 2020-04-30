/*
* tabbify-external-links.js
* Sean Murthy
*
* Change the target attribute of all external links to "_blank"
* - exclude links that already have a target (to allow customization in source)
*
* Include this script after html body so that all links are examined (at once) 
*
* Solution source: https://stackoverflow.com/a/4425214
*/

var links = document.links;

for (var i = 0, linksLength = links.length; i < linksLength; i++) {
   if (links[i].hostname != window.location.hostname && links[i].target.length == 0) {
       links[i].target = '_blank';
   } 
}