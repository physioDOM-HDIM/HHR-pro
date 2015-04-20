function questionnaire(name) {
	return {
		"name":name,
		"date":null,
		"score":null,
		"answerID":null,
		"comment":""
	};
}

function param(name) {
	return {
		"name": name,
		"value":null, 
		"comment":"",
		"date":null
	};
}

function currentNutrition() {
	return {
		name : 'nutrition',
		subject: null,
		size: null,
		validated: { 
			status: false, 
			author : null, 
			date: null 
		},
		questionnaires : {
			"MNA"     : new questionnaire("MNA"),
			"MNA_MINI": new questionnaire("MNA_MINI"),
			"SNAQ"    : new questionnaire("SNAQ"),
			"DHD-FFQ" : new questionnaire("DHD-FFQ")
		},
		parameters : { 
			"WEG":  new param("WEG"),
			"LFR" : new param("LFR"),
			"BMI":  new param("BMI") 
		},
		dietPresc : {
			prescription:null,
			date: null,
			comment:null
		}
	};
}

function transformDate( dat ) {
	if( dat ) {
		return dat.slice(6)+"-"+dat.slice(3,5)+"-"+dat.slice(0,2);	
	} else {
		return null;
	}
}

cursor = db.currentStatuses.find( { name:"nutrition" } );
while( cursor.hasNext() ) { 
    // get old record
	var tmp = cursor.next();
	var status = new currentNutrition();
	status._id     = tmp._id;
	status.subject = tmp.subject;
	status.size = tmp.size;
	if( tmp.validated ) {
		status.validated.status = true,
		status.validated.author = tmp.validatedAuthor,
		status.validated.date = tmp.validatedDate
	}
	if( tmp.weight ) {
		status.parameters["WEG"].value   = tmp.weight;
		status.parameters["WEG"].date    = transformDate(tmp.weightDate);
		status.parameters["WEG"].comment = tmp.commentWeight || "";
	}
	if( tmp.bmi ) {
		status.parameters["BMI"].value   = tmp.bmi;
		status.parameters["BMI"].date    = transformDate(tmp.bmiDate);
		status.parameters["BMI"].comment = tmp.commentBmi || "";
	}
	if( tmp.lean ) {
		status.parameters["LFR"].value   = tmp.lean;
		status.parameters["LFR"].date    = transformDate(tmp.leanDate);
		status.parameters["LFR"].comment = tmp.commentLean || "";
	}

	if( tmp.mnaAnswer) {
		status.questionnaires["MNA"].answerID = tmp.mnaAnswer;
		status.questionnaires["MNA"].score =    tmp.mnaScore;
		status.questionnaires["MNA"].date =     tmp.mnaDate;
		status.questionnaires["MNA"].comment =  tmp.commentMna;
	}
	if( tmp.mnaSfAnswer) {
		status.questionnaires["MNA_MINI"].answerID = tmp.mnaSfAnswer;
		status.questionnaires["MNA_MINI"].score =    tmp.mnaSfScore;
		status.questionnaires["MNA_MINI"].date =     tmp.mnaSfDate;
		status.questionnaires["MNA_MINI"].comment =  tmp.commentMnaSf;
	}
	if( tmp.snaqAnswer) {
		status.questionnaires["SNAQ"].answerID = tmp.snaqAnswer;
		status.questionnaires["SNAQ"].score =    tmp.snaqScore;
		status.questionnaires["SNAQ"].date =     tmp.snaqDate;
		status.questionnaires["SNAQ"].comment =  tmp.commentSnaq;
	}
	if( tmp.dhdAnswer) {
		status.questionnaires["DHD-FFQ"].answerID = tmp.dhdAnswer;
		status.questionnaires["DHD-FFQ"].score =    tmp.dhdScore;
		status.questionnaires["DHD-FFQ"].date =     tmp.dhdDate;
		status.questionnaires["DHD-FFQ"].comment =  tmp.commentDhd;
	}
	if( tmp.dietPresc ) {
		status.dietPresc.prescription = tmp.dietPresc;
		status.dietPresc.date = transformDate(tmp.dietPrescDate);
		status.dietPresc.comment = tmp.commentDietPresc;
	}
	if( tmp.assistance ) {
		status.assistance = tmp.assistance;
	}
	db.currentStatuses.save( status ); 
	// printjson( status );
}