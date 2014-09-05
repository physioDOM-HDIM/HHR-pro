

# Questionnaire

[HL7 standard](http://www.hl7.org/implement/standards/fhir/questionnaire.html)

~~~
{
    "id":"/Questionnaire",
    "type":"object",
    "properties": {
    
    }
}

{
    "id":"/Question",
    "type":"object",
    "properties": {
        "name" : { type:"string" }
        "text": {},
        "answer": {
            "OneOf": [
                { 
                    system: "Date",
                    value: { type:"string", format:"date" }
                },
                { 
                    system: "Instant",
                    value: { type:"string", format:"date" }
                },
                {
                    system: "DateTime",
                    value: { type:"string", format:"date-time" }
                },
                {
                    system: "Integer",
                    value: { type:"integer" }
                },
                {
                    system:"Boolean",
                    value: { type:"boolean" }
                },
                {   
                    system:"String",
                    value: { type:"string" }
                },
                {
                    system:"Decimal",
                    value: { type:"number" }
                }
            ]
        }
        choice: { type:"array", "item": { $ref:"/Coding" } },
        options: {
            reference: String,
            display: String
        },
        data: { },
        "remarks" : { type:"string" }
    }
}

{
    "id":"/Group"
    "type":"object"
    "properties": {
    
    }
}

{ 
    "id":"/Coding",
    "type":"object",
    "properties":{
        system: String,
        code: String,
        display: String
    }
}
~~~