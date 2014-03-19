% Notes
% Fabrice Le COz
% 2014-03-19

# Requirement

For creating responsive design web site, we will use common library :

 - bootstrap v3.1.1
 - Jquery 

To facilitate install of web component we will use soon bower.

For the server part, we will use nodejs as web server and probably mongoDB as database.

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

The basis elements of the UI must be positionned in absolute position to be rendered on iPad. IOS7 and desktop safari 
lacks supporting the `flex` property.

table with fixed header : http://mkoryak.github.io/floatThead/datatables/
