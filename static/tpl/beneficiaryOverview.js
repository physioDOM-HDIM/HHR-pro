'use strict';

function init() {
	moment.locale(Cookies.get("lang")=="en"?"en-gb":Cookies.get("lang"));
	var listPager = document.querySelector('tsante-list');
	listPager.addEventListener('tsante-response', function(data) {
		var list = data.detail.list;
		var i = 0,
			len = list.items.length;
		for (i; i < len; i++) {
				// the date is displayed in local time
				list.items[i].date = moment(list.items[i].datetime).format("L LT") ;
				list.items[i].dateFrom = moment(list.items[i].datetime).from(moment());
		}
		this.render(list);
	});
}

function initQueue() {
	
	var xhr = new XMLHttpRequest();
	xhr.open('GET','/api/queue/init', true );
	xhr.onload = function() {
		console.log( "init queue ");
		console.log( this.responseText );
	};
	xhr.onerror = function() {
		console.log( "init queue ");
		console.log( this.responseText );
	};
	xhr.send();
}

window.addEventListener("polymer-ready", init, false);