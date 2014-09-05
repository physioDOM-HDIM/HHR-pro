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
 
gender is generally defines in the parent structure
 
### used in :

[Practitioner][Practitioner], [Beneficiary][Beneficiary].

# Identifier

~~~
{
    "id":"/Identifier",
    "type":"object",
    "properties": {
        "use": { type:"string", "enum":["usual", "official", "temp", "secondary" ] },
        "label": { type:"string", required : true},
        "system": { type: "string" },
        "value": { type:"string" }
    }
}
~~~

> Nota : in PhysioDOM an Identifier is only a label

### used in

Organization
    
# Contact

Contact defines communication way, phone mail.

~~~
{
	"id":"/Contact",
	"description" : "Contact defines a contact way to join a person by example phone",
	"type":"object",
	"additionalProperties":false,
	"oneOf": [
 		{
 			type:"object",
 			"additionalProperties":false,
 			properties: {
 				"system": {type: "string", "enum": ["phone", "mobile"]},
 				"value" : {type: "string", format:"phone"}
 			}
 		},
 		{
 			type:"object",
 			"additionalProperties":false,
 			properties: {
 				"system": ["email"],
 				"value" : {
 					type   : "string",
 					format: "email"
 				}
 			}
 		}
 	]
}
~~~

> Nota : Phone's number follow the [E.123 standard](http://en.wikipedia.org/wiki/E.123).

### used in

[Practitioner][Practitioner], [Beneficiary][Beneficiary].

# Address

[Address](http://www.hl7.org/implement/standards/fhir/datatypes.html#address)
~~~
{
    "id":"/SimpleAddress",
    "description" : "Address defines a postal address",
    "type":"object",
    "properties": {
        "use" : { type:"string", "enum" : [ "home","work","temp","old"]  },
        "text": { type:"string" },
        "line": [ { type:"string" } ],
        "city": { type:"string" },
        "state": { type:"string" },
        "zip": { type:"string" },
        "country": { type:"string" }
    }
}
~~~

### used in

[Practitioner][Practitioner], [Beneficiary][Beneficiary].


# Period

~~~
{
    "id":"/Period",
    "type":"object",
    "properties": {
        "start": { type:"string", format:"date-time" },
        "end": { type:"string", format:"date-time" }
    }
}
~~~

# Quantity
 
~~~
{
    "id":"/Quantity",
    "type":"object",
    "properties": {
        "value": {},
        "comparator": {},
        "units": {},
        "system": {},
        "code":{}
    }
}
~~~

# Sampled Data

~~~
{
    "id":"/SampledData",
    "type":"object",
    "properties": {
        "origin": {},
        "period": {},
        "factor": {},
        "lowerLimit": {},
        "upperLimit": {},
        "data":{}
    }
}
~~~

# Attachment

~~~
{
    "id":"/Attachment",
    "type":"object",
    "properties": {
        "contentType": { type:"string" },
        language:{ type:"string" },
        data: { type:"string" },
        url: { type:"string" },
        size: { type:"integer" },
        hash: { type:"string" },
        title: { type:"string" },
        ressource: { type:"string", "enum": [ "Health","Social" ]
    }
}
~~~

ressource : is an addon for PhysioDOM to know if the attachment is Health or Social Section.

> Nota : in PhysioDOM attachment are not linked to other ressources, and is more like a collection of document without 
any reference

[Practitioner]: practitioner.md "Practitioner Data model"
[Beneficiary]: beneficiary.md "Beneficiary Data model"