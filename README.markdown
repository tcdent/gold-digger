Gold Digger Color Picker
========================
(c) 2010 Travis Dent <tcdent@gmail.com>

Syntax
------
    GoldDigger.attach(element, [options]);

Usage
-----
Include the JavaScript and CSS along with Prototype and Scriptaculous. Initialize like so:

    document.observe('dom:loaded', function(){
        GoldDigger.attach('.color');
    });

Element selectors are pretty flexible:
    
    // Single element by id:
    GoldDigger.attach('color1');
    
    // Multiple elements by id:
    GoldDigger.attach('#color1, #color2, #color3');
    GoldDigger.attach(['color1', 'color2', 'color3']);
    
    // Multiple elements by class:
    GoldDigger.attach('.color');
    
    // Multiple elements by type:
    GoldDigger.attach('input[type=text]');

Configuration Options
---------------------
**auto_update**: boolean, defaults to `true`. When `false`, element value will only be updated when OK button has been clicked.  
**offset_top**: integer, defaults to `0`. Distance in pixels to position the modal from the top of the element.  
**offset_left**: integer, defaults to `10`. Distance in pixels to position the modal from the right of the element.  

TODO
----
 - Update hue when slider is clicked, but not dragged.
 - Sense right edge of window and reposition accordingly.
 - Internet Explorer compatibility.