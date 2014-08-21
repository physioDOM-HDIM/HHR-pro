% Practitioner Schema
% Fabrice Le Coz
% August 2014

As defined in the HL7 standards, Practitioners covers all individuals who are engaged in the healthcare process 
and healthcare-related services as part of their formal responsibilities.

For PhysioDOM, practitioners are extended with legal person.

Practitioners include but not limited to :

  - Physician, dentist, pharmacist
  - Physician assistant, nurse, scribe
  - midwife, dietitian, therapist, optometrist, paramedic
  - medical technicians, laboratory scientists, prosthetic technician, radiographer
  - social worker, professional home carer, official volunteer
  - IT personel
  
All practitioners are classified by role in the PhysioDOM program. The role could be different of the profession ( cf above ).

~~~
{
	"id": "/Practitioner",
	"description" : "practitioner JSON Schema",
	"type": "object",
	"properties": {
	    "name": { "$ref": "/HumanName, "required": true },
	    "telecom": { "type":"array", "$ref","/Contact" } ],
		"address": {"$ref": "/SimpleAddress"},
		"gender": { type:"string", "enum": [ "F' | "M" ] }
		"job": { type:"string", "enum": job }
		"communication": { type:"string", "enum": [ "fr", "es", "nl", "en-gb" ] }
		"account": { "$ref":"/Account" }
	}
};

job = [
    "physician",
    "pharmacist",
    "Physician assistant",
    "dietitian",
    "therapist",
    "paramedic",
    "nurse",
    "professional home carer",
    "social worker"
]

{ 
    id: "/Organization",
    "type":"object",
    "properties": {
        identifier: [{
                use: String,
                label: String,
                system: String,
                value: String
            }],
            name: { type:"string", required:true },
            telecom: { type:"array", "$ref":"/Contact" },
            address: { "$ref":"/SimpleAddress" },
            active: { type:"boolean" }
    }
}

{ 
    id: "/Account",
    "type":"object",
    "properties": {
        "login": { type:"string", required:true },
        "password": { type:"string", required: true },
        "email": { "type":"string", "pattern":"^[_a-z0-9-]+(\\.[_a-z0-9-]+)*@[a-z0-9-]+(\\.[a-z0-9-]+)+$" },
        "active": { type:"boolean" },
        "role": { type:"string", "enum": role }
    }
}
~~~

communication is the language 

HumanName
 ~~~
 {
    "id":"/HumanName",
    "description" : "Human Name define name of a person",
    "type":"object",
    "properties": {
        "family": { type:"string", required },
        "given": { type:"string", required },
        "prefix": { type:"string" }
        "suffix": { type:"string" }
    }
}
~~~

Contact
~~
{
    "id":"/Contact",
    "description" : "Contact defines a contact way to join a person by example phone",
    "type":"object",
    "properties": {
        "system": { type:"string", "enum": [ "phone", "mobile", "email" ] },
        "value": { type:"string" }
    }
}
~~~

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

