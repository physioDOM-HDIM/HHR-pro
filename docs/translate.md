% PhysioDOM : Language management
% Fabrice Le Coz
% July 2014

# Goal

The Physiodom application must manage the site in several languages (English, Spanish, Dutch). There are several solutions to manage languages on a website.

John Resig describes a strategy in his article [Strategy for i18n and Node.js][1]

It exists several modules for node to manage i18n ( here some of these ) :

  - [i18n-2][2] The John Resig library
  - [i18next][3] A module for node and browser

# Requirement

Depending of the strategy and requests some translations could be done server side, and some browser side.

The translation will apply only on labels and template pages, and will not translate user inputs.

All labels in the database, will be referenced by a code. This code will be use in the locale files to translate the label in the user language.

As all the localized files will be store in memory, the application must load only that the proper localized file, especially in the case of the browser to avoid heavy memory consumption.

The language setting of the user is defined by the site and could be overwritten by a special choice. The language setting will be stored in a cookie.

[1]: http://ejohn.org/blog/a-strategy-for-i18n-and-node/ "Strategy for i18n and Node.js"
[2]: https://github.com/jeresig/i18n-node-2 "i18n-node-2"
[3]: https://github.com/jamuhl/i18next-node "i18next-node"

The language preference will be saved as a cookie in the user browser : locale. For PhysioDOM application accepted values
will be "en-gb","es","nl" and "fr" 

