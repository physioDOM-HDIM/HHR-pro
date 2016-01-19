
var features = [
    {
        "rights" : {
            "administrator" : 2,
            "coordinator" : 2,
            "socialworker" : 1,
            "physician" : 1,
            "beneficiary" : 1,
            "nurse" : 1
        },
        "disabled" : false,
        "index" : 4,
        "label" : "Specific data for evaluation",
        "link" : "/specificData",
        "parent" : ObjectId("54c136e7dc60e44688bff047"),
        "type" : "item"
    },{
        "rights" : {
            "administrator" : 2,
            "coordinator" : 2,
            "socialworker" : 1,
            "physician" : 1,
            "beneficiary" : 1,
            "nurse" : 1
        },
        "disabled" : false,
        "index" : 7,
        "label" : "Social report",
        "link" : "/social/report",
        "parent" : null,
        "type" : "item"
    }
];

features.forEach( function( item ) { db.menus.save( item ); })

var eetscore = db.questionnaires.findOne( { "name" : "DHD-FFQ" } );
eetscore.questions.forEach( function(question) { question.choice[0].system="decimal"; } );
db.questionnaires.save( eetscore );