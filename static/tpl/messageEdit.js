window.addEventListener("DOMContentLoaded",init,false);

function init() {

	tinymce.init({
		selector: "#editMsg",
		plugins: [],
		toolbar: "bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent",
		statusbar : false,
		menubar : false
	});

}