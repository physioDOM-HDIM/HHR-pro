function showDetail(btn) {
	var message = btn.parentNode.parentNode.parentNode.parentNode;
	var detail = message.querySelector("div.detail");
	detail.classList.toggle("show");
}

function showDlg(dlgID) {
	var bg = document.querySelector("#bg");
	bg.style.display = "block";
	var dlg = document.querySelector(dlgID);
	insertAfter(dlg,bg);
	dlg.classList.toggle("show");
}

function hideDlg(dlgID) {
	var bg = document.querySelector("#bg");
	var dlg = document.querySelector(dlgID);
	if(dlg) {
		dlg.classList.toggle("show");
	}
	if(bg) {
		bg.style.display = "none";
	}
}

function insertAfter(newElement,targetElement) {
	//target is what you want it to go after. Look for this elements parent.
	var parent = targetElement.parentNode;

	//if the parents lastchild is the targetElement...
	if(parent.lastchild == targetElement) {
		//add the newElement after the target element.
		parent.appendChild(newElement);
	} else {
		// else the target has siblings, insert the new element between the target and it's next sibling.
		parent.insertBefore(newElement, targetElement.nextSibling);
	}
}


(function init() {
	var ul = document.querySelector("ul.messages");
	var li = ul.querySelector("li");
	var newMsg;

	for(var i=0;i < 30; i++ ) {
		newMsg = li.cloneNode(true);
		ul.appendChild(newMsg);
	}

	/*
	tinymce.init({
		selector: "#contentMsg",
		plugins: [],
		toolbar: "bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent",
		statusbar : false,
		menubar : false
	});

	tinymce.init({
		selector: "#commentMsg",
		plugins: [],
		toolbar: "bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent",
		statusbar : false,
		menubar : false
	});
	*/

	Calendar1 = new dhtmlXCalendarObject("calendar1");
	Calendar2 = new dhtmlXCalendarObject("calendar2");
})();