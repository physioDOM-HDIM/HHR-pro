
Services

Le but est de pouvoir programmer des services de trois types :

  - Basic Health service
  - Assistance service
  - Basic social service
 
Dans la page "overview" 
  - afficher la liste des services actifs ( frequence, provider )

Dans la page "Agenda" ( Quick look)
  - afficher les services sous forme de "rendez-vous"
  - un clic sur un "event", doit permettre de voir le detail de ce dernier

La prescription des services se fait dans deux sous-sections du menu en fonction du type

  - Healthcare section : Basic Health service
  - Dietary plan : assistance service
  - Social section : Basic social service

La prescription d'un service :

  - category du service
  - type de service ( liste )
  - detail du service : champs texte
  - Provider : choix de la personne réalisant le service ( issue de la liste des professionels attachés au bénéficiare )
  - Prescriber : Personne prescrivant le service ( automatique en fonction du compte connecté )
  - Date : date de la prescription ou dernière mise à jour.
  - Meal on the day : pour les assistances.
  - programmation
    - When
    - Time of the service ( durée de la prestation )
    - start date & end date
    - Frequence 

La programmation d'un service est équivalent en terme d'affichage à la programmation d'une mesure.

Sur une création, une modification ou une suppression faire une entrée dans le journal ( events log ).

Transmission des services vers la box ( cf p10 & p11 du doc sirlan )
  
La taille des champs texte de descriptions est limité à 5 lignes de 60 caractères ( affichage TV )

> __Nota :__ il n'y a pas sur la TV de champs correspondant au repas, ni de champs correspondant a la durée ?!?

# Affichage

Si beaucoup de prestation de service on pourrait afficher juste le titre de la prestation et dérouler le contenu sur click

Pour la saisie des heures, mettre par défaut 09:00

Mettre un widget pour saisir l'heure.

Pour la saisie des rdv hebdomadaire permettre de deplacer d'un jour sur l'autre un rendez-vous par click'n drag




menuItem = db.menus.findOne( { label:/agenda/i } )
menuItem.disabled = false

tmp = db.menus.findOne( { "label" :/Messages to Home/i } )
menuItem.rights = tmp.rights;

db.menus.save( menuItem )

