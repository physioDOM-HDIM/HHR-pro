define([
    'intern!object',
    'intern/chai!assert',
    'require'
], function (registerSuite, assert, require) {

    registerSuite({
        name: 'login',

        'test1': function () {
            return this.remote
                .get(require.toUrl('index.htm'))
                .setFindTimeout(1000)
                .findByCssSelector('button.blue')
                .getVisibleText()
                .then(function (text) {
                    assert.strictEqual(text, 'Sign in',
                        'Button text must have a label');
                });
        }
    });
});