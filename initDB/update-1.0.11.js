/**
 update version 1.0.11
 
 introduce a new field in dataRecordItems : measureDate, this field comes from data received from the SServer.
 As it was not stored, this script create a `measureDate` property from the current `datetime` of the record
*/

db.dataRecordItems.find().forEach( 
	function(item) {
		item.measureDate = Math.floor(ISODate(item.datetime).valueOf() / 1000);
		db.dataRecordItems.save(item);
	}
);