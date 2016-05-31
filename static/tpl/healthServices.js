"use strict";

var Utils = new Utils();

function expand(obj) {
	var parent = obj.parentNode;
	if(parent.querySelector(".content").classList.contains("hidden")) {
		parent.querySelector("core-icon").setAttribute("icon", "expand-more");
	} else {
		parent.querySelector("core-icon").setAttribute("icon", "expand-less");
	}
	parent.querySelector(".content").classList.toggle("hidden");
}

function showForm() {
	var modal = document.querySelector("zdk-modal#form");
	modal.show();
}

var text = document.querySelector("textarea");

function doGetCaretPosition(ctrl) {
	var CaretPos = 0;	// IE Support
	if (document.selection) {
		ctrl.focus();
		var Sel = document.selection.createRange();
		Sel.moveStart('character', -ctrl.value.length);
		CaretPos = Sel.text.length;
	}
	// Firefox support
	else if (ctrl.selectionStart || ctrl.selectionStart == '0')
		CaretPos = ctrl.selectionStart;
	return (CaretPos);
}

function setCaretPosition(ctrl, pos) {
	if (ctrl.setSelectionRange) {
		ctrl.focus();
		ctrl.setSelectionRange(pos, pos);
	}
	else if (ctrl.createTextRange) {
		var range = ctrl.createTextRange();
		range.collapse(true);
		range.moveEnd('character', pos);
		range.moveStart('character', pos);
		range.select();
	}
}

text.addEventListener("keyup", function () {
	// 60 caractères par lignes
	var val = this.value;
	var lines = val.split("\n");
	var line, count = 0;
	var pos = doGetCaretPosition(this);
	var nb = 0;
	var cut = 0;
	do {
		if (lines[count].length > 60) {
			line = lines[count].slice(60);
			lines[count] = lines[count].slice(0, 60);
			// console.log( "("+count+") line : " + line );
			// console.log(lines[count] +" - "+ line);
			if (!cut) {
				cut = nb + 60;
			}
			if (lines[count + 1]) {
				lines[count + 1] = line + lines[count + 1]
			} else {
				lines.push(line);
			}
		} else if (!cut) {
			nb += lines[count].length + (count + 1 < lines.length ? 1 : 0);
		}
	} while (lines[++count]);
	this.value = "";
	for (i = 0, l = lines.length; i < l; i++) {
		this.value += (i !== 0 ? "\n" : "") + lines[i];
	}
	// console.log( "pos ",pos, nb, cut );
	setCaretPosition(this, pos + (cut && pos > cut ? 1 : 0));
}, false);

window.addEventListener("polymer-ready", function() {
	console.log( "components are ready" );
	Utils.promiseXHR("GET", "/api/lists/healthServices", 200)
		.then( function( _services ) {
			var services = JSON.parse(_services);
			// console.log( services );
			var typeInp = document.querySelector("#input-type");
			var options;
			services.items.forEach( function(service) {
				options += '<option value="'+service.ref+'" >'+ service.label.en +'</option>';
			});
			typeInp.innerHTML = options;
			
		});
});