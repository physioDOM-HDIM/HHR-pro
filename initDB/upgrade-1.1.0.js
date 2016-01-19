// Change rights on menu entry : Agenda
rights = {
    "administrator" : 2,
    "coordinator" : 2,
    "socialworker" : 2,
    "physician" : 2,
    "beneficiary" : 1,
    "nurse" : 2
}
db.menus.update({"label" : "Agenda"}, { $set: { rights: rights } });

// Add 2 menu entries
db.menus.find( { index: { $gt:5 }, parent:null })
    .forEach( function(menu) { 
        menu.index+=2; db.menus.save(menu); 
    });

menu = {
	"rights" : {
		"administrator" : 2,
		"coordinator" : 2,
		"socialworker" : 1,
		"physician" : 1,
		"beneficiary" : 1,
		"nurse" : 1
	},
	"disabled" : true,
	"index" : 6,
	"label" : "Health services",
	"link" : "/services/health",
	"parent" : null,
	"type" : "item"
}
db.menus.save( menu );

menu = {
	"rights" : {
		"administrator" : 2,
		"coordinator" : 2,
		"socialworker" : 1,
		"physician" : 1,
		"beneficiary" : 1,
		"nurse" : 1
	},
	"disabled" : true,
	"index" : 7,
	"label" : "Social services",
	"link" : "/services/social",
	"parent" : null,
	"type" : "item"
}
db.menus.save( menu );
