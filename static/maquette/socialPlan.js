window.addEventListener("DOMContentLoaded", init, false);

var Calendar1, Calendar2, Calendar3;

function init() {
	Calendar1 = new dhtmlXCalendarObject("calendar1");
	Calendar2 = new dhtmlXCalendarObject("calendar2");
	Calendar3 = new dhtmlXCalendarObject("calendar3");

	tinymce.init({
		selector: "#contentMsg",
		plugins: [],
		toolbar: "bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent",
		statusbar : false,
		menubar : false
	});
}