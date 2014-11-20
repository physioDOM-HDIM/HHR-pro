window.addEventListener("DOMContentLoaded",init,false);

function init() {
	setFixedTable("#stakeholders");
	setFixedTable("#personalContact");
	document.querySelector("#collapse2").classList.remove("in");
	document.querySelector("#collapse3").classList.remove("in");
}