/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

'use strict';

// The `pathTo()` function is written in ES3 so it's serializable and able to
// run in all JavaScript environments.
module.exports = function pathTo(routeMap) {
    return function (routeName, context) {
        var route = routeMap[routeName],
            path, keys, i, len, key, param, regex;

        if (!route) { return ''; }

        // TMN Specific
        // apply site option if not specified.
        if(context && !context.site){
            try{
                var isServer = typeof window === "undefined";

                if(isServer){
                    context.site = global.appConfig.app.sport;
                } else {
                    context.site = window.TMNState.site;
                }
            } catch(e){
                console.error("Failed to apply missing site param to pathTo", e);
            }
        }

        path = route.path;
        keys = route.keys;

        if (context && (len = keys.length)) {
            for (i = 0; i < len; i += 1) {
                key   = keys[i];
                param = key.name || key;
                regex = new RegExp('[:*]' + param + '\\b');
                path  = path.replace(regex, context[param]);
            }
        }

        // Replace missing params with empty strings.
        // pathTo is not correctly handling express optional parameters of the form /blogs/:id/:tag?
        // lop off the ? off the end of the result
        return path.replace(/([:*])([\w\-]+)?/g, '').replace(/[?]$/, '');
    };
};
