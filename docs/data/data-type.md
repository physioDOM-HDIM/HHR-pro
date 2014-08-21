% Data Model : Data Types
% Fabrice Le Coz
% August 2014

# HumanName

~~~
 {
    "id":"/HumanName",
    "description" : "Human Name define name of a person",
    "type":"object",
    "properties": {
        "family": { type:"string", required:true },
        "given": { type:"string", required:true },
        "prefix": { type:"string" }
        "suffix": { type:"string" }
    }
}
~~~

 - family : is the lastname of a person
 - given : is the firstname of a person
 
## used in :

[Practitioner][Practitioner], Beneficiary.
    
# Contact

Contact defines communication way, phone mail.

~~~
{
	"id":"/Contact",
	"description" : "Contact defines a contact way to join a person by example phone",
	"type":"object",
	"additionalProperties":false,
	"properties": {
		"system": { type:"string", "enum": [ "phone", "mobile", "email" ] },
		"value": { type:"string" }
	}
}
~~~

# Address

[Practitioner]: practitioner.md "Practitioner Data model"