


A beneficiary could be likened to a patient in the model HL7.

~~~
{
    id:"/beneficiary",
    type:"object",
    properties: {
        "name": { "$ref":"/HumanName" },
        "telecom": { type:"array", "$ref":"/Contact" },
        "birthDate": { 
            type:"string", 
            pattern:"^\\d{4}-(0[1-9]{1}|1[0-2]{1})-(0[1-9]|[1-2][0-9]|3[0-1])$" 
        },
        "deceased": { type:"boolean" },
        "address": { type:"array", "$ref":"/SimpleAddress" },
        "maritalStatus": { type:"string", "enum": maritalStatus },
        "communication": { type:"string", "emum": [ "fr", "es", "nl", "en-gb" ] },
        "careProvider": { type:"string" },
        "active": { type:"boolean" },
        "contact": { type:"array", "$ref": "/ContactPartner" },
        "account": { "$ref":"/Account" }
    }
}

{
    "id":"/ContactPartner",
    "type":"object",
    "properties": {
        "name": { "$ref":"/HumanName", required:true },
        "telecom": { type:"array", "$ref":"/Contact" },
        "address": { type:"array", "$ref":"/SimpleAddress" },
        "gender": { type:"string", "enum": [ "F", "M" ] }
    }
}
~~~

maritalStatus

~~~
[ 
    "Divorced",
    "Separated", 
    "Married", 
    "Domestic partner", 
    "Single", 
    "Widowed" 
]
~~~