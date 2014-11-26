/**
 * @file IPage.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * IList
 *
 * treat http request about lists
 */

var swig = require("swig"),
    Logger = require("logger"),
    RSVP = require("rsvp"),
    promise = RSVP.Promise,
    moment = require("moment"),
    ObjectID = require("mongodb").ObjectID;
var logger = new Logger("IPage");
var i18n = new(require('i18n-2'))({
    // setup some locales - other locales default to the first locale
    devMode: true,
    locales: ["en", "es", "nl", "fr"]
});

/**
 * IPage
 *
 * IPage is the http interface that manages the urls of the pages seen in the browser
 *
 * @constructor
 */
function IPage() {
    var lang;

    function init(req) {
        lang = req.session.lang || req.cookies.lang || req.params.lang || "en";
        i18n.setLocale(lang);

        swig.setDefaults({
            cache: false
        });
        swig.setFilter("i18n", function(input, idx) {
            // console.log("input", input, idx);
            return i18n.__(input);
        });
    }

    function convertDate(strDate) {
        return strDate ? moment(strDate, "YYYY-MM-DD").format(moment.localeData(lang).longDateFormat("L")) : strDate;
    }

    /**
     * Main Layout
     *
     * @param req
     * @param res
     * @param next
     */
    this.ui = function(req, res, next) {
        logger.trace("ui");
        var html;

        init(req);

        req.session.getPerson()
            .then(function(session) {
                logger.debug("person", session.person);
                var data = {
                    account: {
                        firstname: session.person.item.name.given.slice(0, 1).toUpperCase(),
                        lastname: session.person.item.name.family
                    }
                };
                html = swig.renderFile('./static/tpl/ui.htm', data, function(err, output) {
                    if (err) {
                        console.log("error", err);
                        console.log("output", output);
                        res.write(err);
                        res.end();
                        next();
                    } else {
                        sendPage(output, res, next);
                    }
                });
            });
    };

    function promiseList(listName) {
        return physioDOM.Lists.getList(listName, lang)
            .then(function(list) {
                var result = {};
                result[listName] = list;
                return result;
            })
            .catch(function() {
                var result = {};
                result[listName] = {};
                return result;
            });
    }

    /**
     * Directory list
     *
     * @param req
     * @param res
     * @param next
     */
    this.directoryList = function(req, res, next) {
        logger.trace("Directory List");
        var html;

        init(req);
        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };

        var promises = [
            "perimeter"
        ].map(promiseList);

        RSVP.all(promises)
            .then(function(lists) {
                lists.forEach(function(list) {
                    data[Object.keys(list)] = list[Object.keys(list)];
                });
                html = swig.renderFile('./static/tpl/directory.htm', data, function(err, output) {
                    if (err) {
                        console.log("error", err);
                        console.log("output", output);
                        res.write(err);
                        res.end();
                        next();
                    } else {
                        sendPage(output, res, next);
                    }
                });
            })
            .catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };

    /**
     * Directory Create and update
     *
     * @param req
     * @param res
     * @param next
     */
    this.directoryUpdate = function(req, res, next) {
        logger.trace("Directory update");
        var html;

        init(req);
        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };

        var promises = [
            "system",
            "role",
            "job",
            "communication"
        ].map(promiseList);

        RSVP.all(promises)
            .then(function(lists) {
                lists.forEach(function(list) {
                    data[Object.keys(list)] = list[Object.keys(list)];
                });
                return physioDOM.Directory();
            })
            .then(function(directory) {
                return directory.getAdminEntryByID(req.params.professionalID);
            })
            .then(function(professional) {
                logger.debug("data", JSON.stringify(data, null, 4));
                logger.debug("prof ", professional);
                if (professional) {
                    data.professional = professional;
                }
                html = swig.renderFile('./static/tpl/directoryUpdate.htm', data, function(err, output) {
                    if (err) {
                        console.log("error", err);
                        console.log("output", output);
                        res.write(err);
                        res.end();
                        next();
                    } else {
                        sendPage(output, res, next);
                    }
                });
            })
            .catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };

    /**
     * Beneficiary create and update
     *
     * @param req
     * @param res
     * @param next
     */
    this.beneficiaryCreate = function(req, res, next) {
        logger.trace("beneficiaryCreate");
        var html;

        init(req);

        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };

        var promises = [
            "system",
            "use",
            "wayOfLife",
            "maritalStatus",
            "communication",
            "profession",
            "perimeter"
        ].map(promiseList);

        RSVP.all(promises)
            .then(function(lists) {
                lists.forEach(function(list) {
                    data[Object.keys(list)] = list[Object.keys(list)];
                });
                return physioDOM.Beneficiaries();
            })
            .then(function(beneficiaries) {
                var beneficiaryID = req.params.beneficiaryID ? req.params.beneficiaryID : req.session.beneficiary;
                return beneficiaries.getBeneficiaryAdminByID(req.session, beneficiaryID);
            })
            .then(function(beneficiary) {
                // logger.debug("data", data);
                // logger.debug("bene ", beneficiary );
                if (beneficiary) {
                    data.beneficiary = beneficiary;
                    if (data.beneficiary.address) {
                        data.beneficiary.address.forEach(function(address) {
                            if (address.line && address.line.length > 0) {
                                //To display with line break in the textarea
                                address.line = address.line.join("\n");
                            }
                        });
                    }

                    //Format date to follow the locale
                    data.beneficiary.birthdate = convertDate(data.beneficiary.birthdate);
                    if (data.beneficiary.entry) {
                        data.beneficiary.entry.startDate = convertDate(data.beneficiary.entry.startDate);
                        data.beneficiary.entry.plannedEnd = convertDate(data.beneficiary.entry.plannedEnd);
                        data.beneficiary.entry.endDate = convertDate(data.beneficiary.entry.endDate);
                    }
                }

                return beneficiary._id ? beneficiary.getProfessionals() : null;
            }).then(function(professionals) {
                if (professionals) {
                    data.beneficiary.professionals = professionals;
                }

                html = swig.renderFile("./static/tpl/beneficiaryCreate.htm", data, function(err, output) {
                    if (err) {
                        console.log("error", err);
                        console.log("output", output);
                        res.write(err);
                        res.end();
                        next();
                    } else {
                        sendPage(output, res, next);
                    }
                });
            })
            .catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };

    /**
     * get the beneficiaries list
     *
     * @param req
     * @param res
     * @param next
     */
    this.beneficiaries = function(req, res, next) {
        logger.trace("beneficiarySelect");
        var html;

        init(req);
        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };
        physioDOM.Lists.getList("perimeter", lang)
            .then(function(list) {
                if (list) {
                    data.perimeter = list;
                }

                html = swig.renderFile('./static/tpl/beneficiaries.htm', data, function(err, output) {
                    if (err) {
                        console.log("error", err);
                        console.log("output", output);
                        res.write(err);
                        res.end();
                        next();
                    } else {
                        sendPage(output, res, next);
                    }
                });
            })
            .catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };

    /**
     * Beneficiary overview
     *
     * @param req
     * @param res
     * @param next
     */
    this.beneficiaryOverview = function(req, res, next) {
        logger.trace("beneficiaryOverview");
        var html;
        init(req);
        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };
        if (req.params.beneficiaryID !== "overview") {
            req.session.beneficiary = new ObjectID(req.params.beneficiaryID);
        }
        req.session.save()
            .then(function(session) {
                return physioDOM.Beneficiaries();
            })
            .then(function(beneficiaries) {
                return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
            })
            .then(function(beneficiary) {
                data.beneficiary = beneficiary;
                html = swig.renderFile('./static/tpl/beneficiaryOverview.htm', data, function(err, output) {
                    if (err) {
                        console.log("error", err);
                        console.log("output", output);
                        res.write(err);
                        res.end();
                        next();
                    } else {
                        sendPage(output, res, next);
                    }
                });
            })
            .catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };

    /**
     * Lists manager
     *
     * @param req
     * @param res
     * @param next
     */
    this.listsManager = function(req, res, next) {
        logger.trace("listsManager");
        var html;

        init(req);
        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };
        
        // nested lists
        var promises = [
            "unity",
            "job"
        ].map(promiseList);

        RSVP.all(promises)
            .then(function(lists) {
                lists.forEach(function(list) {
                    data[Object.keys(list)] = list[Object.keys(list)];
                });
                
                physioDOM.Lists.getLists(1, 100, true)
                    .then(function(lists) {
                        data.lists = lists;
                        data.lang = lang;
                        // logger.debug("DATA", data);

                        html = swig.renderFile('./static/tpl/listsManager1.htm', data, function(err, output) {
                            if (err) {
                                console.log("error", err);
                                console.log("output", output);
                                res.write(err);
                                res.end();
                                next();
                            } else {
                                sendPage(output, res, next);
                            }
                        });
                    });
            }).catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };

    /**
     * return the lists page
     *
     * @param req
     * @param res
     * @param next
     */
    this.lists = function(req, res, next) {
        logger.trace("lists");
        var html;

        init(req);
        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };

        var promises = [
            "communication",
            "unity",
            "job"
        ].map(promiseList);

        RSVP.all(promises)
            .then(function(lists) {
                lists.forEach(function (list) {
                    data[Object.keys(list)] = list[Object.keys(list)];
                });
                
                physioDOM.Lists.getLists(1, 100, true)
                    .then(function (lists) {
                        data.lists = lists;
                        data.lang = lang;
                        //logger.debug("DATA", data);

                        html = swig.renderFile('./static/tpl/lists.htm', data, function (err, output) {
                            if (err) {
                                console.log("error", err);
                                console.log("output", output);
                                res.write(err);
                                res.end();
                                next();
                            } else {
                                sendPage(output, res, next);
                            }
                        });
                    });
            })
            .catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };

    /**
     * return a list page
     * 
     * the list name is given by req.params.listName
     *
     * @param req
     * @param res
     * @param next
     */
    this.list = function(req, res, next) {
        logger.trace("lists");
        var html;

        init(req);
        var data = {
            admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
        };

        var promises = [
            "communication",
            "unity",
            "job"
        ].map(promiseList);

        RSVP.all(promises)
            .then(function(lists) {
                lists.forEach(function (list) {
                    data[Object.keys(list)] = list[Object.keys(list)];
                });

                physioDOM.Lists.getList(req.params.listName)
                    .then(function (list) {
                        data.list = list;
                        data.lang = lang;
                        logger.debug("DATA", data);

                        html = swig.renderFile('./static/tpl/list.htm', data, function (err, output) {
                            if (err) {
                                console.log("error", err);
                                console.log("output", output);
                                res.write(err);
                                res.end();
                                next();
                            } else {
                                sendPage(output, res, next);
                            }
                        });
                    });
            })
            .catch(function(err) {
                logger.error(err);
                res.write(err);
                res.end();
                next();
            });
    };
    
    /**
     * Send the page to the browser
     *
     * The html code of the page is in `html`
     *
     * @param html
     * @param res
     * @param next
     */
    function sendPage(html, res, next) {
        logger.trace("sendPage");
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(html),
            'Content-Type': 'text/html'
        });

        res.write(html);
        res.end();
        next();
    }
}

module.exports = new IPage();
