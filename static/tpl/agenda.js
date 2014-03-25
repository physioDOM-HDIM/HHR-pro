(function init() {
	scheduler.config.multi_day = true;

	scheduler.config.xml_date="%Y-%m-%d %H:%i";
	scheduler.init('scheduler_here',new Date(2010,0,10),"week");
	scheduler.load("./data/events.xml");
})();

function show_minical(){
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