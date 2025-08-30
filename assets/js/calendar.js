export const get = (kvs, name) => {
  return kvs.find((pair) => pair.name === name)?.value;
};

export const formatEvents = (unformattedEvents) =>
  unformattedEvents.map((unformattedEvent) => {
    const kvs = unformattedEvent.nameValuePair;
    const startDate = get(kvs, "Event Start Date");
    const startTime = get(kvs, "Event Start Time");
    const start = new Date(`${startDate}T${startTime}`);
    const endDate = get(kvs, "Event End Date");
    const endTime = get(kvs, "Event End Time");
    const end = new Date(`${endDate}T${endTime}`);
    const title = get(kvs, "Event Name");
    const id = get(kvs, "Event ID");
    const category = get(kvs, "Event Category Name");
    return { id, title, start, end, startDate, endDate, category };
  });

export const getCategories = (events) =>
  Object.keys(
    events.reduce((cats, ev) => {
      return { ...cats, ...(ev.category ? { [ev.category]: true } : {}) };
    }, {})
  ).sort((a, b) => a.localeCompare(b));

const renderCalendar = (calendarEl) => {
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    eventClassNames: ["neoncrm-calendar-event"],
    headerToolbar: {
      right: "prev,next today",
      left: "title",
    },
    eventClick: (info) => {
      const url = `https://${neoncrm_calendar.org_id}.app.neoncrm.com/np/clients/${neoncrm_calendar.org_id}/eventRegistration.jsp?event=${info.event.id}`;
      window.open(url, "_blank");
    },
  });
  calendar.render();
  return calendar;
};

export const main = async () => {
  var calendarEl = document.getElementById("calendar");
  const calendar = renderCalendar(calendarEl);
  const eventsResponse = await fetch(neoncrm_calendar.rest_url);
  document.querySelector(".neoncrm-calendar .loading").remove();
  const eventsData = await eventsResponse.json();
  if (!eventsData.listEvents?.searchResults?.nameValuePairs) {
    console.error("neoncrm-calendar: error fetching events", eventsData);
    return;
  }
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
};
