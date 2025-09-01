let store = {};

const set = (key, value) => {
  store[key] = value;
  return store[key];
};

const get = (key) => store[key];

export const formatEvents = (unformattedEvents) =>
  unformattedEvents.map((unformattedEvent) => {
    const startDate =
      unformattedEvent["Event Start Date"] || unformattedEvent.startDate;
    const startTime =
      unformattedEvent["Event Start Time"] || unformattedEvent.startTime;
    const start = new Date(`${startDate}T${startTime}`);
    const endDate =
      unformattedEvent["Event End Date"] || unformattedEvent.endDate;
    const endTime =
      unformattedEvent["Event End Time"] || unformattedEvent.endTime;
    const end = new Date(`${endDate}T${endTime}`);
    return {
      id: unformattedEvent["Event ID"] || unformattedEvent.id,
      title: unformattedEvent["Event Name"] || unformattedEvent.name,
      start,
      end,
      startDate,
      endDate,
      category: unformattedEvent["Event Category Name"],
    };
  });

export const getCategories = (events) =>
  Object.keys(
    events.reduce((cats, ev) => {
      return { ...cats, ...(ev.category ? { [ev.category]: true } : {}) };
    }, {})
  ).sort((a, b) => a.localeCompare(b));

export const renderCalendar = (calendarEl) => {
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    eventClassNames: ["neoncrm-calendar-event"],
    headerToolbar: {
      right: "prev,next today",
      left: "title",
    },
    height: "auto",
    eventClick: (info) => {
      const url = `https://${neoncrm_calendar.org_id}.app.neoncrm.com/np/clients/${neoncrm_calendar.org_id}/eventRegistration.jsp?event=${info.event.id}`;
      window.open(url, "_blank");
    },
  });
  calendar.render();
  return calendar;
};

export const getEvents = async () => {
  const eventsResponse = await fetch(neoncrm_calendar.rest_url + "/listEvents");
  const eventsData = await eventsResponse.json();
  if (!eventsData.events) {
    console.error("neoncrm-calendar: error fetching events", eventsData);
    return [];
  }
  return formatEvents(eventsData.events);
};

export const getEventsWithCategories = async () => {
  const eventsResponse = await fetch(neoncrm_calendar.rest_url + "/events");
  const eventsData = await eventsResponse.json();
  if (!eventsData.searchResults) {
    console.error("neoncrm-calendar: error fetching events", eventsData);
    return [];
  }
  return formatEvents(eventsData.searchResults);
};

export const addEvent = (calendar, event) => {
  return calendar.addEvent({
    ...event,
    allDay: event.startDate !== event.endDate,
  });
};

const renderCategory = (container, category) => {
  const div = document.createElement("div");
  div.innerHTML = `
    <input id="neoncrm_calendar_category_${category}" type="radio" name="neoncrm_calendar_category" value="${category}" ${
    category === "All" ? "checked" : ""
  }/>
    <label for="neoncrm_calendar_category_${category}">
      ${category}
    </label>
  `;
  container.appendChild(div);
  return div;
};

export const renderCategories = async (categoriesEl, calendar) => {
  if (!categoriesEl) return;
  const eventsWithCategories = await getEventsWithCategories();
  setFetchedEvents(eventsWithCategories);
  getCalendarEvents().map((calendarEvent) => calendarEvent.remove());
  setCalendarEvents(
    getFetchedEvents().map((event) => addEvent(calendar, event))
  );
  const categories = getCategories(getFetchedEvents());
  categoriesEl.innerHTML = "";
  const button = renderCategory(categoriesEl, "All");
  categories.map((category) => {
    renderCategory(categoriesEl, category);
  });
  categoriesEl.addEventListener("change", (e) => {
    const category = e.target.value;

    getCalendarEvents().map((calendarEvent) => calendarEvent.remove());
    setCalendarEvents(
      getFetchedEvents()
        .filter((event) => ["All", event.category].includes(category))
        .map((event) => addEvent(calendar, event))
    );
  });
};

export const setFetchedEvents = (events) => set("fetchedEvents", events);
const getFetchedEvents = () => get("fetchedEvents");

export const setCalendarEvents = (calendarEvents) =>
  set("calendarEvents", calendarEvents);
export const getCalendarEvents = () => get("calendarEvents");

setFetchedEvents([]);
setCalendarEvents([]);

export const renderEventsWithoutCategories = (events, calendar) => {
  document.querySelector(".neoncrm-calendar .loading").remove();
  if (getCalendarEvents().length) {
    // if the events with categories already rendered, don't overwrite
    return;
  }
  setFetchedEvents(events);
  setCalendarEvents(events.map((event) => addEvent(calendar, event)));
};

export const main = () => {
  const calendarEl = document.querySelector(".neoncrm-calendar #calendar");
  const categoriesEl = document.querySelector(".neoncrm-calendar .categories");
  const calendar = renderCalendar(calendarEl);
  // not awaited, so categories can start fetching
  getEvents().then((events) => renderEventsWithoutCategories(events, calendar));
  renderCategories(categoriesEl, calendar);
};
