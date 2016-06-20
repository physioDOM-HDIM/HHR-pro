/**
 * upgrade database for HHR-Pro v1.1.12
 *
 * issue #301 : (Bug 636) Sunday was coded as 0 instead of 7
 */
Math.sign = function sign(x) {
    return !(x= parseFloat(x)) ? x : x >= 0 ? 1 : -1;
};

db.measurePlan.find({"frequency":"monthly"}).forEach(
		function(item) {
			var done = false;
			item.when.days.forEach( function(day, i) {
				if(day % 10 === 0) {
					item.when.days[i]+=Math.sign(day)*7;
					done = true;
				}
			} );
			if(done) {
				// printjson(item.when);
				db.measurePlan.save(item);
			}
		}
);


db.measurePlan.find({"frequency":"weekly"}).forEach(
		function(item) {
			var done = false;
			item.when.days.forEach( function(day, i) {
				if(day === 0) {
					item.when.days[i]+=7;
					done = true;
				}
			} );
			if(done) {
				// printjson(item.when);
				db.measurePlan.save(item);
			}
		}
);

db.services.find({"frequency":"monthly"}).forEach(
		function(item) {
			var done = false;
			item.when.forEach( function(day, i) {
				if(day % 10 === 0) {
					item.when[i]+=Math.sign(day)*7;
					done = true;
				}
			} );
			if(done) {
				// printjson(item.when);
				db.services.save(item);
			}
		}
);


db.services.find({"frequency":"weekly"}).forEach(
		function(item) {
			var done = false;
			item.when.forEach( function(day, i) {
				if(day === 0) {
					item.when[i]+=7;
					done = true;
				}
			} );
			if(done) {
				// printjson(item.when);
				db.services.save(item);
			}
		}
);
