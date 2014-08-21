% PhysioDOM REST service
% Fabrice Le Coz
% August 2014

# List

For most get request the result will be a list of items.

Lists will always follow the same schema :

~~~
{
	nb : xx              // number of elements
	pg : x               // page number default is 1
	offset : xx          // number of items by page
	items: [             // array of items
	  { item }
	] 
}
~~~

if there is no items available the service must respond with : 

~~~
{
	nb : 0              // number of elements
	pg : 1               // page number default is 1
	offset : xx          // number of items by page
	items: []
}
~~~

If the client request for an page out of range, the service must respond 400 with the message "page out of range"

rather that doing 2 requests to the database, one for the count, one for the list, use method like this :

~~~
function count( cursor ) {
	var promise = new Promise( function(resolve, reject) {
		cursor.count( function(err, count) {
			resolve(count);
		});
	});
	return promise;
}

function getList( cursor, pg, offset) {
	var promise = new Promise( function(resolve, reject) {
		count(cursor)
			.then( function(nb) {
				var list  = { nb: nb, pg: pg || 1, offset:offset || 20, items:[] };
				cursor.skip( (list.pg - 1) * list.offset).limit( list.offset ).toArray( function(err, results) {
					if(err) { reject(err); }
					list.items = results;
					resolve( list );
				});
			});
	});
	return promise;
}

function getBeneficiaries( pg, offset ) {
	var pg = (pg && +pg === parseInt(pg) && pg > 0 )?pg:1;
	var offset = (offset && +offset === parseInt(offset) && offset > 0 )?offset:10;
	
	var cursor = db.collection("beneficiaries").find();
	return getList(cursor, pg, offset);
}
~~~

