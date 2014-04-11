# Prerequisite

nginx and nodejs must be installed on the server.

nodejs version must be 0.10.*.

# configure nginx

nginx is use as reverse proxy for the application, and will deliver static file for the application.

The configuration file is `physiodom.telecomsante.com` and must be linked in the `site-enabled` directory of nginx
configuration, typically in /etc/nginx/site-enabled on a linux system.

> nota : on a developper computer, you must also add `physiodom.telecomsante.loc` to your hosts file.
>
>     127.0.0.1       physiodom.telecomsante.loc
>

```bash
ln -s ${PWD}/install/physiodom.telecomsante.com /usr/local/etc/nginx/site-availbale/
ln -s /usr/local/etc/nginx/site-availbale/physiodom.telecomsante.com /usr/local/etc/nginx/site-enabled/
``

```bash
npm install
cd static
bower install
cd ..
npm start
```

