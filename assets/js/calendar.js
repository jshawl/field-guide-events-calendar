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

export const renderCategories = (categoriesEl, categories, opts) => {
  if (!categoriesEl) return;
  categoriesEl.innerHTML = "";
  const button = renderCategory(categoriesEl, "All");
  categories.map((category) => {
    renderCategory(categoriesEl, category, opts);
  });
  categoriesEl.addEventListener("change", (e) => {
    opts.onChange(e.target.value);
  });
};

export const main = async () => {
  const calendarEl = document.querySelector(".neoncrm-calendar #calendar");
  const categoriesEl = document.querySelector(".neoncrm-calendar .categories");
  const calendar = renderCalendar(calendarEl);
  let events = await getEvents();
  document.querySelector(".neoncrm-calendar .loading").remove();

  let calendarEvents = events.map((event) => addEvent(calendar, event));

  if (categoriesEl) {
    events = await getEventsWithCategories();
    calendarEvents.map((calendarEvent) => calendarEvent.remove());
    calendarEvents = events.map((event) => addEvent(calendar, event));
    const categoryNames = getCategories(events);
    renderCategories(categoriesEl, categoryNames, {
      onChange: (category) => {
        calendarEvents.map((calendarEvent) => calendarEvent.remove());
        calendarEvents = events
          .filter((event) => ["All", event.category].includes(category))
          .map((event) => addEvent(calendar, event));
      },
    });
  }
};
