
# Services

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

A daily service :

```
{
	"subject" : ObjectId("559a3edde137390900e529b0"),
	"category" : "HEALTH",
	"source" : ObjectId("56092ce10c83d2c2036363be"),
	"provider" : ObjectId("56092ce10c83d2c2036363be"),
	"ref" : "NURSING",
	"frequency" : "daily",
	"repeat" : 1,
	"startDate" : "2015-09-28",
	"duration":"00:30",
	"time": "10:00"
}
```

> __Nota :__ ponctual services have the same structure as daily services, with :
> 
>   - repeat = 0
>   - endDate = startDate
>   - frequency = "punctual"
>

A Weekly service

```
{
	"subject" : ObjectId("559a3edde137390900e529b0"),
	"category" : "HEALTH",
	"source" : ObjectId("56092ce10c83d2c2036363be"),
	"provider" : ObjectId("56092ce10c83d2c2036363be"),
	"ref" : "NURSING",
	"frequency" : "weekly",
	"repeat" : 1,
	"startDate" : "2015-09-28",
	"duration":"01:00"
	"when": [
	    { "day":"tuesday",  "time":"10:00" },
	    { "day":"thursday", "time":"10:00" },
	]
}
```

> __Nota :__ for weekly event, day is the day of the week.

A monthly service

```
{
    _id: "560a5ca2b1d142313d1a2414",
    subject: "559a3edde137390900e529b0",
    category: "HEALTH",
    source: "56092ce10c83d2c2036363be",
    provider: "56092ce10c83d2c2036363be",
    ref: "NURSING",
    frequency: "monthly",
    repeat: 1,
    startDate: "2015-09-28",
    endDate: "2015-12-31",
    time : "16:00",
    when: [ 1, 15, 28 ],
    detail: "Test de service\nToutes les instances d'un service mensuel ont tous la même heure",
    duration: "00:30"
}
```

> __Nota :__  for monthly event, day is the day of the month.

Un service ne peut pas être supprimé afin de garder l'historique des prescription pour le patient. 
Il peut être désactivé :

  - ajouter une propriété `active`
  - ajouter une objet `deactivate` avec 
    - date
    - source : id du professionel qui desactive le service

> __Nota :__ prevoir peut être un droit spécifique pour désactiver les services.

Afin de faciliter la compréhesion de l'affichage il serait bien d'ajouter un titre ( label ) en option pour un service.


get a service by its ID :
  - request : /api/beneficiary/services/560a5ca2b1d142313d1a2414
  - result
  ~~~
  {
      _id: "560a5ca2b1d142313d1a2414",
      subject: "559a3edde137390900e529b0",
      category: "SOCIAL",
      source: "56092ce10c83d2c2036363be",
      provider: "56092ce10c83d2c2036363be",
      ref: "SHOPHELP",
      frequency: "monthly",
      repeat: 1,
      startDate: "2015-09-28",
      time: "16:00",
      when: [  1, 15, 28 ],
      detail: "Test de service Toutes les instances d'un service mensuel ont tous la mÃªme heure",
      duration: 30,
      providerName: {
          family: "Admin",
          given: "System"
      },
      sourceName: {
          family: "Admin",
          given: "System"
      },
      refLabel: {
          en: "Help with shopping",
          nl: "Hulp bij boodschappen",
          es: "Ayuda a compra",
          fr: "Aide pour les courses"
      }
  }
  ~~~

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

