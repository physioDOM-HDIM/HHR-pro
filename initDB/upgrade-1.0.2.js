
db.dataRecordItems.update( { "category" : /general/i }, { $set: { category:"measures"} }, { multi:true } );
db.dataRecordItems.update( { "category" : /hdim/i }, { $set: { category:"measures"} }, { multi:true } );

var alertRight = {
	"rights" : {
		"administrator" : 2,
		"coordinator" : 2,
		"social" : 0,
		"physician" : 2,
		"medical" : 0,
		"beneficiary" : 0
	},
	"label" : "Alert"
}

db.specialRights.save( alertRight );
