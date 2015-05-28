db.dataRecordItems.update( { category:'General' }, { $set: { category:"measures" } },{ multi: true });
db.dataRecordItems.update( { category:'HDIM' }, { $set: { category:"measures" } },{ multi: true });

// remove dataRecordItems that
db.dataRecordItems.find().forEach( function(item) { 
	var dataRecord = db.dataRecords.findOne( { _id:item.dataRecordID }); 
	if(!dataRecord) { 
		db.dataRecordItems.remove( { _id: item._id } );
	} 
});// remove from database all questionnaire plan that have no date
db.questionnairePlan.remove( { date: { $exists: 0 }, date: null } );
db.questionnairePlan.remove( { date: { $exists: 0 }, date: [] } );
