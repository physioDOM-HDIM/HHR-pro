'use strict';
/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

var Utils = new Utils();

function init() {
	moment.locale(Cookies.get("lang")==="en"?"en-gb":Cookies.get("lang"));
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
	if( document.querySelector("#biomasterStatus") && document.querySelector("#biomasterStatus").value === "pending" ) {
		setTimeout(getQueueStatus,2000);
	}
	
	if( Utils.isSafari() ) {
		document.querySelector( "zdk-panel#personal").style.float = "left";
	}
	
	var statusDate = document.getElementById("status-date");
	if( statusDate && statusDate.getAttribute("data-value") ) {
		var tmpDate = moment(statusDate.getAttribute("data-value"));
		if( tmpDate.isValid() ) {
			statusDate.innerHTML = tmpDate.format("L LT");
		}
	}
}

function initQueueDlg() {
	var dlg = document.querySelector("#initDlg");
	dlg.show();
}

function initQueue() {
	var dlg = document.querySelector("#initDlg");
	dlg.hide();

	var statusSpanOK = document.querySelector("#queueStatusOK");
	var statusSpanUnknown = document.querySelector("#queueStatusUnknown");
	var statusSpanPending = document.querySelector("#queueStatusPending");

	if( !statusSpanOK.classList.contains("hidden") ) { statusSpanOK.classList.add("hidden"); }
	if( !statusSpanUnknown.classList.contains("hidden") ) { statusSpanUnknown.classList.add("hidden"); }
	if( statusSpanPending.classList.contains("hidden") ) { statusSpanPending.classList.remove("hidden"); }
	
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
	setTimeout(getQueueStatus, 5000 );
}

function getQueueStatus() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET','/api/beneficiary/status', true );
	xhr.onload = function() {
		var statusSpanOK = document.querySelector("#queueStatusOK");
		var statusSpanUnknown = document.querySelector("#queueStatusUnknown");
		var statusSpanPending = document.querySelector("#queueStatusPending");
		
		var status = JSON.parse( this.responseText );
		if (status.biomasterStatus === true) {
			statusSpanOK.classList.remove("hidden");
			statusSpanPending.classList.add("hidden");
		}
		if (status.biomasterStatus === false) {
			statusSpanUnknown.classList.remove("hidden");
			statusSpanPending.classList.add("hidden");
		}
		if (status.biomasterStatus === "pending") {
			setTimeout(getQueueStatus,2000);
		}
		console.info( "queue status ",this.responseText);
	};
	xhr.onerror = function() {
		console.log( "init queue ");
		console.log( this.responseText );
	};
	xhr.send();
}

function disableWarning() {
	new Modal('disableWarningStatus', function() {
		var xhr = new XMLHttpRequest();
		
		xhr.open('POST','/api/beneficiary/warning', true );
		xhr.onload = function() {
			if( xhr.status === 200 ) {
				window.location.reload();
			} else {
				console.log( "bad status code", xhr.status );
			}
		};
		xhr.onerror = function() {
			console.log( "oops an error occurs" );
		};
		xhr.send('{ "status":false }');
	});
}

window.addEventListener("polymer-ready", init, false);