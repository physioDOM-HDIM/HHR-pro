var fs = require("fs"),
	Promise = require("rsvp").Promise,
	exec = require("child_process").exec;

var DB_FILE = require("path").join(__dirname, "testDB.tar.bz2");

function testTools() {
	/**
	 * Dump the mongo database into a file
	 *
	 * @param {String} filepath (optional)
	 * @param {Function} cb - callback, gives (err, filepath)
	 * @return none
	 */
	function mongodump (filepath, cb) {
		filepath = filepath || DEFAULT_DUMP;

		// Connexion string
		var cnx = '--host ';

		// Add replicaSet name if exists
		if (_config.replicaSet) cnx += _config.replicaSet + '/';

		// Add replicaSet servers or server
		cnx += _config.server.join(',');

		// Check if file exists
		fs.exists(path.dirname(filepath), function (exists) {
			if (!exists) return cb(filepath + ' does not exist');
			var cmd = 'mongodump ' + cnx + ' -d ' + _config.database
			cmd += ';  tar -cvjf ' + filepath + ' dump'
			cmd += ';  rm -rf dump';
			exec(cmd, function (err, stdout, stderr) {
				if (err) return cb(err);
				return cb(null, filepath);
			});
		});
	}

	/**
	 * Restore the mongo database from a file
	 *
	 * @param {String} filepath - restoration filepath
	 * @param {Function} cb - callback, gives (err)
	 * @return none
	 */
	function mongoRestore(filepath ) {
		return new Promise( function(resolve, reject) {
			// Check if file exists
			fs.exists(filepath, function (exists) {
				if (!exists) return reject( "mongoRestore : "+ filepath + " does not exist");
				var cmd = 'tar -xvjf ' + filepath
				cmd += ';  mongorestore -d physioDOM --drop dump/physioDOM/'
				cmd += ';  rm -rf dump';
				exec(cmd, function (err, stdout, stderr) {
					if (err) return reject(err);
					return resolve();
				});
			});
		});
	}
	
	this.before = function() {
		return mongoRestore( DB_FILE );
	};
}

module.exports = new testTools();