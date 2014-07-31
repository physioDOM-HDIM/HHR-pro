% Installation
% Fabrice Le Coz
% July 2014

# prerequisite

The PhysioDOM application uses several software that have to be installed on the host server.

  - nginx : a web server
  - mongodb : a nosql database server

# Configuration

To configure nginx, you will have to create an `install.json` file in the install directory. A example of this file is given in the same directory ( see install.json.sample ).

just run : `npm install`when you have created the file.

Generaly the script create a file in the /etc/nginx/sites-available directory, create a symlink in the /etc/nginx/sites-enabled directory.

Then reload nginx : `sudo service nginx reload`
