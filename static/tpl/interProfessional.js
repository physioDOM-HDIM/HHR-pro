window.addEventListener("DOMContentLoaded",init,false);

function init() {
	var ul = document.querySelector("ul.messages");
	var li = ul.querySelector("li");
	var newMsg;

	for(var i=0;i < 30; i++ ) {
		newMsg = li.cloneNode(true);
		ul.appendChild(newMsg);
	}
}