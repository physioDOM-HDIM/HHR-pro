
db.dataRecordItems.update( { "category" : /general/i }, { $set: { category:"measures"} }, { multi:true } )
db.dataRecordItems.update( { "category" : /hdim/i }, { $set: { category:"measures"} }, { multi:true } )