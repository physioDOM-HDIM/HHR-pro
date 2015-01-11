__v0.0.6__

  - API dataRecording , FIX dataRecordItems : add subject and datetime
  - API getGraphData : NEW
  - page "physiological data" ( graph page ) : NEW
  

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

  
