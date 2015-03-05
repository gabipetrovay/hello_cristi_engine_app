/**
 * Activate a state.
 *
 * @public
 * @param {object} The event object.
 * @param {object} The data object.
*/
exports.state = function (event, data) {

    // check if state exists
    if (this.states[data.name]) {

        // activate state elements
        for (var i = 0, state, selector; i < this.states[data.name].length; ++i) {
            state = this.states[data.name][i];

            // get dynamic or static selector
            if (!(selector = state.sel || data.selector) || !this.tmpl) {

                // retrun if no selector is found
                return;
            }

            // auto hide pages before activate a state
            if (this.tmpl.page && !data.noPaging) {

                // add "hide" class to all pages
                manipulateClasses(
                  (this.tmpl.to || document).querySelectorAll('.' + this.tmpl.page),
                  {add: ['hide']}
                );
            }

            // manipulate classes
            manipulateClasses((this.tmpl.to || document).querySelectorAll(selector), state);
        }
    }
};

/**
 * Manipulate css classes (add, rm, toggle).
 *
 * @private
 * @param {object} The event object.
 * @param {object} The data object.
*/
function manipulateClasses (elms, state) {

    // manipulate classes
    for (var i = 0; i < elms.length; ++i) {

        // remove classes
        state.rm && elms[i].classList.remove.apply(elms[i].classList, state.rm);

        // add classes
        state.add && elms[i].classList.add.apply(elms[i].classList, state.add);

        // toggle classes
        state.toggle && elms[i].classList.toggle.apply(elms[i].classList, state.toggle);
    }
}
