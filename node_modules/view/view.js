
var engine = E;
var state = require('./state');

var template_escape = {"\\": "\\\\", "\n": "\\n", "\r": "\\r", "'": "\\'"};
var render_escape = {'&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'};

exports.state = state.state;

/**
 * Initialize the View module instance.
 *
 * @public
*/
exports.init = function () {
    var self = this;

    // set document title
    if (self._config.title) {
        document.title = self._config.title;
    }

    // create and render the template
    if (self._config.template) {

        var tmpl = self._config.template;

        self.tmpl = {
            'to': tmpl.to,
            'e': tmpl.dontEscape,
            'k': tmpl.leaveKeys,
            'f': default_escape_fn
        };

        // add page selector to template
        if (tmpl.pages) {
            self.tmpl.page = '_page_' + self._name;
        }

        // get data handler methods
        self.tmpl.handlers = {};
        if (tmpl.on) {
            for (var name in tmpl.on) {
                self.tmpl.handlers[name] = engine.path(tmpl.on[name], self);
            }
        }

        // create template function
        self.tmpl.render = createTemplate(engine.htmls[tmpl.html]);

        // auto render template
        if (tmpl.render) {
            self.render({});
        }
    }

    // setup states
    if (self._config.states) {

        // create states cache
        self.states = {};

        // sage state in cache
        for (var stateName in self._config.states) {
            self.states[stateName] = self._config.states[stateName];
        }
    }
}

/**
 * Render data to the HTML template.
 *
 * @public
 * @param {object} The event object.
 * @param {object} The data object.
*/
exports.render = function (event, data) {

    data = data || {};

    var self = this;
    var dontEscape = data.dontEscape;
    var leaveKeys = data.leaveKeys;
    var dontAppend = data.dontAppend;
    var template;

    // check if template exists
    if (!(template = self.tmpl)) {
        return;
    }

    // preare render data
    template.data = data = data.data || [{}];

    // push a single item to an array
    if (!(data instanceof Array)) {
        data = [data];
    }

    // reset html
    template.html = '';

    // render data
    for (var i = 0, rData; i < data.length; ++i) {

        // render page class name
        if (template.page) {
            data[i].page = template.page;
        }

        // change data before it gets rendered to the html
        if (typeof template.handlers.data === 'function') {
            data[i] = template.handlers.data.call(self, data[i]);
        }

        // create html
        template.html += template.render(data[i], dontEscape, leaveKeys);
    }

    // change html before writing it to the dom
    if (typeof template.handlers.html === 'function') {
        template.html = template.handlers.html(template.html);
    }

    // get dom parent
    if (typeof template.to === 'string') {
        template.to = document.querySelector(template.to);
    }

    // render html
    if (!dontAppend && template.to) {
        template.to.innerHTML = template.html;
    }

    // append dom events
    if (self._extFlow) {
        setupDomEventFlow(self);
    }

    // change html before writing it to the dom
    if (typeof template.handlers.done === 'function') {
        template.handlers.done(self);
    }

    /**
     * This event is emitted, after successfull rendering.
     *
     * @event jillix/layout#renderDone
     * @type {object}
     */
    self.emit('renderDone', event, data);
};

/**
 * Escape html chars.
 *
 * @private
 * @param {object} The template object.
 * @param {object} The data object.
 * @param {string} The data key.
*/
function default_escape_fn (data, key, dont_escape_html, leaveKeys) {

    // get options
    dont_escape_html = dont_escape_html || this.e;
    leaveKeys = leaveKeys || this.k;

    // get the string value
    str = key.indexOf('.') > 0 ? engine.path(key, data) : data[key];

    // if str is null or undefined
    str = str == null ? (leaveKeys ? key : '') : str;

    // render a nested view
    if (typeof str === 'object' && this.nested && this._.view[this.nested[key]]) {
        var tmpl = this.tmpls[this.nested[key]];

        // render nested view and don't append to the dom
        tmpl.render && tmpl.render(str, dont_escape_html, leaveKeys, true);

        // get html of rendered view
        str = tmpl.html || '';

        // don't escape html chars
        dont_escape_html = true;

    // make sure str is a string
    } else {
        str += '';
    }

    // escape html chars
    if (!dont_escape_html) {
        return str.replace(/[&\"<>]/g, function(_char) {
            return render_escape[_char];
        });
    }

    return str;
}

/**
 * Create a template function.
 * Heavily inspired by the https://github.com/muut/riotjs render method.
 *
 * @private
 * @param {string} The HTML string.
*/
function createTemplate (tmpl) {
    return new Function("_", "e", "k", "_=_||{};return '" +
        (tmpl || '').replace(/[\\\n\r']/g, function(_char) {
            return template_escape[_char];
        }).replace(/{\s*([\w\.]+)\s*}/g, "' + this.f(_,'$1',e,k) + '") + "'"
    );
}

/**
 * Setup the user (DOM) event flow.
 *
 * @private
 * @param {object} The moule instnace.
*/
function setupDomEventFlow (module_instance) {

    var domScope = module_instance.tmpl.to;
    var data = module_instance.tmpl.data;
    var scope = [domScope];

    // set children as scope if there is more then one data item
    if (domScope && data.length > 1 && domScope.children) {
        scope = domScope.children;
    }

    for (var i = 0, flow; i < module_instance._extFlow.length; ++i) {
        flow = module_instance._extFlow[i];

        // overwrite scope with the document
        if (flow.scope === 'global') {
            scope = [document];
        }

        // overwrite scope with parent
        if (flow.scope === 'parent') {
            scope = [domScope];
        }

        for (var s = 0, elms; s < scope.length; ++s) {
            elms = flow.selector === '.' ? [scope[s]] : scope[s].querySelectorAll(flow.selector);
            if (elms) {
                for (var e = 0; e < elms.length; ++e) {

                    elms[e].addEventListener(
                        flow['in'],
                        engine.flow(
                            module_instance,
                            flow.out,
                            {
                                handler: domEventAdapter,
                                data: {
                                    scope: scope[s],
                                    data: data[s],
                                    elms: elms,
                                    dontPrevent: flow.dontPrevent
                                }
                            }
                        )
                    );
                }
            }
        }
    }
}

/**
 * Extend the event object with DOM scope, elements and the data item,
 * which was rendered with to the scope.
 *
 * @private
 * @param {object} The event object.
 * @param {object} The DOM data.
 */
function domEventAdapter (event, domContext) {

    // add dom scope to event
    event._scope = event._scope || domContext.scope;

    // dont prevent default browser actions
    if (!domContext.dontPrevent) {
        event.preventDefault();
    }

    // add found elements to event
    event._elms = domContext.elms;

    // add index of found elements
    event._item = event._item || domContext.data;
}
