% Notes
% Fabrice Le COz
% 2014-03-19

# Requirement

For creating responsive design web site, we will use common library :

 - bootstrap v3.1.1
 - Jquery 

To facilitate install of web component we will use soon bower.

For the server part, we will use nodejs as web server and probably mongoDB as database.

> __Nota :__ bootstrap is useful to create a mockup, but requires creating a code relatively difficult to maintain. We will prefer to use custom components even if the support needs to use a polyfill library.

# Server

The server will use nginx to cache request and to proxyfy the REST service.

  http://serverfault.com/questions/30705/how-to-set-up-nginx-as-a-caching-reverse-proxy
  
# Client part

bootstrap is commonly use , by the web community, to create cross browser web site, and responsive design UI. With 
conjunction of the jquery library, it is relatively easy to use web components and widgets ( calendars, HTML inline editor ... ).

The UI web Site targets will be modern browsers and will be tested on 

  - Desktop
    * Firefox ( last version )
    * Chrome ( last version )
    * Safari ( last version )
  - Tablet and other smartphones
     * __Android__
        * chrome
        * firefox
     * __IOS__
        * Safari
        * Chrome
      
The web site will use modern technology : HTML5, CSS3 and javascript.

UI

The basis elements of the UI must be positionned in absolute position to be rendered on iPad. IOS7 and desktop safari lacks supporting the `flex` property. in fact flex is supported but need to be prefixed by '-webkit'.

A very instructive article could be found at css-tricks : [Using Flexbox: Mixing Old and New for the Best Browser Support](http://css-tricks.com/using-flexbox/)

table with fixed header : [Working with datatables](http://mkoryak.github.io/floatThead/datatables/)

For tablets, it will be preferable to avoid tables and use custom list. Tables could be used only if the information to display are short.

List and scrolling : if a list is scrollable, it must be the last element of the page, since it's difficult to scroll to element below the list. So it will be preferable to use a pager to display other pages of the list.

# Data definition

## HL7 schema

 - [Questionnaire Definition HL7](http://www.hl7.org/implement/standards/fhir/questionnaire.html#def)
 - [Practitionner](http://www.hl7.org/implement/standards/fhir/practitioner.html#def)
 - [Patient](http://www.hl7.org/implement/standards/fhir/patient.html#def)
 - [Observation](http://www.hl7.org/implement/standards/fhir/observation.html)
 - [Care Plan](http://www.hl7.org/implement/standards/fhir/careplan.html#def)

## profession ( patient )

 - Agriculteur
 - Artisans, commercant, chef d'entreprise
 - Profession libérale, Cadre
 - Employé
 - Ouvrier
 - Retraité 
     - Agriculteur
     - Artisans, commercant, chef d'entreprise
     - Profession libérale, Cadre
     - Employé, Ouvrier

## Activity status

not started
scheduled
in progress
on hold
completed
cancelled

## profession ( practitioner )

  - Physician, dentist, pharmacist
  - Physician assistant, nurse, scribe
  - midwive, dietitian, therapist, optometrist, paramedic
  - medical technicians, laboratory scientists, prosthetic technician, radiographer
  - social worker, professional home carer, official volunteer
  - IT personel

## data validation

when posted, data will be validate against a schema, and then saved into the database.

For that operation, we will use the npm library 'jsonschema'

reference : 
  - [jsonschema](https://github.com/tdegrunt/jsonschema)
  - [JSON Schame Test Suite](https://github.com/json-schema/JSON-Schema-Test-Suite)
  - [JSON schame documentation](http://json-schema.org/documentation.html)
  - [Benchmark of node.js JSON Validation Modules](http://cosmicrealms.com/blog/2012/01/13/benchmark-of-node-dot-js-json-validation-modules/)
  
 