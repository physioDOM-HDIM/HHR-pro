% initDB directory
% Fabrice Le Coz
% December, 2014

in this directory are stored json files to initialize the database

json files are created thanks to the `mongoexport` command by example :

    mongoexport -d physioDOM -c lists -o initDB/lists.json --jsonArray

json files are exported thanks to the `mongoimport` command by example :

    mongoimport -d physioDOM --drop -c lists --file initDB/lists.json --jsonArray

