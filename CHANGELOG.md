__v0.0.8__
 
  - Events
  - Rights management
  - Menu
  - Dietary and Physical plans
  - Result synthesys
  - Fixes 
    - on beneficiary create : display an empty form
    - beneficiary Edit : change professionnals edit
    - Harmonize filter/sort boxes
    - Area for yellow graph
    - Beneficiary edit : enter size in cm
    - Beneficiary edit : change "Gender" to "Civility"
    - Beneficiary edit : Add star to required fields
    - Data recording : display questionnaire and questionnaire answers 
    
__v0.0.7__

 - Current Health status section
 - Echanges avec HHR-Home (avec les specif d’echanges fourines le 14/1)

__v0.0.6__

 - API dataRecording , FIX dataRecordItems : add subject and datetime
 - API getGraphData : NEW
 - page "physiological data" ( graph page ) : NEW
 - Bug Fix Directory

__2015-01-05__ ( v0.0.5 )

 - redirect to "select a beneficiary" when a beneficiary is required and none is selected 
 - Adds items :
   - Results from Data Recording
   - Data Recording
 - Agenda view
 - Demo screen to add a event to a agenda
  
__2014-12-08__

 - merge the lists "physiologicalGeneral" and "physiologicalHDIM" in "parameters"
 - get items of a dataRecord by page of 50 items
 - add method to dataRecord to initialize and updateItems
 - for api request if no session exists, send a 403 error
 - update zdk-calendar, that update fix the reset of the filter on data records page
 - beneficiary update thresholds limits

__2014-11-19__

Integrate MainLayout branch

 - use polymer version 0.5.X
 - redesign the main layout
  
Nota : it's necessary to redo a `npm install` to reinstall bower_components, and add support to woff2 in nginx.

  
