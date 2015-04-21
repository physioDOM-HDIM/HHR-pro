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

function currentWell() {
	return {
		name : 'well',
		subject: null,
		validated: { 
			status: false, 
			author : null, 
			date: null 
		},
		questionnaires : {
			"SF36"     : new questionnaire("SF36")
		},
		parameters : null,
	};
}

cursor = db.currentStatuses.find( { name:"well" } );
while( cursor.hasNext() ) { 
    // get old record
    var tmp = cursor.next();
    var status = new currentWell();
    status._id     = tmp._id;
    status.subject = tmp.subject;
    if( tmp.validated ) {
        status.validated.status = true,
        status.validated.author = tmp.validatedAuthor,
        status.validated.date = tmp.validatedDate
    }
    if( tmp.dhdAnswer) {
        status.questionnaires["SF36"].answerID = tmp.sf36Answer;
        status.questionnaires["SF36"].score =    tmp.sf36Score;
        status.questionnaires["SF36"].date =     tmp.sf36Date;
        status.questionnaires["SF36"].comment =  tmp.commentsf36;
    }
    db.currentStatuses.save( status ); 
    // printjson( status );
}