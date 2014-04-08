window.addEventListener("DOMContentLoaded",init,false);

function init() {
	setFixedTable("#recipients");
	
	var buttons = document.querySelectorAll("#recipients button");
	var func = function() { 
		location.href = 'recipientDetail.htm'; 
	};
	Array.prototype.forEach.call(buttons, function(button) {
		button.addEventListener("click", func, false );
	})
}