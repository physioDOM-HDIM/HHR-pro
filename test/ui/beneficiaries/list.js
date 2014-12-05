define([
    "intern!object",
    "intern/chai!assert"
], function (registerSuite, assert) {

    registerSuite({
        name: "LIST",

        "listBeneficiary": function () {
            return this.remote
                .switchToFrame("main")
                .findByCssSelector("#tsanteList .item .row span")
                .getVisibleText()
                .then(function (text){
                    assert.strictEqual(text, "Amendola Tony",
                        "At least a beneficiary must be present");
                });
        },

        //WORKS WITH CHROME BUT NOT WITH FIREFOX DUE TO SHADOW SELECTOR
        // "paginationBeneficiary": function () {
        //     return this.remote
        //         .findAllByCssSelector("#tsanteList::shadow #listPager::shadow #pages > *")
        //         .then(function (elt){
        //             assert.operator(elt.length, ">", 0,
        //                 "Must have more than 0 page");
        //         })
        // },

        "filterName": function () {
            return this.remote
                .findById("lastname")
                    .click()
                    .type("ba")
                    .pressKeys("") //enter key
                    .end()
                .findByCssSelector("#tsanteList .item .row span")
                .getVisibleText()
                .then(function (text){
                    assert.strictEqual(text, "Baccarin Morena",
                        "The filter must be applied to the list");
                });
        },

        "resetFilter": function () {
            return this.remote
                .findByCssSelector("form[name='filter'] .row.control button[type='button'].red")
                    .click()
                    .end()
                .findByCssSelector("#tsanteList .item .row span")
                .getVisibleText()
                .then(function (text){
                    assert.strictEqual(text, "Amendola Tony",
                        "The reset filter must retrieve the original list");
                });
        }
    });
});