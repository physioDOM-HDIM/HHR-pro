'use strict';

function init() {
	moment.locale(Cookies.get("lang"));
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

window.addEventListener("polymer-ready", init, false);