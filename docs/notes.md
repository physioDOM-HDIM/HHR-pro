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
