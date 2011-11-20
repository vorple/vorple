/**
    Vorple User Interface Library for Interactive Fiction
    =====================================================
    
    vorple.tabs.js - Menu tabs
    
    
Copyright (c) 2011 by Juhana Leinonen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**/

(function( $ ) {
    /** @namespace Menu tabs */
    vorple.tabs = {};
    
    /**
     * Creates a tab menu.
     * 
     * This method is a wrapper for jQuery.tabs().
     * 
     * @see http://jqueryui.com/demos/tabs/
     * 
     * @param {jQuery|string} element The element that holds the tab info
     * @param {object} [options] 
     */
    vorple.tabs.create = function( element, options ) {
        var $element = element;
        if( typeof element != 'object' || !element.jquery ) {
            $element = $( element );
        }
        
        if( !$.tabs ) {
            throw new Error( 'jQuery UI tabs is not installed' );
        }
        
        return $element.tabs();
    };
    
}( jQuery ) );
    