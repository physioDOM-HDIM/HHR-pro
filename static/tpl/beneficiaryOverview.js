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
	if( document.querySelector("#biomasterStatus") && document.querySelector("#biomasterStatus").value === "pending" ) {
		setTimeout(getQueueStatus,2000);
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

window.addEventListener("polymer-ready", init, false);