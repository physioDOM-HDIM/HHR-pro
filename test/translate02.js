/* jshint node:true */

var I18n = require('i18n-2');

var i18n = new I18n({ locales: [ 'de' ] });

console.log(i18n);

Object.keys(i18n.locales).forEach( function(locale) {
	console.log("-----------------------------");
	i18n.setLocale(locale);
	console.log( "locale "+i18n.getLocale() );
	console.log( i18n.__('Hello') );
	console.log(i18n.__n('%s cat', '%s cats', 1));
	console.log(i18n.__n('%s cat', '%s cats', 3));
	console.log(i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 1, i18n.__('tree')));
	console.log(i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 3, i18n.__('tree')));
});
