window.addEventListener("DOMContentLoaded",init,false);

var Calendar1, Calendar2;

function init() {
	var ul = document.querySelector("ul.messages");
	var li = ul.querySelector("li");
	var newMsg;

	for(var i=0;i < 30; i++ ) {
		newMsg = li.cloneNode(true);
		ul.appendChild(newMsg);
	}

	Calendar1 = new dhtmlXCalendarObject("calendar1");
	Calendar2 = new dhtmlXCalendarObject("calendar2");
}