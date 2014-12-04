define([
    "intern!object",
    "intern/chai!assert",
    "require"
], function (registerSuite, assert, require) {

    registerSuite({
        name: "login",

        "badLogin": function () {
            return this.remote
                .get(require.toUrl("index.htm"))
                .setFindTimeout(1000)
                .findById("login")
                    .click()
                    .type("archer")
                    .end()
                .findById("passwd")
                    .click()
                    .type("toto")
                    .end()
                .findByCssSelector("button.blue")
                    .click()
                    .end()
                .findByCssSelector("div.error")
                .getVisibleText()
                .then(function (text) {
                    assert.strictEqual(text, "Bad login or password",
                        "An error message must be displayed for error login");
                });
        },

        "goodLogin": function () {
            return this.remote
                .findById("login")
                    .click()
                    .clearValue()
                    .type("archer")
                    .end()
                .findById("passwd")
                    .click()
                    .clearValue()
                    .type("test")
                    .end()
                .findByCssSelector("button.blue")
                    .click()
                    .end()
                .getPageTitle()
                .then(function (text) {
                    assert.strictEqual(text, "PhysioDom professionnal platform",
                        "The good login must redirect to this page (main)");
                })
                .findByCssSelector("iframe[name='main']")
                .getAttribute("src")
                .then(function (text) {
                    assert.strictEqual(text, "/beneficiaries",
                        "The good login must redirect to this page (iframe)");
                });
        }
    });
});