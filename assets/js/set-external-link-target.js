---
layout: blank
---

/*
* set-external-link-target.js
* Sean Murthy
*
* Change the target attribute of external links to "_blank" and add a title and image
* to inform the user that links open in a new tab
* - include only links attached to "a" element
* - exclude links that already have a target (to allow customization in source)
*
* Function setExternalLinkTarget is expected to be called at document onload 
*
* Core solution of identifying external links from: https://stackoverflow.com/a/4425214
*/

function setExternalLinkTarget() {
    var new_window_image_path = "{{ '/assets/images/external.png' | relative_url }}";
    var new_window_image_html = '<img class="external" src="' + new_window_image_path + '"/>';
    var links = document.links;
    var host_name = window.location.hostname;
    
    for (var i = 0, linksLength = links.length; i < linksLength; i++) {
        var link = links[i];
        if (link.tagName == 'A' && link.hostname != host_name && link.target.length == 0) {
            link.target = '_blank';
            link.title = 'Opens in new tab';
            link.innerHTML += " <sup>&nearr;</sup>";
       }
    }
}
