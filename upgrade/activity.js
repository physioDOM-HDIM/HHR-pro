function questionnaire(name) {
	return {
		"name":name,
		"date":null,
		"score":null,
		"answerID":null,
		"comment":""
	};
}

function param() {
	return {
		"value":null, 
		"comment":"",
		"date":null
	};
}

function currentActivity() {
	return {
		name : 'activity',
		subject: null,
		validated: { 
			status: false, 
			author : null, 
			date: null 
		},
		parameters : { 
			"DIST": new param()
		},
	};
}

function transformDate( dat ) {
	return dat.slice(6)+"-"+dat.slice(3,5)+"-"+dat.slice(0,2);	
}

cursor = db.currentStatuses.find( { name:"activity" } );
while( cursor.hasNext() ) { 
    // get old record
    var tmp = cursor.next();
    var status = new currentActivity();
    status._id     = tmp._id;
    status.subject = tmp.subject;
	status.size = tmp.size;
    if( tmp.validated ) {
        status.validated.status = true,
        status.validated.author = tmp.validatedAuthor,
        status.validated.date = tmp.validatedDate
    }
    if( tmp.stepsNumber) {
        status.parameters["DIST"].value = tmp.stepsNumber;
        status.parameters["DIST"].date  = transformDate(tmp.stepsNumberDate);
		status.parameters["DIST"].comment = tmp.commentStepsNumber || "";
    }
    db.currentStatuses.save( status ); 
    // printjson( status );
}