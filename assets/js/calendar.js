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

const getEvents = async () => {
  const eventsResponse = await fetch(neoncrm_calendar.rest_url);
  const eventsData = await eventsResponse.json();
  if (!eventsData.listEvents?.searchResults?.nameValuePairs) {
    console.error("neoncrm-calendar: error fetching events", eventsData);
    return [];
  }
  return formatEvents(eventsData.listEvents.searchResults.nameValuePairs);
};

export const addEvent = (calendar, event) => {
  return calendar.addEvent({
    ...event,
    allDay: event.startDate !== event.endDate,
  });
};

const renderCategory = (container, category, opts) => {
  const button = document.createElement("button");
  button.innerText = category;
  button.addEventListener("click", () => {
    opts.onChange(category);
  });
  container.appendChild(button);
  return button;
};

const renderCategories = (categoriesEl, categories, opts) => {
  categoriesEl.innerHTML = "";
  const button = renderCategory(categoriesEl, "All", opts);
  button.classList.add("active");
  categories.map((category) => {
    renderCategory(categoriesEl, category, opts);
  });
  categoriesEl.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    categoriesEl.querySelector(".active")?.classList.remove("active");
    e.target.classList.add("active");
  });
};

export const main = async () => {
  const calendarEl = document.getElementById("calendar");
  const categoriesEl = document.querySelector(".neoncrm-calendar .categories");
  const calendar = renderCalendar(calendarEl);
  const events = await getEvents();
  document.querySelector(".neoncrm-calendar .loading").remove();

  let calendarEvents = events.map((event) => addEvent(calendar, event));

  renderCategories(categoriesEl, getCategories(events), {
    onChange: (category) => {
      calendarEvents.map((calendarEvent) => calendarEvent.remove());
      calendarEvents = events
        .filter((event) => category === "All" || event.category === category)
        .map((event) => addEvent(calendar, event));
    },
  });
};
