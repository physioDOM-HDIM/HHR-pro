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

function currentFrailty() {
	return {
		name : 'frailty',
		subject: null,
		size: null,
		validated: { 
			status: false, 
			author : null, 
			date: null 
		},
		questionnaires : {
			"CHAIR_TEST" : new questionnaire("CHAIR_TEST")
		},
		failRisk: false
	};
}

cursor = db.currentStatuses.find( { name:"frailty" } );
while( cursor.hasNext() ) { 
	// get old record
	var tmp = cursor.next();
	var status = new currentFrailty();
	status._id     = tmp._id;
	status.subject = tmp.subject;
	if( tmp.validated ) {
		status.validated.status = true,
		status.validated.author = tmp.validatedAuthor,
		status.validated.date = tmp.validatedDate
	}
	if( tmp.chairStandAnswer) {
		status.questionnaires["CHAIR_TEST"].answerID = tmp.chairStandAnswer;
		status.questionnaires["CHAIR_TEST"].score =    tmp.chairStandScore;
		status.questionnaires["CHAIR_TEST"].date =     tmp.chairStandDate;
		status.questionnaires["CHAIR_TEST"].comment =  tmp.commentChairStand;
	}
	if( tmp.risk ) {
		status.failRisk = true;
	}
	db.currentStatuses.save( status ); 
	// printjson( status );
}