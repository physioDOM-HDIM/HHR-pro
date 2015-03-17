/**
 * @file ILists.js
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

var Logger = require("logger");
var logger = new Logger("IList");

/**
 * IList
 *
 * treat http request about lists
 *
 * @type {{getLists: Function, getList: Function, getListTranslate: Function, addItem: Function, translateItem: Function, activateItem: Function}}
 */
var ILists = {

	getLists: function(req, res, next) {
		logger.trace("getLists");
		physioDOM.Lists.getLists()
			.then(function(lists) {
				res.send(200, lists);
				next();
			});
	},

	getList: function(req, res, next) {
		logger.trace("getList");
		physioDOM.Lists.getList(req.params.listName)
			.then(function(list) {
				res.send(list);
				next();
			})
			.catch(function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * retrieve list from its name, and return the associative array with ref property as key
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getListArray: function(req, res, next) {
		logger.trace("getListArray");
		physioDOM.Lists.getListArray(req.params.listName)
			.then(function(list) {
				res.send(list);
				next();
			})
			.catch(function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getListTranslate: function(req, res, next) {
		physioDOM.Lists.getList(req.params.listName)
			.then(function(list) {
				return list.lang(req.session.lang || req.params.lang || physioDOM.lang);
			})
			.then(function(list) {
				res.send(list);
				next();
			})
			.catch(function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	updateList: function(req, res, next) {
		logger.trace("updateList");
		if (!req.body) {
			res.send(400, {
				error: "empty request"
			});
			return next(false);
		}
		if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
			res.send(403, {
				code: 403,
				message: "not authorized"
			});
			return next(false);
		}
		try {
			var updateData = JSON.parse(req.body);
			physioDOM.Lists.getList(req.params.listName)
				.then(function(list) {
					return list.update(updateData);
				})
				.then(function(list) {
					res.send(list);
					next();
				})
				.catch(function(err) {
					res.send(err.code || 400, err);
					next(false);
				});
		} catch (err) {
			res.send(400, {
				error: "bad json format"
			});
			next(false);
		}
	},

	addItem: function(req, res, next) {
		logger.trace("addItem");
		physioDOM.Lists.getList(req.params.listName)
			.then(function(list) {
				try {
					var item = JSON.parse(req.body);
					return list.addItem(item);
				} catch (err) {
					if (err.code) {
						throw err;
					} else {
						throw {
							code: 405,
							message: "not JSON format"
						};
					}
				}
			})
			.then(function(list) {
				res.send(list);
				next();
			})
			.catch(function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Add translation to a item of the list
	 *
	 * the list is known by its name given in the url ( req.params.listName )
	 * the item is known by its name given in the url ( req.params.itemRef )
	 *
	 * the translation are given as put parameter in JSON format
	 * ex : { "en":"administrator", "fr":"administrateur" }
	 *
	 * With this request you could rename the translation of an item
	 *
	 * nota : an item that has no translation isn't displayed in the specified language
	 *
	 * nota : you can change the translation of a term of a non editable list
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	translateItem: function(req, res, next) {
		logger.trace("translateItem ", req.params.itemRef);
		physioDOM.Lists.getList(req.params.listName)
			.then(function(list) {
				try {
					var translation = JSON.parse(req.body);
					list.translateItem(req.params.itemRef, translation)
						.then(function(list) {
							res.send(list);
							next();
						})
						.catch(function(err) {
							res.send(err.code || 400, err);
							next(false);
						});
				} catch (err) {
					if (err.code) {
						throw err;
					} else {
						throw {
							code: 405,
							message: "not JSON format"
						};
					}
				}
			})
			.catch(function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getItem: function( req, res, next) {
		logger.trace("getItem ", req.params.itemRef);
		physioDOM.Lists.getList(req.params.listName)
			.then( function(list) {
				return list.getItem( req.params.itemRef );
			})
			.then( function(item) {
				res.send(item);
				next();
			})
			.catch(function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	/**
	 * Request activate/deactivate an item
	 *
	 * the list is known by its name given in the url ( req.params.listName )
	 * the item is known by its name given in the url ( req.params.itemRef )
	 *
	 * the activation status is given as post parameter in JSON format
	 * ex : { "active":true }
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	activateItem: function(req, res, next) {
		logger.trace("activateItem ", req.params.itemRef);
		physioDOM.Lists.getList(req.params.listName)
			.then(function(list) {
				try {
					var activate = JSON.parse(req.body);
					list.activateItem(req.params.itemRef, activate)
						.then(function(list) {
							res.send(list);
							next();
						})
						.catch(function(err) {
							res.send(err.code || 400, err);
							next(false);
						});
				} catch (err) {
					if (err.code) {
						throw err;
					} else {
						throw {
							code: 405,
							message: "not JSON format"
						};
					}
				}
			})
			.catch(function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	}
};

module.exports = ILists;
