__v0.0.16__ debug release

  - #247 Fix Label Questionnaire prescription
  - #66 Added uppercase to first letter in labels
  - #251 +1 day to the 'to' date to be able to see chosen date in results
  - #254 Added profession field and value to view/schema
  - #248 added rule to check professionals affiliation 
  - #110 & #94 Added Utils method to limit input and textarea
  - #118 Check references in the same list : case insensitive comparaison
  
  
__v0.0.15__ debug release

  - #249 [Bene overview][v011] la valeur de Height n'est pas bonne
  - #256 - Organization checkbox
  - #203 - Assistance Service
  - #154 - Champ Telecom
  - #152 - Ajouter professionnel
  - #253 & #198 - Current Health Status Validate
  - #169 - Saisie des seuils
  
__v0.0.14__

  - IDS login and certificates management

__v0.0.13-1__

  - Fix Date in prescription data
  - Fix queue message for symptoms
  - Fix queue message for symptoms self
  - Fix queue measures and symptoms plan : remove unused dates
  
__v0.0.13__

  - Fix push message to the queue
    - remove quotes
    - Fix send units
    - Fix agenda of data prescription
  - Fixed bugs
    - #73 : Directory CSV export 
    - #74 : non specifié
    - #78 : Erreur sauvegarde mail ( Directory )
    - #88 : Signalement perte de saisie
    - #95 : Message erreur incomplet sur erreur de date de naissance ( beneficiary create )
    - #100 : Tri de la liste des professionels attachés à un beneficiare
    - #112 : Directory create plantage sur civilité et organisation
    - #113 : Controle d'intégrité ( suppression d'un professionel attaché à des beneficiares )
    - #119 : Liste à compléter
    - #147 : Filtre sur les beneficiares
    - #180 : Listes vides
    - #181 : Bouton menu
    - #182 : Uniformaisation des champs date ( prescription of data monitoring )
    - #187 : chanmp demande trop petit ( non spécifie )
    - #189 : Bouton validate
    - #197 : Current health status well being problème de formulaire
    - #204 : Eetscore manquant
    - #206 : Synthèse des résultats : pas de tri
    - #224 : Nutritional status label au lieu de la référence
    - #232 : organizationType en double
    - #246 : Affichage des seuils dans le graphe ( non reproduit )
    - #238 : Taille des messages to home
    
__v0.0.12__

  - Adds an agenda to repeatedly update beneficiaries measures and symptoms plans
  - update history on set-top box when creating a new data record
  - remove double-quote in messages for SServer
  - update menu
  - display questionnaire label in the questionnaires prescription page
  
__v0.0.11__

  - update queue service
  - Fix Bug #241
  - Fix english (uk) date format
  - Fix Bug #212
  - Fix Bug #243
  - Fix Bug #239
  - Fix message title max length to 100 characters
  - Fix Bug #131
  - Fix Bug #235
  - Fix Bug #228, #234
  - Change label "Consultation from" to "Consultation"
  - Fix Bug #60

__v0.0.10__

Push to queue
  
  - init of a hhr
  - push messages
  - push symptoms assessments history
  - push measaure history
  - push symptoms assessements ( symptoms self )
  - push questionnaires huistory
  - push DHD-FFQ advice
  - push firstname
  - push dieatry plan
  - push physical plan
  - receive message read status
  - receive symptoms assessments
  - receive measures

__v0.0.9__

 - Bug #191 
	> [Directory/Update][physioDOM-v0.0.8] Modification professionel impossible  
	> Fixed 0.0.9
 - Bug #192
	> [Directory/Update][physioDOM-v0.0.8] liste deroulante role vide  
	> Fixed 0.0.9
 - Bug #205
	> [Physiological data/Data Recording][physioDOM-v0.0.8] score et liste de questionnaires  
	> Fixed 0.0.9
 - Bug #196
	> [Quick Look/Physiological Data][physioDOM-v0.0.8] mise à jour des Seuils  
	> Fixed 0.0.9
 - Bug #206
	> [Result synthesis][[physioDOM-v0.0.8] Liste de resultat  
	> Fixed 0.0.9
 - Bug #54
	> [Select beneficiary/list (professional)] Items per page  
	> Fixed 0.0.9
 - Bug #61
	> [Select beneficiary/edit-Add/OtherParts][physioDOM-v0.0.3] No saving function  
	> Fixed 0.0.9
 - Bug #84
	> [Ergonomie générale][physioDOM-v0.0.4] Taille champs des formulaires  
	> Fixed 0.0.9
 - Bug #86
	> [Ergonomie générale][physioDOM-v0.0.4] Signalement champs requis  
	> Fixed 0.0.9
 - Bug #88
	> [Ergonomie générale][physioDOM-v0.0.4] Signalement si perte de saisie  
	> Fixed 0.0.9
 - Bug #93
	> [Beneficiary Overview/Personal data][physioDOM-v0.0.4] Mention du référent  
	> Fixed 0.0.9
 - Bug #96
	> [Create/update Beneficiary/Beneficiary][physioDOM-v0.0.4] Intitulé section Beneficiary  
	> Fixed 0.0.9
 - Bug #99
	> [Create/update Beneficiary/Professional][physioDOM-v0.0.4] Information sur le référent  
	> Fixed 0.0.9
 - Bug #100
	> [Create/update Beneficiary/Professional][physioDOM-v0.0.4] Tri de la liste  
	> Fixed 0.0.9
 - Bug #104
	> [Create/update Beneficiary/Life Conditions][physioDOM-v0.0.4] Défaut d’enregistement  
	> Fixed 0.0.9
 - Bug #109
	> [Create/Update Professional][physioDOM-v0.0.4] Titre à modifier  
	> Fixed 0.0.9
 - Bug #103
	> [Create/update Beneficiary/Entry][physioDOM-v0.0.4] Saisie date non prise en compte  
	> Fixed 0.0.9
 - Bug #111
	> [Create/Status][physioDOM-v0.0.4] Case à cocher Organization  
	> Fixed 0.0.9
 - Bug #112
	> [Create/Update Professional/Identity][physioDOM-v0.0.4] Plantage en rapport au genre et l’organisation  
	> Fixed 0.0.9
 - Bug #114
	> [Create/Update Professional/Telecom][physioDOM-v0.0.4] Contrôle champs value selon le type  
	> Fixed 0.0.9
 - Bug #116
	> [List Management/Toutes listes][physioDOM-v0.0.4] Changement de la langue  
	> Fixed 0.0.9
 - Bug #117
	> [List Management/Toutes listes][physioDOM-v0.0.4] Selection valeur par defaut  
	> Fixed 0.0.9
 - Bug #121
	> [List Management/Meal-Symptom-CareEquipment][physioDOM-v0.0.4] Rank non present  
	> Fixed 0.0.9
 - Bug #123
	> [List Management/Type of disability][physioDOM-v0.0.4] Valeurs incorrectes  
	> Fixed 0.0.9
 - Bug #151
	> [Directory of Professionals/Filter-sort][physioDOM-v0.0.6.1] Active status  
	> Fixed 0.0.9
 - Bug #152
	> [Directory][physioDOM-v0.0.6.1] Ajouter professionnel  
	> Fixed 0.0.9
 - Bug #154
	> [Directory][physioDOM-v0.0.6.1] Champ Telecom  
	> Fixed 0.0.9
 - Bug #157
	> [Global][physioDOM-v0.0.6.1] Saisie date manuelle  
	> Fixed 0.0.9
 - Bug #113
	> [Create/Update Professional/Delete du professionnel][physioDOM-v0.0.4] Contrôle d’intégrité  
	> Fixed 0.0.9
 - Bug #156
	> [Quicklook/MessageToHome/Filter-Sort][physioDOM-v0.0.6.1] List déroulante sender  
	> Fixed 0.0.9
 - Bug #155
	> [Quicklook/MessageToHome/List][physioDOM-v0.0.6.1] position bouton new message  
	> Fixed 0.0.9
 - Bug #166
	> [Physiological data/Data Recording][physioDOM-v0.0.6.1] saisie erroné  
	> Fixed 0.0.9
 - Bug #168
	> [Physiological data/Data Recording][physioDOM-v0.0.6.1] Save button  
	> Fixed 0.0.9
 - Bug #173
	> [Physiological data][Results from data recording][physioDOM-v0.0.6.1] acces sans beneficiaire  
	> Fixed 0.0.9
 - Bug #72
	> [Directory][physioDOM-v0.0.3] Create Organization  
	> Fixed 0.0.9
 - Bug #73
	> [Directory][physioDOM-v0.0.3] export functions  
	> Fixed 0.0.9
 - Bug #69
	> [Directory/Update][physioDOM-v0.0.3] Changement mot de passe  
	> Fixed 0.0.9
 - Bug #68
	> [Directory/Update][physioDOM-v0.0.3] Ajout Adresse  
	> Fixed
 - Bug #66
	> [Directory/List][physioDOM-v0.0.3] alignement  
	> Fixed
 - Bug #210
	> [Physiological data][Results from data recording][physioDOM-v0.0.8] manque identité professionel  
	> Fixed 0.0.9
 - Bug #209
	> [Physiological data][Results from data recording/Edit][physioDOM-v0.0.8] remplacer provider par professional  
	> Fixed 0.0.9
 - Bug #199
	> [General][physioDOM-v0.0.8] Champs numérique  
	> Fixed 0.0.9
 - Bug #195
	> [Quick Look/Physiological Data][physioDOM-v0.0.8] leger recouvrement case orange/bleu  
	> Fixed 0.0.9
 - Bug #188
	> [Beneficiary overview/Personal][physioDOM-v0.0.8] code perimeter  
	> Fixed 0.0.9
 - Bug #187
	> [Beneficiary overview/Detail][physioDOM-v0.0.8] zone de texte demande trop petite  
	> Fixed 0.0.9
 - Bug #183
	> [Current Health Status/Well Being][physioDOM-v0.0.8] SF12->SF36  
	> Fixed 0.0.9
 - Bug #181
	> [Header/Menu Panel][physioDOM-v0.0.8] Bouton menu disparait  
	> Non reproduit
 - Bug #182
	> [Global][physioDOM-v0.0.8] Uniformisation format Champs date  
	> Fixed 0.0.9
 - Bug #180
	> [Lists Management][physioDOM-v0.0.8] Listes vides dans list management  
	> Non reproduit
 - Support #179
	> [Question][Menu][physioDOM-v0.0.6.1] Terme "Physiologicial data"  
	> Fixed 0.0.9
 - Support #158
	> [Question][physioDOM-v0.0.6.1] 2 boutons reset  
	> Fixed 0.0.9
 - Support #131
	> [Question][select beneficiary/create-update][v0.0.4] champ "comes from"  
	> Fixed 0.0.9

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

  
