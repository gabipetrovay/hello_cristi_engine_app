# view
A HTML and CSS renderer for jillix/engine.

####Client config example
```json
{
    "title": "Page title",
    "template": {
        "to": "#selector",
        "html": "/file.html",
        "render": true,
        "pages": true
    },
    "states": {
        "stateA": [{
            "sel": "#new",
            "rm": ["className"],
            "add": ["className"],
            "toggle": ["className"]
        }]
    }
}
```
Don't forget to load the HTML files in the module instance config.
Example:
```json
{
    "name": "my_view_module_instance",
    "module": "",
    "client": {
        "html": ["/file.html"]
    }
}
```
####Flow (out) usage
```js
engine.flow([
    {
        // call the state method
        "call": "state",
        // pass static data
        "data": {
            // the name of the state (states.stateName)
            "name": "stateA",
            // don't hide page elements
            "noPaging": true,
            // dynamic selector
            "selector": "#mainMenu-{_path.0}"
        }
    },
    {
        // call the render method
        "call": "render",
        // pass static data
        "data": {
            // the render data
            "data": [{}],
            // don't escape HTML chars
            "dontEscape": false,
            // don't append the rendered HTML to the DOM
            "dontAppend": false,
            // don't remove the data keys while rendering
            "leaveKeys": false
        }
    }
]);
```
####Public mehtods
* render (render data to a template)
* state (activate a state)
