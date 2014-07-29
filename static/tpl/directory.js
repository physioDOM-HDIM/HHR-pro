/* jslint browser:true */

var entry = {
	firtsname : "Firtsname",
	lastname : "Lastname",
	title: "M.",
	role: "physician",
	phone: {
		work: "0223262828",
		moblie: "0677555212"
	},
	email: "test@telecomsante.loc",
	perimeter:"perimeter 1"
}

window.addEventListener("DOMContentLoaded",init,false);

function init() {
	var dirList, dirEntry, str;
	
	dirList = document.querySelector("#directory");
	
	for(var i=0;i<20;i++) {
		dirEntry = document.createElement("li");
		dirEntry.classList.add("dirEntry");
		str = '<div>';
		str+= '<span class="name">'+entry.lastname.toUpperCase()+' '+entry.firtsname+'</span>';
		str+= '<span class="role">'+entry.role+'</span>';
		str+= '</div><div>';
		str+= '<span class="phone">'+entry.phone.work+'</span>'
		str+= '<span class="email"><a href="mailto:'+entry.email+'">'+entry.email+'</a></span>';
		str+= '<span class="perimeter">'+entry.perimeter+'</span>';
		str+= '</div>';
		dirEntry.innerHTML = str;
		dirList.appendChild(dirEntry);
	}
}