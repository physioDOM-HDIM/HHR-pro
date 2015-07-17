var warning = { 
	status : false, 
	source: null, 
	date: null
}
db.beneficiaries.update( { warning: { $exists : 0 } }, { $set : { warning: warning } }, { multi: true } )