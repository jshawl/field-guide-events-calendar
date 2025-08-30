(async function () {
  const formatEvents = (events) => events.map(formatEvent);
  const formatEvent = (unformattedEvent) => {
    const kvs = unformattedEvent.nameValuePair;
    const find = (name) => kvs.find((pair) => pair.name === name)?.value;
    const startDate = find("Event Start Date");
    const startTime = find("Event Start Time");
    const start = new Date(`${startDate}T${startTime}`);
    const endDate = find("Event End Date");
    const endTime = find("Event End Time");
    const end = new Date(`${endDate}T${endTime}`);
    const title = find("Event Name");
    const id = find("Event ID");
    const category = find("Event Category Name");
    return { id, title, start, end, startDate, endDate, category };
  };

  const getCategories = (events) =>
    Object.keys(
      events.reduce((cats, ev) => {
        return { ...cats, ...(ev.category ? { [ev.category]: true } : {}) };
      }, {})
    ).sort((a, b) => a.localeCompare(b));

  var calendarEl = document.getElementById("calendar");
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    eventClassNames: ["neoncrm-calendar-event"],
    headerToolbar: {
      right: "prev,next today",
      left: "title",
    },
    eventClick: function (info) {
      const url = `https://${neoncrm_calendar.org_id}.app.neoncrm.com/np/clients/${neoncrm_calendar.org_id}/eventRegistration.jsp?event=${info.event.id}`;
      window.open(url, "_blank");
    },
  });
  calendar.render();
  const eventsResponse = await fetch(neoncrm_calendar.rest_url);
  document.querySelector(".neoncrm-calendar .loading").remove();
  const eventsData = await eventsResponse.json();
  const events = formatEvents(
    eventsData.listEvents.searchResults.nameValuePairs
  );
  const categories = getCategories(events);
  const categoriesEl = document.querySelector(".neoncrm-calendar .categories");
  categories.forEach((cat) => {
    const button = document.createElement("button");
    button.innerText = cat;
    categoriesEl.appendChild(button);
  });

  let calendarEvents = events.map((event) =>
    calendar.addEvent({
      ...event,
      allDay: event.startDate !== event.endDate,
    })
  );
  categoriesEl.addEventListener("click", (e) => {
    categoriesEl.querySelector(".active")?.classList.remove("active");
    e.target.classList.add("active");
    calendarEvents.map((calendarEvent) => calendarEvent.remove());
    calendarEvents = events
      .filter(
        (event) =>
          e.target.innerText === "All" || event.category === e.target.innerText
      )
      .map((event) =>
        calendar.addEvent({
          ...event,
          allDay: event.startDate !== event.endDate,
        })
      );
  });
})();
