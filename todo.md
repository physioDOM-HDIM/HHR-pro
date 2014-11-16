% todo list
% Fabrice Le Coz
% October, 2014

# Directory

 - an entry must have an email
 - the email address should be unique
 - only coordinators or admin could create entry
 - a beneficiary could only see attached professionals
 
# update database for directory

~~~
list = db.lists.findOne({name:"system"})
items = [
	{ "ref" : "", "label" : { "en" : "" } },
	{ "ref" : "email", "label" : { "en" : "email" } },
	{ "ref" : "phone", "label" : { "en" : "phone" } },
	{ "ref" : "mobile", "label" : { "en" : "mobile" } }
]
list.items = items
list.defaultValue = ""
db.list.save( list )

list = db.lists.findOne({name:"use"})
items = [
	{ "ref" : "", "label" : { "en" : "" } },
	{ "ref" : "home", "label" : { "en" : "home" } },
	{ "ref" : "work", "label" : { "en" : "work" } },
	{ "ref" : "temp", "label" : { "en" : "temporary" } },
	{ "ref" : "old", "label" : { "en" : "old" } }
]
list.items = items
list.defaultValue = ""
db.list.save( list )

list = db.lists.findOne({name:"role"})
items = [
	{ "ref" : "", "label" : { "en" : "" } },
	{ "ref" : "administrator", "label" : { "en" : "administrator" } },
	{ "ref" : "coordinator", "label" : { "en" : "coordinator" } },
	{ "ref" : "physician", "label" : { "en" : "physician" } },
	{ "ref" : "medical", "label" : { "en" : "medical" } },
	{ "ref" : "social", "label" : { "en" : "social" } }
]
list.items = items
list.defaultValue = ""
db.lists.save( list )


list = db.lists.findOne({name:"job"})
items = [
	{ "ref" : "", "label" : { "en" : "" } },
	{ "ref" : "administrator", "label" : { "en" : "administrator" } },
	{ "ref" : "coordinator", "label" : { "en" : "coordinator" } },
	{ "ref" : "physician", "label" : { "en" : "physician" } },
	{ "ref" : "pharmacist", "label" : { "en" : "pharmacist" } },
	{ "ref" : "Physician assistant", "label" : { "en" : "Physician assistant" } },
	{ "ref" : "dietitian", "label" : { "en" : "dietitian" } },
	{ "ref" : "therapist", "label" : { "en" : "therapist" } },
	{ "ref" : "paramedic", "label" : { "en" : "paramedic" } },
	{ "ref" : "professional home carer", "label" : { "en" : "professional home carer" } },
	{ "ref" : "social worker", "label" : { "en" : "social worker" } }
]
list.items = items
list.defaultValue = ""
db.lists.save( list )


list = {
    "defaultValue" : null,
    "name" : "communication",
    "editable" : true,
    "items" : [ 
        { "ref" : "en", "label" : { "en" : "en" } },
        { "ref" : "es", "label" : { "en" : "es" } },
        { "ref" : "nl", "label" : { "en" : "nl" } },
        { "ref" : "fr", "label" : { "en" : "fr" } }
    ]
}
db.lists.save( list )
~~~
