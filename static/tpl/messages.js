function showDetail(btn) {
	var message = btn.parentNode.parentNode.parentNode.parentNode;
	var detail = message.querySelector("div.detail");
	detail.classList.toggle("show");
}

(function init() {
	document.querySelector("#beneficiary").style.display = "block";
	
	var ul = document.querySelector("ul.messages");
	console.log(ul);
	var li = ul.querySelector("li");
	var newMsg;

	for(var i=0;i < 30; i++ ) {
		newMsg = li.cloneNode(true);
		ul.appendChild(newMsg);
	}

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
})();