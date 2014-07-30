server {
        listen   80; ## listen for ipv4; this line is default and implied
        #listen   [::]:80 default ipv6only=on; ## listen for ipv6


        # Make site accessible from http://physiodom.telecomsante.com/
        server_name physiodom.telecomsante.*;

				access_log  /Users/fablec/Sites/PhysioDOM/log/access.log;
				error_log   /Users/fablec/Sites/PhysioDOM/log/error.log;

				location ~ (index\.htm|ui\.htm) {
					return 301 /;
				}
				
        location ~  \.(jpeg|gif|png|ico|css|zip|tgz|gz|rar|bz2|pdf|txt|tar|wav|bmp|rtf|js|flv|swf|html|htm)$ {
          # access_log off;
          expires max;
          root /Users/fablec/Sites/PhysioDOM/static;
        }
				

        location / {
                proxy_pass http://127.0.0.1:8001;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                # access_log off;
        }

}