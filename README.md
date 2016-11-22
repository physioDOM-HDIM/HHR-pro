# PhysioDOM HDIM Portal

This project contains the source code of the professional portal of the physiodom platform.

The sources of this project are licenced to the CC BY-NC 4.0, see the licence.md file or consult
[the common creative site][1]

PhysioDom–HDIM proposes an ICT platform that offers on a large territory a new service – Home Dietary 
Intake Monitoring based on readings and monitoring of weight, lean/fat ratio and physical activity, 
complemented with an intervention structure and strategy – the Home Diet Coaching. PhysioDom-HDIM is 
an innovative ICT solution that enhances living conditions for senior citizens, as well as improving 
the efficiency and integration health and social care systems. The PhysioDom HDIM system has been 
developed based on a small French pilot, the Reseau Vercors Sante project, which successfully trialled 
the system in 50 homes and engaged with 70 health and social care professionals. The pilot was run over 
a two year period and delivered positive results and acceptance by its users. It now needs to be on a 
larger scale that involves all of the players -from institutions to end-users at home.

This project has been realized in the context of an [european project][2]

The physioDOM-HDIM portal has been realized by [Telecom Sante][3]

For more information about the PhysioDOM HDIM project consult the [web site][4]

For more documentation about the PhysioDOM platform consult the project [Physiodom-doc][5]

The Portal is delivered as a docker image named physiodom:x.y.z

# Build the image

check out the project, then build the image :

    docker build -t physiodom:x.y.z .

# running the image

To run the image, refer to the [docs project][5]

    docker run -d --name hhrpro-prod -h hhrpro-prod \
           -v $PWD/config/hhrpro:/config \
           -v $PWD/logs:/logs \
           --link etcd:etcd \
           --link mongo:mongo \
           physiodom:x.y.z

The config/hhrpro must contain :

 - a config file named 'config.conf'
 - a text template for mailing
 - an html template for mailing

~~~
{
  "port":8001,                                     <-- internal port of the nodejs application
  "cache":true,                                    <-- use cache for templates
  "server": {                                      <-- protocol and url of the portal
    "protocol":"http://",
    "name":"hhrpro-demo.physiodom.eu"
  },
  "mongo": {                                       <-- connection to the database 
    "ip":"mongo",
    "db":"physiodom-demo"
  },
  "Lang":"en",                                     <-- default language
  "languages":["en","es","nl","fr"],               <-- available language list
  "country":"France",                              <-- Default country for the beneficiaries
  "healthStatusValidation": [
    "activity",
    "frailty",
    "nutrition"
  ],
  "agenda":"0 0,6,7,8,9,10,11,12,13,14,15,16,17,18 * * *", <-- agenda cron ( sending agenda to the queue )
  "agendaForce":"30 1 * * *",                              <-- forced agenda cron
  "key":"e4ffe85c-f5fe-4fd9-96b2-63dc7ee58e3d",
  "queue": {                                       <-- Queue server (optional)
    "protocol":"http",
    "ip":"queue",
    "port":9000,
    "duration":4
  },
  "IDS": {                                         <-- data specific to the hosting platform
    "ip":"10.29.144.2",
    "appName":"physiodom-telecomsante",
    "unit":"test",
    "OrganizationUnit":"physiodom-test",
    "duration":1095
  },
  "smtp": {                                        <-- the mail server
    "host":"smtp.idshost.priv",
    "port":25
  },
  "timezone":"Europe/Paris",                       <-- the default timezone of the instance
  "mailTpl":"/config/uk-cyb-mail"                  <-- template of mails
}
~~~

# Mail templates

The mail templates are only needed if the hosting platform is IDS, 

## text template

to respect the config file, this file is named `uk-cyb-mail.txt`

~~~
Dear PhysioDom participant

To access your account details on the PhysioDom HHR-Pro system, you will first need to download a security certificate 
to allow your computer to access the data.

To retrieve the Security Certificate (you can retrieve this for one device) :

  1. You will need to use Google Chrome as your browser 
  2. The URL of website to retrieve the certificate = https://cert.idshost.fr 
  3. Login : {{account.email}} 
  4. Withdrawal code : [{{account.OTP}}]

Once your certificate is downloaded and installed, you can connect to your HHR-Pro system using Google Chrome:
  1. The URL of website to access your PhysioDom data record = https://uk-cyb.physiodom.eu 
  2. Login : {{account.email}} 
  {% if account.firstlogin %}
  3. Password : {{account.firstpasswd}} (The 3 digit code will be your unique participant number. You will be asked to reset the 
  password the first time you use the system to a password of your choosing)
  {% else %}
  3. Password : unchanged
  {% endif %}

If you are setting up on a tablet, go to settings in Google Chrome and tick the box “Request Desktop Site”.

If you have any problems with setting this up, please contact the support office on 01434 382808.
~~~

## html template

to respect the config file, this file is named `uk-cyb-mail.htm`

~~~
<div>
	<img src="cid:logo@physiodom.eu" style="width:200px;margin:auto">
	<br>
	<p>Dear PhysioDom participant</p>
	
	<p>To access your account details on the PhysioDom HHR-Pro system, you will first need to download a security certificate
		to allow your computer to access the data.</p>
	
	<p>To retrieve the Security Certificate (you can retrieve this for one device) :</p>
	
	<ol>
		<li>You will need to use Google Chrome as your browser </li>
		<li>The URL of website to retrieve the certificate = https://cert.idshost.fr </li>
		<li>Login : {{account.email}} </li>
		<li>Withdrawal code : {{account.OTP}}</li>
	</ol>
	
	<p>Once your certificate is downloaded and installed, you can connect to your HHR-Pro system using Google Chrome:</p>
	
	<ol>
		<li> The URL of website to access your PhysioDom data record = https://uk-cyb.physiodom.eu</li>
		<li> Login : {{account.email}}</li>
		{% if account.firstlogin %}
		<li> Password : {{account.firstpasswd}} ( You will be asked to reset the password the first time you use the system to a password of your choos
			ing)</li>
		{% else %}
		<li> Password : unchanged</li>
		{% endif %}
	</ol>
	
	<p>If you are setting up on a tablet, go to settings in Google Chrome and tick the box �~@~\Request Desktop Site�~@~].</p>
	
	<p>If you have any problems with setting this up, please contact the support office on 01434 382808.</p>
</div>
~~~


[1]: https://creativecommons.org/licenses/by-nc/4.0/legalcode
[2]: http://cordis.europa.eu/project/rcn/191789_en.html
[3]: http://www.telecomsante.fr/wordpress/en
[4]: http://physiodom.viveris.fr/
[5]: https://github.com/physioDOM-HDIM/docs



