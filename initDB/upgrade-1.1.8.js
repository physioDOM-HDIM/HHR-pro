
db.menus.update( { label: /directory/i }, { $set: { index:10 } } );

var menuEntry = {
	"rights" : {
		"coordinator" : 2,
		"administrator" : 2,
		"socialworker" : 0,
		"physician" : 1,
		"beneficiary" : 1,
		"nurse" : 1
	},
	"disabled" : false,
	"index" : 9,
	"label" : "Message to beneficiaries",
	"link" : "/message/list",
	"parent" : null,
	"type" : "item"
};

db.menus.save(menuEntry);