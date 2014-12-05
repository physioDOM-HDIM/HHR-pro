% Front-end testing
% Bruno Ramires
% December, 2014

# Front-end Testing

## TheIntern

 - http://theintern.io/
 - https://github.com/theintern/intern-tutorial

## Binaries

Path: `[project directory]/bin`

|          | Selenium server   | ChromeDriver      |
|----------|:-----------------:|:-----------------:|
|version   |  2.44.0           | 2.12 (64 bits)    |
|download  | [selenium server] | [Chrome driver]   |

## TheIntern configuration file

https://github.com/theintern/intern/wiki/Configuring-Intern

Path: `physiodom/test/ui/conf_intern.js`

Before launching the functional test suites, check the **`conf_intern.js`** file to adapt it to your environment.

Check the line with the **environments** array. There are the different browsers you want to test. Here are informations
 to add new one with specific options : 
 
cf https://code.google.com/p/selenium/wiki/DesiredCapabilities

### Chrome

cf : https://code.google.com/p/selenium/wiki/ChromeDriver

Chrome must be installed in `/usr/bin/google-chrome`

### Firefox 

cf : https://code.google.com/p/selenium/wiki/DesiredCapabilities#Firefox_specific

Set the correct path to your firefox binary with `firefox_binary` attribute

### IE

cf : https://code.google.com/p/selenium/wiki/DesiredCapabilities#IE_specific

### Safari

cf : https://code.google.com/p/selenium/wiki/DesiredCapabilities#Safari_specific

## Usage

Functional tests are in the folder :
`physiodom/test/ui`

```
cd physiodom
java -jar bin/selenium-server-standalone-2.44.0.jar -p 4444 -Dwebdriver.chrome.driver=bin/ChromeDriver_64bit_2.12
node node_modules/intern/runner.js config=test/ui/conf_intern.js leaveRemoteOpen
```

 - Launching selenium server on port 4444 (cf. in conf_intern.js, the webdriver object) 
   using the chrome webdriver located in bin/
 - Launching the intern runner by node with the config file path in the config attribute. 
   The leaveRemoteOpen attribute is used if you want to keep opened the browser after tests finish

## New functional test

The path file of your new functional test must be inserted in the **functionalSuite** array of the `conf_intern.js` file.

https://github.com/theintern/intern/wiki/Writing-Tests-with-Intern

The `remote` object is a LeadFoot Command object, here are methods you can use : https://theintern.github.io/leadfoot/Command.html

Full Chai API Documentation: http://chaijs.com/api/

[selenium server]: http://www.seleniumhq.org/download/
[Chrome driver]: https://sites.google.com/a/chromium.org/chromedriver/downloads