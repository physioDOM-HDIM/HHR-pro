(function init() {
	document.querySelector("#beneficiary").style.display = "block";
	
	scheduler.clearAll();
	scheduler.config.multi_day = true;

	scheduler.config.xml_date="%Y-%m-%d %H:%i";
	scheduler.config.first_hour = 8;
	scheduler.config.last_hour = 21;
	scheduler.config.hour_size_px = 80;
	scheduler.init('scheduler_here',null,"week");
	scheduler.load("./data/events.json","json");
})();

function show_minical() {
	if (scheduler.isCalendarVisible())
		scheduler.destroyCalendar();
	else
		scheduler.renderCalendar({
			position:"dhx_minical_icon",
			date:scheduler._date,
			navigation:true,
			handler:function(date,calendar){
				scheduler.setCurrentView(date);
				scheduler.destroyCalendar()
			}
		});
}