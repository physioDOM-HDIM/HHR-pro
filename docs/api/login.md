% PhysioDOM login
% Fabrice Le Coz
% September 2014


# Site access

As the physioDOM application hosts and serves medical data, the access must be secure and must ensure that the traffic could not be intercept by third parties.

This will be done by using the https protocol.

All traffic to the application by http will be redirect to use https, this will be done by nginx rules.

Without any credentials the only accessible page is the login page, for all other requests the server must respond by a 403 error message.
 
# Login

the login phase is very important in the physioDOM application as it must insure that only authorized users can connect to the application.
