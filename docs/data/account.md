

# Account

the account entity is used to manage the identification stage on the web site, and on the rest service.


# Account

~~~
{ 
    id: "/Account",
    "type":"object",
    "properties": {
        "login": { type:"string", required:true },
        "password": { type:"string", required: true },
        "email": { "type":"string", "format":"email" },
        "active": { type:"boolean" },
        "role": { type:"string", "enum": role }
        "person": {
            "id": { type:"object", "description":"object id" },
            "type" : { type:"string", description:"collection name" }
        }
    }
}
~~~

> Nota : email is not required but is highly recommended, as it facilitates the change of password.

### used in

[Practitioner][Practitioner], [Beneficiary][Beneficiary], Organization

# Session



# Logs

