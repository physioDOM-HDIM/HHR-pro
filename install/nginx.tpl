server {
    listen       80;
    server_name  {{serverName}};
{% if sslDir %}
    # redirect all http traffic to https
    rewrite      ^ https://$server_name$request_uri? permanent;
}

server {
    listen 443;
    server_name {{serverName}};

    ssl on;
    ssl_certificate     {{sslDir}}/server.crt;
    ssl_certificate_key {{sslDir}}/server.key;
{% endif %}

    access_log  {{logDir}}/access.log;
    error_log   {{logDir}}/error.log;

    location ~ (index\.htm|ui\.htm) {
        return 301 /;
    }

    location ~  \.(jpeg|gif|png|ico|css|zip|tgz|gz|rar|bz2|pdf|txt|tar|wav|bmp|rtf|js|flv|swf|html|htm|woff|woff2|svg)$ {
        set $args "v={{version}}";
        rewrite ^(.*)$ $1?${args} break;
        root {{rootDir}};
    }
  
    location ~  \.(jpeg|gif|png|ico|css|zip|tgz|gz|rar|bz2|pdf|txt|tar|wav|bmp|rtf|js|flv|swf|html|htm|woff|woff2|svg)(\?v=[0-9.]+(-.*)?)?$ {
        # access_log off;
        expires off;
        root {{rootDir}};
    }

    location / {
        proxy_pass http://127.0.0.1:{{appPort}};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
