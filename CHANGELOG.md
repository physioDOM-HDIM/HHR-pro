% CHANGELOG  
% Fabrice Le Coz  
% May, 2016


__v1.1.11__ :

  - Bug \#636 : Sometimes the calander leaves a week empty
  - Bug \#639 : Messages to beneficiaries
  
__v1.1.10__ :

  - Bug 631 : \[v.1.1.9\]\[Physical Plan\] Pas d'envoi
  - Bug 624 : \[v.1.1.9\]\[Agenda\] Pas de transmission d'agenda à Home
  - Bug 585 : \[v.1.1.6\]\[Agenda\] Même rendez-vous envoyé plusieurs fois
  - Bug 607 : \[v.1.1.6\]\[Services\] Pas de notifications

__v1.1.9__

  - Bug Fix : Adds forgetten components core-dropdown-menu, core-pages

__v1.1.8__

Feature : message to beneficiaries

  - Add two new labels :
    - "Message to beneficiaries"
    - "There is no beneficiaries selected"
  - Add a new menu entry

> __Nota :__ to add the new entry in the menu, applied the script `upgrade-1.1.8.js` to the database

__v1.1.7__

Bugs fix :

  - Bug 577 & 607 : \[v.1.1.6\]\[Services\] Pas de notifications
  - Bug 588 : \[Agenda + Services\] La désactivation d'un service n'est pas effective dans HHR-Home
  - Bug 585 : \[Agenda\] Même rendez-vous envoyé plusieurs fois

not reproduced

  - Bug 611 : [v.1.1.6][Titres] Bug affichage
  - Bug 610 : [v.1.1.6][Calendrier] Bug d'affichage sur Chrome Android

__v1.1.6__

Bugs fix :

  - Bug 597 : \[v.1.1.5\]\[Specific data\] Nombre de jours d'hospitalisation
  - Bug 599 : \[v.1.1.5\]\[Specific data\] Titre de la page
  - Bug 600 - \[v.1.1.5\]\[Specific data\] Affichage du nombre total d'event
  - Bug 601 : \[v.1.1.5\]\[Social Report\] Bug affichage
  - Bug 602 - \[v.1.1.5\]\[Social Report\] Pas de sauvegarde
  - Bug 603 : \[v.1.1.5\]\[Specific data\] Anciens "comments" conservées
  - Bug 604 - \[v.1.1.5\]\[Calendar\] Fréquence des services journaliers
  - Bug 605 - \[v.1.1.5\]\[Services\] Fréquence des services journaliers

__v1.1.5__

New features :

  - Social report
  - Specific data for evaluation

Bugs fixe :

  - Bug 586 : \[Agenda\] Fréquence des services 
  - Bug 588 : \[Agenda + Services\] La désactivation d'un service n'est pas effective dans HHR-Home 
  - Bug 572 : \[Agenda\] End Date d'un service 
  - Bug 574 : \[Agenda\] Période de visualisation des services 
  - Bug 576 - \[Agenda\] Durée des services 
  - EETscore value are decimal 
  - Send height with the firstname 
  - Bug 596 :  \[Physical Plan\] Aucune notification d'un Physical Plan 
  - Bug 571 : \[Services\] Reactivation de la notification des service
  - Bug 578 : \[Messages\] Reactivation de la notification des messages
  
not reproduced in tests :

  - Bug 585	: \[Agenda\\] Même rendez-vous envoyé plusieurs fois
  - Bug 589 : \[Agenda\] Services oubliés pour certain jours de l'Agenda

> __Nota :__ For decimal values in the Eetscore questionnaire, the questionnaire must be edited and the "Choice System"
> property of each items must be change from "integer" to "decimal". ( done by the ugrade script ).

New menu entries :

~~~
var features = [
    {
        "rights" : {
            "administrator" : 2,
            "coordinator" : 2,
            "socialworker" : 1,
            "physician" : 1,
            "beneficiary" : 1,
            "nurse" : 1
        },
        "disabled" : false,
        "index" : 4,
        "label" : "Specific data for evaluation",
        "link" : "/specificData",
        "parent" : ObjectId("54c136e7dc60e44688bff047"),
        "type" : "item"
    },{
        "rights" : {
            "administrator" : 2,
            "coordinator" : 2,
            "socialworker" : 1,
            "physician" : 1,
            "beneficiary" : 1,
            "nurse" : 1
        },
        "disabled" : false,
        "index" : 7,
        "label" : "Social report",
        "link" : "/social/report",
        "parent" : null,
        "type" : "item"
    }
];

features.forEach( function( item ) { db.menus.save( item ); } )

var eetscore = db.questionnaires.findOne( { "name" : "DHD-FFQ" } );
eetscore.questions.forEach( function(question) { question.choice[0].system="decimal"; } );
db.questionnaires.save( eetscore );
~~~

to apply the changes to the database :

~~~
mongo physiodom-test upgrade-1.1.5.js~
~~~

  
__v1.1.4__
  
  - Bug 522 : H&S HHR-Pro / request for measurement / listing of the dates
  - Bug 533 : \[WUR\] alert status switched on automatically after reviewing results or adjust data prescription
  - Bug 505 : \[Init\]\[v.1.0.8\] PopUp lors de l'appui sur Init indique une erreur
  - Bug 470 : \[WUR\] Copy/past into TV messages window PRO
  - Bug 431 : \[Result from Data Recording\]\[v.1.0.5\] Bug d'affichage
  - Bug 449 : \[Result from Data Recording\]\[v.1.0.5\] Bug d'affichage
  - Bug 502 : Physical activity plan history lost
  
> __Nota :__ Bug 454 : eetscore menu, feedback posted.
>  the HHR-Pro will now send a delete message on the old dhdffq before sending the new one.  
  
__v1.1.3__

  - Fix Bug 556 : \[Services\] Mauvaises "Key" pour l'envoi des Services
  - FIx Bug 555 : \[Agenda\] Pas de new agenda
  - Fix Bug 557 : \[Agenda\] Pas d'envoi de l'agenda du jour
  - Fix Bug 554 : \[Agenda\] Mauvaise heure d'enregistrement
  - Fix Bug 553 : Double enregistrement d'un service
  
> __Nota :__ Dans le fichier de configuration, il faut rajouter un paramètre définissant la Time Zone de l'instance, par exemple :
>
>      "timezone":"Europe/Paris"
>
>  - pour l'espagne : "Europe/Madrid"
>  - pour la hollande : "Europe/Amsterdam"
>  - pour l'angleterre : "Europe/London"
>
>
>  Pour les tests il est recommandé de supprimer les collections : "services","servicesPlan" et "servicesQueue"
>
>      mongo hhrpro-test
>      db.services.drop()
>      db.servicesPlan.drop()
>      db.servicesQueue.drop()
>


__v1.1.2__

  - Fix : Push service plan to queue
  - Push services list to queue

__v1.1.1__

  - Push service plan to queue
  - Fix Bug 544 : Erreur dans la liste des horaires des services
  - Bug 543 : Titre du menu Health Service
  - Bug 542 : confirm deactivation
  - Bug 534 : Gestion d'affichage de services aux mêmes horaires
  
    
__v1.1.0__

  - Services social & health care

- - -

__v1.0.10__

  - Bug 504 : bad email on "generating new withdrawal code"
  - Bug 502 : [Eetscore] Empty comments

__v1.0.9__

  - Bug 522 : H&S HHR-Pro / request for measurement / listing of the dates
  - Bug 533 : [WUR] alert status switched on automatically after reviewing results or adjust data prescription
  - Bug 505 : [Init][v.1.0.8] PopUp lors de l'appui sur Init indique une erreur
  - Bug 470 : [WUR] Copy/past into TV messages window PRO
  - Bug 431 : [Result from Data Recording][v.1.0.5] Bug d'affichage
  - Bug 449 : [Result from Data Recording][v.1.0.5] Bug d'affichage
  - Bug 502 : Physical activity plan history lost
  
> __Nota :__ Bug 454 : eetscore menu, feedback posted.
> the HHR-Pro will now send a delete message on the old dhdffq before sending the new one.  
  

__v1.0.8__

  - cosmetic : hide the button "Generate a new withdrawal code" when certificates has been revoked
   
__v1.0.7__

  - Bug 430 : Complément, les "lastValue" dans l'agenda des symptomes sont remis à jour et pousser vers les box
  - Certificats : 
    - Fixe la revocation des certificats lorsque le code de retrait est trop vieux
    - Ajout d'un bouton permettant de recréer un certificat si le code de retrait est trop vieux
    - Update des fichiers de traductions

__v1.0.6__

  - Bug 430 : [v.1.0.5][Symptom assessment] Toutes les indications "Prev." sont à zéro
  - Locales ( Viveris 08-03 )
  
__v1.0.5__

  - Bug 424 [Data Graphs][v.1.0.4] Libellé jaune prend la valeur du libellé bleu
  - Bug 425 [Data Graphs][v.1.0.4] Pas d'affichage des Symptômes et Scores de questionnaires
  - Remove flag for new EETScore
  - Locales ( Viveris 07-10 )

__v1.0.4__

  - Bug 421 : [select beneficiary][v1.0.2] Problème tri de la liste avec les alertes 
  - Bug 418 : [Notification Quest.][v.1.0.2] Notification de questionnaire à chaque MàJ HHR1
  - Bug 417 : [Date Warning Status][v1.0.2] Décalage de 2 heures
  - Bug 416 : [Précision Thresholds][v.1.0.2] Pas de prise en comptes des Thresholds de type "Decimal"
  - Bug 419 : [beneficiary overview][v1.0.2] Source et date : libellés en dur
  
> __Nota :__ Il est necessaire de passer le script d'upgrade ( upgrade-1.0.4.js ) sur la base données pour la résolution du bug 421.
  
__v1.0.3__

  - Bug 419 : [beneficiary overview][v1.0.2] Source et date : libellés en dur 
  - Bug 420 : [Beneficary overview][v1.0.2] Message de confirmation manquant lors du 'Disable warning'
  - [Data recording questionnaire] for dutch and spanish languages, the question answers may be cut.

__v1.0.2__

  - Update des fichiers de langues fournis par Viveris le 26/06
  - Update des fichiers bootstrap database fournis par Viveris le 26/06
  - Bug 413 : Cache
    > add the version to file before serving and cache ( internal nginx )
  - Bug 405 : Date inversée
    > enforce the date locale
  - Bug 389 : Fix messages de modification
  - Bug 414 : Le bouton est caché
  - Bug 410 : Erreur lors de la génération du certificat
  - Bug 404 : Différentiation des prescriptions mensuelle
  - Bug 385 : modification du message d'erreur sur IDS
  - Bug 350 : force les nouveaux questionnaires à new
  - Bug 83 : Correctif de l'UI
  - Bug 408 : [data curves][v1.0.1] Prénom "undefined"
  - Bug 407 : [data curves][v1.0.1] Problème affichage caractère spéciaux
  - Bug 406 : [Data curves][v1.0.1] mauvais positionnement courbe par rapport à l'heure
  - Bug 384 : [Data recording][v1.0.0] décalage colonne value/unit/threshold
  - Bug 382 : [Create/update a beneficiary][v1.0.0] Revocation beneficiaire KO
  - Bug 381 : [Create/update a professional][v1.0.0] Revocation professionel KO

  
> __Nota : Pour les revocation de certificats__  
> Suite à la revocation d'un certificat d'un professionel, si l'on clique sur "save" et que le professionel est actif, 
> une nouvelle demande de certificats est effectuées. 

__v1.0.1__

  - Update des fichiers de langues fournis par Viveris le 18/06
  - \#260 : Bug 398 : [Tout ecrans][[SAFARI IPad v100] Contrôle sur les champs non opérants et messages popup tooltip associés ne s’affichent jamais sur Safari iPad
  - \#261 : Bug 380 : [data curves+result synthesis][v1.0.0] données en double
  - Bug 390 : [UpdateBeneficiary - Firefox][v1.0.0] Gestion de l'activation du beneficaire et save inopérants avec Firefox
  - Bug 389 : [CreateBeneficiary - Firefox][v1.0.0] Affichage d'un message d'erreur au Save du formulaire
  - \#266 : Bug 379 : [Data recording][v1.0.0] an error occured sur le bouton 'Save'
  - \#267 : Bug 391 : [CreateProfessional - Firefox][v1.0.0] Champs city et password initialisés par defaut a tort avec FIREFOX
  - \#268 : Bug 384 : [Data recording][v1.0.0] décalage colonne value/unit/threshold
  - \#269 : Bug 383 : [Data curves][v1.0.0] valeur des graph orange manquante
  - Bug 397 : [Data Recording][v100] Questionnaire Form - SAFARI IPad v1.0.0 : Questionnaire tronqué aux limites de l’ecran sur Safari iPad
  - Bug 396 : [UpdateBeneficiary - Safari IPAD][v1.0.0] Gestion de l'activation du beneficaire et save inopérants avec SAFARI sur iPad
  - Bug 395 : [CreateBeneficiary - SAFARI iPad][v1.0.0] Affichage d'un message d'erreur au Save du formulaire avec Safari iPad
  - Bug 370 : [Data curves][v038] suppression d'un datarecording
  - Bug 399 : [Data Graphs][v100] Parameters list - SAFARI IPad v1.0.0 : Case a cocher ne se coche pas sur l’ecran tactile sur Safari iPad
  - Bug 398 : [Tout ecrans][[SAFARI IPad v100] Contrôle sur les champs non opérants et messages popup tooltip associés ne s’affichent jamais sur Safari iPad
  - Bug 387 : [CHS/activity motricity status][v1.0.0] affichage date Distance travelled
  
> __Nota :__ deux labels supplémentaires ont été ajoutés à la fin des fichiers de langues

__v1.0.0__

  - FIX regression on "Prescription of symptoms assessments" 

>__Nota :__  The version 0.0.41 is marked as version 1.0.0 ( prod version ).  
> The patched production versions  will be marked as 1.0.x
>
> The development versions will be marked as 1.1.x

__v0.0.41__

  - \#255 : Bug 372 - [CHS][v040] suppression "Special Diet Prescription"
  - \#254 : Bug 309 - Traçabilité identité du professionel et date impactant un beneficiaire
  - \#256 : Bug 378 - [Prescription of data monitoring][v040] Impossible de saisir les thresholds dans le cas d'une duplication
  - Fix ScrollIntoView for login panel

__v0.0.40-1__

  - replace locales files (en, nl) by given files
  
__v0.0.40__

  - \#247 : Bug 376 - [prescription of data monitoring][v038] monthly prescription
  - \#250 : Bug 375 - [result from data recording/consultation][v038] décallage entete colonne
  - \#249 : Bug 359 - [Data Section/ Result of Data Recording][v.0.0.37] Parametres Current Health Status (Weight, ...) classés en dur dans HDIM
  - \#248 : Bug 353 - [Measure History][v.0.0.37] Mauvais décalage des données
  - \#251 : Bug 373 - [Beneficiary overview][v038] Motif de sortie Manquant
  - \#252 : Bug 372 - [CHS][v038] champ status non sauvegardé sur modification
  - Fix polymer include ( webcomponents.js )
  - \#253 : Bug 370 - [Data curves][v038] suppression d'un datarecording
  - Script to backup/restore DB from mongo docker
  
> __Nota :__ the first week of the month is the the week that contains the first monday of the month, 
> for example for May 2015, the first week starts at 2015-05-04.
>
> The last week of the month is the week that contains the last monday of the month, for example for May 2015 the
> last week starts at 2015-05-25
> 
> The first day of the week ( here monday ) depends of the server locale defined by the property `Lang` in the configuration file.

 
>__Nota__ : for bugs 359 and 353, it's necessary to update the database with the script `upgrade-0.0.40.js`

__v0.0.39__

  - Bug 369 : [Create/Update a beneficiary][v038] attribution certificat pour les beneficiaires
  - Bug 332 : Fonctionnalité d'envoie de mail pour retrait de certificat
  - Bug 366 : [Bouton Add][v.0.0.38-1] Add ne fonctionne plus
  - Fix Install from scratch

__v0.0.38-1__

  - Fix "measures[id].params[id].type" with the "rank" value of the list "parameters"
  - Fix the key type for the queue in lowercase
  
__v0.0.38__

  - \#244 : Bug 341 - [create-edit beneficiary][v036] start date optionnelle lors de la désactivation
  - \#242 : Bug 354 - [Create/update a beneficiary][v.0.0.37] Activation par la date de début
  - \#238 : Bug 360 - [CHS][v.0.0.37] Données modifiables après validation
  - \#240 : Bug 357 - [Nutritional status/ validation][v.0.0.37] Resultat égal à zéro
  - \#245 : Send DHDFFQ answers as `Double`
  - \#239 : Bug 358 - [Data section/ Prescription][v.0.0.37] Threshold min et max
  - \#242 : Bug 356 - [List Management][v.0.0.37] Modification de paramètre
  - \#246 : Bug 332 - Fonctionnalité d'envoie de mail pour retrait de certificat
  
__v0.0.37-1__

  - Queue add logs on error
  - Show version at start
  - Add a /version url
  - Add a /createunit url ( for IDS )

__v0.0.37__

  - Bug 332 : Fonctionnalité d'envoie de mail pour retrait de certificat
  - Bug 308 : [Login][v034] Change password
  - Bug 333 : [ERG][v035] Saisie des questionnaires sur tablette ( Taille des boutons radio doublée )
  - Bug 340 : [Init Bene][v.0.0.36-1] Pas d'initialisation d'un bénéficiaire si pas de prénom
  - Bug 342 : [create-edit beneficiary][v036] Remise à blanc des champs non sauvegardée
  - Bug 349 : [Menu][v036] enable 'data recording' dans le menu
  - Bug 348 : [RIGHTS][v036] Liste role non traduite
  - Bug 347 : [Beneficiary overview/Details][036] Texte coupé
  - Bug 346 : [Measurements][v.1.0.1] Pas de transmission des "measurements" à HHR-Pro
  - Bug 343 : [create-edit beneficiary][v036] Champ HEIGHT pré-rempli lors de la création
  - Bug 341 : [create-edit beneficiary][v036] start date optionnelle lors de la désactivation
  - Bug 345 : [Beneficiary overview][v036] valeurs undefined
  - Bug 344 : [edit-create beneficiary][v036] Case 'Active' cochée par défaut
  - Push First name to queue if change detected
  - Bug 309 : [General][v034] Traçabilité identité du professionel et date impactant un beneficiaire
  - Use SMTP config from config file
  
> __Nota :__ for Bug 346, the queue service must be updated
  
__v0.0.36-1__

  - Fix creating an account ( professional and beneficiary ) on IDS infrastructure
  - Fix push Symptoms Self to queue

__v0.0.36__

  - \#226 : Bug 307 - Notification d'un "Dietary Plan"
    - Fix also send family name if no given name exists
  - \#227 : Bug 328 : [Create/Update a beneficiary|Professionals list][v035] Affiche la Label suivi de la reference (table system)
  - \#228 : Bug 293 - [Beneficiary overview][v027] Bouton init
   > Changing the physioDOM box reset the status of the box in HHR-Pro
  - \#229 - Bug 320 - [Result from data recording][v034] bouton edit/delete en mode 'Readonly'
   > __Nota :__ To have rights to edit an existing data record depends ont he rights "Results from data recording"
  - \#230 : Bug 325 - [Edition d'un beneficiaire][v034] Erreur buffer chunk
   > __Nota :__ Giving Read/write access to the beneficiary on his file is not a good idea, but now it works.  
   > The access to the "init" button is reserved to coordinator or administrator.
  - \#231 : Bug 326 - [Lists management][v034] liste déroulante avec element desactivé
  - \#232 : Bug 189 - [Select Beneficiary/Edit][physioDOM-v0.0.8][ HHR-Pro CasesTests Results & Decisions v10 150114.docx
  - \#233 : Bug 333 - [ERG][v035] Saisie des questionnaires sur tablette
  - \#234 : Bug 330 - Création professionnel via IDS ( fix also for beneficiaries )
  - \#235 : Bug 331 - [Prescription of data monitoring][v035] Format date DD/MM/YYYY en Hollandais pour les écrans de création des prescriptions
  - \#236 : Bug 317 : [data curves][v034] widget graphique non traduit
  - \#237 : Bug 334 - [Prescription of Data Monitoring][v0035] Pas d'envoi de prescriptions
  
> __Nota :__ to apply bug fix \#232, it's necessary to apply the new `list.json`, due to creation of a new list `exitStatus`.

__v0.0.35__

  - \#196 Bug 259 - [Current Health Status][v0013-2] Saisie questionnaire
    - refactoring des ecrans du Current Health Status
    - Bug 321 : [Current Health status][v034] Prise en compte des Ranges & Thresholds
    - Bug 310 : [Current Health Status][v034] unité non lié à la liste management
  - Bug 320 : [Result from data recording][v034] bouton edit/delete en mode 'Readonly'
  - \#217 : Bug 319 : [Create/Update a beneficary ][v034] Champ Height en nombre flottant après sauvegarde
  - Bug 318 : [Prescription of data monitoring][v034] bouton 'duplicate' et 'edit' collé chevauché
  - \#218 : Bug 316 Le mot 'Direction' dans la partie filter/sort n'est pas présent dans le fichier de langue et donc non traduit.
  - \#219 : Bug 322 - [Edit professional/Telecom][v034] reference au lieu du label après sauvegarde
  - \#220 : Bug 315 -: [directory/Create-Update professional/Account][v034] 'Note : undefined'
  - \#221 : Bug 313 - [Create/Update a beneficiary|Professionals list][v034] Mauvais champ "type" associé au numéro de telephone
     - Bug 312 - [Bene overview/professional contacts][v034] afficher le label au lieu de la reference
  - \#222 : Bug 284 - [Result from data recording][v0024] Retour à la ligne commentaire questionnaire
  - \#223 : Bug 317 - [data curves][v034] widget graphique non traduit
  - \#224 : Bug 314 - [All][v034] langue calendrier aide à la saisie des champs date
  - \#225 : Bug 311 - [Data curves][v034] selection bleu supprime le graphique

__v0.0.34__

  - \#212 : Bug 305 - [Langue][Page de login][v031] Chargement langue par défaut du serveur
  - \#216 : Bug 230 - [Global/Account-Nomenclature][v009.1] RoleClass, RoleType
  - \#215 : [Beneficiary/Bene_edit][physioDOM-v0.0.33] HRR-Pro access
 
__v0.0.33-2__ ( hotfix release )

  - \#213 : Bug 288 - [current health status][v027] verrouillage menu/fonctionnalité avant validation

__v0.0.33__

  - \#208 : Bug 287 - [Result from data recording list][v027] Navigation d'un result a un autre
  - \#198 : Bug 290 - [Current Health status][v027] Droit pour Validation
  - \#212 : Bug 308 - [Login][v031] Le login doit être unique
  - \#211 : Bug 305 - [Langue][Page de login][v031] Chargement langue par défaut du serveur
  - \#210 : Bug 292 - [Beneficiary overview/Event log][v027] Intitulé des events
  - \#209 : Bug 303 - [Create-Update Beneficiary][v031] Problème sauvegarde numéros de telephone
  - \#200 : [Data curves] the parameter's labels are not translated
  - \#213 : Bug 288 - [current health status][v027] verrouillage menu/fonctionnalité avant validation
  - Fix some translate

> __Nota :__ to apply the bugfix for \#212 execute the following command on mongo :
>
>     cursor = db.account.find();
>     while( cursor.hasNext() ) { 
>         var tmp = cursor.next(); 
>         tmp.login=tmp.login.toLowerCase(); 
>         db.account.save( tmp ); 
>     }

<br/>
> __Nota :__ to apply bugfix \#198, execute the following command :
>
>     mongoimport -d physioDOM --drop -c specialRights --file initDB/specialRights.json
  
__v0.0.32__

  - \#201 : [Beneficiary/Bene_select][physioDOM-v0.0.31] sort by city
  - \#207 : Fix missing translate label
  - \#204 : [Beneficiary/Bene_overview][physioDOM-v0.0.31] Init
  - \#205 : Bug 214 - [Right][PhysioDOM-v0.0.8] droit manquant et niveau d'access
  - \#187 : Traductions, fautes de frappe et d'orthographe
  - \#102 : [Beneficiary/Bene_edit][physioDOM-v0.0.16] Diagnosis
  - \#195 : Bug 302 - [Result form data recording][Ergonomie][v029] Dépassement commentaire paramètre et symptomes
  - \#197 : Bug 230 - [Global/Account-Nomenclature][v009.1] RoleClass, RoleType
  - \#199 : Bug 241 - [Message to Home&Data recording][v009.1] Ursupation d'utilisateur (part 2)
  
> __Nota :__ to apply the bugfix for \#201 execute the following command on mongo :
>
>     cursor = db.beneficiaries.find(); 
>     while( cursor.hasNext() ) { 
>         var tmp = cursor.next(); 
>         if( tmp.address ) { 
>             tmp.address.forEach( function(address) { 
>                 address.city = address.city.toUpperCase(); 
>             });
>         }
>         db.beneficiaries.save( tmp ); 
>     }

__v0.0.31__
  
  - Bug 300 & 299 [Message to Home][v029]
  - update translation files
  - update translation lists
  
> __Nota :__ Lists "msg Status" and "msg severity" were deleted as on inter-professional messages, heading that no longer exists.

__v0.0.30__

  - \#191 : Bug 296 - [Beneficiary overview/Professional contacts][v029] Ne pas afficher les professionnels desactivés
  - \#189 : Bug 293 - [Beneficiary overview][v027] Bouton init
  - \#190 : Bug 294 - [create/update a professional][v029] Button yes de confirmation de sauvegarde KO
  - HotFix : Allow to deactivate a professionnal that have no password

__v0.0.29__

  - Configuration modification for prod deployment
  - \#188 : Bug 277 - [Directory][v0020] Activation d'un professionnel
  - \#166 : Bug 260 - [Data Section][v0013-2] Saisie des prescriptions
  - \#182 : Bug 283 - [Result from data recording][v0024] saisie et bouton Edit/back
  - \#102 : [Beneficiary/Bene_edit][physioDOM-v0.0.16] Diagnosis
  - \#180 : Bug 216 - [Rights][physioDOM-v0.0.8] Heritage des droits
  - \#94  : [Rights] Input should be only readable.
  - \#185 : [Data section/Results from Data Recording][physioDOM-v0.0.28] Save edited parameter
  - \#186 : [Beneficiary/Bene_overview][physioDOM-v0.0.28] Event Log
  - \#94  : [Rights] Input should be only readable.
  - \#102 - [Beneficiary/Bene_edit][physioDOM-v0.0.16] Diagnosis
  
> __Nota__ : 
>  - to fix the issue \#102, it's necessary to import the lists.json file from 'initDB'
>  - it's necessary to update the configuration file, see config.json.sample in the install directory
  
__v0.0.28__

  - \#181 : Bug 230 [Global/Account-Nomenclature][v009.1] RoleClass, RoleType
    - Only HEALTH could modify current Health Status
    - Only HEALTH could add data records
  - \#183 : a part of the login is enough to connect
  - \#184 : Adds in configuration a duration parameter for the queue
  - \#178 : Bug 286 - [create/update bene][v0024] Mauvaise redirection après la sauvegarde
  - Fix Date Time when creating a new data record
  - \#182 : Bug 283 - [Result from data recording][v0024] saisie et bouton Edit/back
  - \#180 : Bug 216 - [Rights][physioDOM-v0.0.8] Heritage des droits
  - \#179 : Bug 214 - [Right][PhysioDOM-v0.0.8] droit manquant et niveau d'access
  - \#177 : Bug 284 - [Result from data recording][v0024] Retour à la ligne commentaire questionnaire
  
__v0.0.27__

  - \#176 : Bug 282 - [Prescription/all][v0024] end date

__v0.0.26__

  - \#171 : Bug 91 - [Select Beneficiary/Beneficiary list][physioDOM-v0.0.4] Ajouter un bénéficiaire
  - \#173 : Bug 115 - [Create/Update Professional/Account][physioDOM-v0.0.4] Update du login
  - \#174 : Bug 90 - [Rubrique Adresse][physioDOM-v0.0.4] Conformité champs de la rubrique adresse
  - \#175 : Bug 255 - [update/create beneficiary][v0013-2] Alignement Professional list lors de l'assignement d'un professionel
  - \#104 : [Data section/Results from Data Recording][physioDOM-v0.0.16] Difference record time
  
> __Nota__ : To fix Bug 90, a country fields has been added to the configuration file
  
__v0.0.25__

  - \#167 : [Global] Inactive beneficiary
  - \#170 : Bug 278 - [Prescription of data monitoring/Symptom][v0020] desactivation d'un symptome
  - \#169 : Bug 281 - [Prescription/all][v0024] Frequency Every2 weeks pour 1 semaine
  - \#168 : Bug 280 - [Select beneficary/Filter][v0024] Panel Filter/Sort disparait quand le resultat du filtre n'a pas d'element
  - \#166 : Bug 260 - [Data Section][v0013-2] Saisie des prescriptions
  - \#63  : Bug 254 - [create/update/overview beneficiary][v0013-2] Champ profession

__v0.0.24__

  - Hotfix : \#161 : Bug 171
  
__v0.0.23__

  - \#161 : Bug 171 (part 1) :[Prescription of Data monitoring] prevent to add a prescription for a already scheduled parameter
  - \#94  : [Rights] Elements ne devraient pas être éditables
  
__v0.0.22__

  - \#160 : Bug 224 : [Beneficiary overview][v009.1] Nutritional status
  - \#159 : Bug 212 : [Physiological data][Results from data recording/Filter][physioDOM-v0.0.8] trie de la list des provider/professionel
  - \#158 : added range checking for current health and datarecord
  - \#117 : [List Management][physioDOM-v0.0.16] Standard List Update Form
  - \#149 : [Directory/Pro_Edit][physioDOM-v0.0.20] Change role
  - \#155 : [Data recording] Create a event when detecting measures in data record that are out of range defined by thresholds limits
  - \#77  : Titles fixed
  - \#157 : [Beneficiary create] on successfull save, refresh the page
  - \#156 : [Beneficiary overview] Add a info panel when no beneficiaries are attached to the account
  - [Beneficiary Overview] Fix professionals table
  
__v0.0.21__

  - \#146 [Beneficiary][physioDOM-v0.0.19] Suppression beneficiaire
  - \#54 Added warning message to modal for validate action
  - \#148 [Directory/Pro_Edit][physioDOM-v0.0.20] Organization Type
  - \#94 [Rights] Elements ne devraient pas être éditables
  - \#79 [Beneficiary][physioDOM-v0.0.15] BeneficiarySelection Reset Filter
  - \#154 [Dietary&Physical Activity/Dietary Plan] create event
  - \#114 [Dietary&Physical Activity/Dietary Plan][physioDOM-v0.0.16] Save changes
  - \#151 [Data section/Results from Data Recording][physioDOM-v0.0.20] Professional Filter
  - \#153 [Quick look on HHR / Data Curves] prevent saving threshold with alpha character
  - \#150 [Current health status/Activity-Motricity status][physioDOM-v0.0.20] Invalid Date
  - \#86 [Beneficiary/Bene_overview][physioDOM-v0.0.15] Events log
  - \#147 Hotfix : [Quick look on HHR/Message To Home/New Message][physioDOM-v0.0.20] "New Message" button doesn't work
  - [DataRecord] Added comment info to DataRecords params + adapting UI
  - [DataRecord] Added statuses coming from health status to datarecord when its validate
  - [Health Status] Added config array for selecting the health Status section to be validated for authorizing datarecords
  
> __Nota :__   (Issue \#82) Event log & professional contact collapsed by default is not valid and these panels must not be collapsed.

__v0.0.20__

  - Beneficiary login
  - Current Health Status
    - All Current statuses must be validate before creating data records ( from concusltation or home )
    - Data records created from Current statuses are locked
  
__v0.0.19__

> Nota : don't forget to apply the initDB/lists.json modification

  - \#145 : [Beneficiary/Bene_edit/Address][physioDOM-v0.0.18] City
  - \#144 : [Data sect°/Prescript° Data monitoring][physioDOM-v0.0.18] Delete Button
  - \#143 : [Data sect°/Prescript° Data monitoring/Symptom assessments][physioDOM-v0.0.18] Save button
  - \#141 : [Current health status/Nutritional Status][physioDOM-v0.0.18] Remove Assistance Services checkboxes
  - \#140 : Bug 113 [Create/Update Professional/Delete du professionnel][physioDOM-v0.0.16] Contrôle d’intégrité
  - \#139 : [Result synthesis][[physioDOM-v0.0.18] Results list
  - \#124 : [Beneficiary/Bene_edit][physioDOM-v0.0.16] Personal data
  - \#120 : [Rights] Problème utilisateur sans droit
  - \#116 : [Data sect°/Prescript° Data monitoring/Gral physiological data][physioDOM-v0.0.16] Display Threshold Values
  - \#114 : [Dietary&Physical Activity/Dietary Plan][physioDOM-v0.0.16] Save changes
  - \#107 : Bug 154 [Directory/Pro_edit][physioDOM-v0.0.16] Telecom
  - \#105 : [Directory/Directory List][physioDOM-v0.0.16] Telecom
  - \#102 : [Beneficiary/Bene_edit][physioDOM-v0.0.16] Diagnosis
  - \#101 : [Beneficiary/Bene_edit][physioDOM-v0.0.16] Professional List
  - \#71  : [Quick look on HHR/Message To Home][physioDOM-v0.0.15] Filter Issue
  

__v0.0.18__ debug release

> Nota : fixed bugs number are from gitlab

  - \#126 : [Beneficiary/Bene_edit][physioDOM-v0.0.16] Life condition
  - \#121 : [Login][physioDOM-v0.0.16] Login Policies
  - \#103 : Titre de l'application (dans l'onglet)
  - \#115 : [Data sect°/Prescript° Data monitoring/Gral physiological data][physioDOM-v0.0.16] Date US Format
  - \#127 : [data curves/global][v0013-2] messages an error occured ( Bug 263 )
  - \#127 : prevent select a start date after the end date and reciprocally
  - \#135 : Calendar behind the menu bar on the beneficiary create page
  - \#130 : Bug 226 - [Login][v009.1] lowercase login
  - \#129 : Bug 227 - [Directory][v009.1] Droit compte admin/coord
  - \#128 : Bug 209 - [Physiological data][Results from data recording/Edit][physioDOM-v0.0.8] remplacer provider par professional
  - \#123 : [Boites de Dialogue][physioDOM-v0.0.16] Save changes
  - \#122 : Bug 168 - [Physiological data/Data Recording][physioDOM-v0.0.6.1] Save button
  - \#120 : [Rights] Problème utilisateur sans droit
  - \#118 : [Data section/Results from Data Recording][physioDOM-v0.0.16] Display Issues
  - \#134 : Bug 201 - [Current Health Status/all][physioDOM-v0.0.8] champs manquant (status, date, ...)
  - \#132 : Bug 63 - [Globale][physioDOM-v0.0.3] Interface graphique globale
  - \#131 : Bug 225 - [Global][v009.1] Erreur update après utilisation

__v0.0.17__ debug release

  - [Boites de Dialogue][physioDOM-v0.0.16] Save changes ( \#123 internal )
  - \#168 [Physiological data/Data Recording][physioDOM-v0.0.6.1] Save button ( \#122 internal )
  - [Rights] Problème utilisateur sans droit ( \#120 internal )
  - \#162 [Quicklook/Physiological data][physioDOM-v0.0.6.1] paramètre non activé ( \#113 internal )
  - \#120 [List Management/Service Type Health et Social][physioDOM-v0.0.4] Category non present ( \#100 internal )
  

__v0.0.16__ debug release

  - \#247 Fix Label Questionnaire prescription
  - \#66 Added uppercase to first letter in labels
  - \#251 +1 day to the 'to' date to be able to see chosen date in results
  - \#254 Added profession field and value to view/schema
  - \#248 added rule to check professionals affiliation 
  - \#110 & #94 Added Utils method to limit input and textarea
  - \#118 Check references in the same list : case insensitive comparaison
  
  
__v0.0.15__ debug release

  - \#249 [Bene overview][v011] la valeur de Height n'est pas bonne
  - \#256 - Organization checkbox
  - \#203 - Assistance Service
  - \#154 - Champ Telecom
  - \#152 - Ajouter professionnel
  - \#253 & #198 - Current Health Status Validate
  - \#169 - Saisie des seuils
  
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
    - \#73 : Directory CSV export 
    - \#74 : non specifié
    - \#78 : Erreur sauvegarde mail ( Directory )
    - \#88 : Signalement perte de saisie
    - \#95 : Message erreur incomplet sur erreur de date de naissance ( beneficiary create )
    - \#100 : Tri de la liste des professionels attachés à un beneficiare
    - \#112 : Directory create plantage sur civilité et organisation
    - \#113 : Controle d'intégrité ( suppression d'un professionel attaché à des beneficiares )
    - \#119 : Liste à compléter
    - \#147 : Filtre sur les beneficiares
    - \#180 : Listes vides
    - \#181 : Bouton menu
    - \#182 : Uniformaisation des champs date ( prescription of data monitoring )
    - \#187 : chanmp demande trop petit ( non spécifie )
    - \#189 : Bouton validate
    - \#197 : Current health status well being problème de formulaire
    - \#204 : Eetscore manquant
    - \#206 : Synthèse des résultats : pas de tri
    - \#224 : Nutritional status label au lieu de la référence
    - \#232 : organizationType en double
    - \#246 : Affichage des seuils dans le graphe ( non reproduit )
    - \#238 : Taille des messages to home
    
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

  
