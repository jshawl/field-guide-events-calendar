const model = {
  events: [],
  filter: "All",
  loading: true,
  loadingEl: document.querySelector(".field_guide_events_calendar .loading"),
  options: {},
};

let currentModel = { ...model };

const dispatch = (action) => {
  currentModel = update(action, currentModel);
  if (Array.isArray(currentModel)) {
    const [newModel, command] = currentModel;
    currentModel = newModel;
    if (command) {
      command({ ...currentModel, dispatch });
    }
  }
  view(currentModel, dispatch);
};

const commands = {
  initializeCalendar: () => {},
  fetchEvents: async ({ start, end, dispatch }) => {
    const url = new URL(`${field_guide_events_calendar.rest_url}/neon/events`);
    url.searchParams.append("start", start);
    url.searchParams.append("end", end);
    const response = await fetch(url.toString());
    const { events } = await response.json();
    dispatch({ type: "EVENTS_FETCHED", events });
  },
  onEventClick: async ({ id }) => {
    const url = `https://${field_guide_events_calendar.org_id}.app.neoncrm.com/np/clients/${field_guide_events_calendar.org_id}/event.jsp?event=${id}`;
    window.open(url, "_blank");
  },
};

const update = (msg, model) => {
  switch (msg.type) {
    case "OPTIONS_SET":
      return { ...model, options: msg.options };
    case "INIT_CALENDAR":
      const calendar = new FullCalendar.Calendar(msg.el, {
        datesSet: async (info) => dispatch({ type: "DATES_SET", info }),
        eventClassNames: ["field_guide_events_calendar-event"],
        eventClick: (info) =>
          dispatch({ type: "ON_EVENT_CLICK", id: info.event.id }),
        headerToolbar: {
          left: "title",
          right: "prev,next today",
        },
        height: "auto",
        initialView: "dayGridMonth",
      });
      calendar.render();
      return { ...model, calendar };

    case "DATES_SET":
      const start = msg.info.startStr.slice(0, 10);
      const end = msg.info.endStr.slice(0, 10);
      return [{ ...model, loading: true, start, end }, commands.fetchEvents];

    case "EVENTS_FETCHED":
      const events = formatEvents({
        events: msg.events,
        options: model.options,
      });
      if (getCampaignNames(events).indexOf(model.filter) === -1) {
        model.filter = "All";
      }
      return { ...model, loading: false, events };

    case "CAMPAIGN_FILTER_CHANGED":
      const { filter } = msg;
      return { ...model, filter };

    case "ON_EVENT_CLICK":
      return [model, () => commands.onEventClick({ id: msg.id })];

    default:
      console.warn("unhandled msg:", msg);
      return model;
  }
};

const view = (model, dispatch) => {
  model.calendar?.removeAllEvents();
  model.events
    .filter((event) => ["All", event.campaignName].includes(model.filter))
    .map((event) => model.calendar.addEvent(event));
  if (model.loading) {
    model.loadingEl.style.display = "block";
  } else {
    model.loadingEl.style.display = "none";
  }
  if (model.options.filter_campaigns === "true") {
    const campaignNames = getCampaignNames(model.events);
    const container = document.querySelector(
      ".field_guide_events_calendar .campaigns",
    );
    container.innerHTML = "";
    campaignNames.forEach((campaignName) => {
      const div = document.createElement("div");
      let checkedAttribute = "";
      if (campaignName === model.filter) {
        checkedAttribute = "checked='true'";
      }
      div.innerHTML = `
            <input id="field_guide_events_calendar_campaign_name_${campaignName}" type="radio" name="field_guide_events_calendar_campaign_name" value="${campaignName}" ${checkedAttribute}/>
            <label for="field_guide_events_calendar_campaign_name_${campaignName}">
              ${campaignName}
            </label>
          `;
      div.addEventListener("change", (e) => {
        const filter = e.target.value;
        dispatch({ type: "CAMPAIGN_FILTER_CHANGED", filter });
      });
      container.append(div);
    });
  }
};

export const init = () => {
  const container = document.querySelector(".field_guide_events_calendar");
  const options = container.dataset;
  dispatch({ type: "OPTIONS_SET", options });
  const calendarEl = container.querySelector("#calendar");
  dispatch({ type: "INIT_CALENDAR", el: calendarEl });
};

// Helpers
// -------

export const getCampaignNames = (events) => [
  "All",
  ...Object.keys(
    events.reduce((camps, ev) => {
      if (ev.campaignName) {
        camps[ev.campaignName] = true;
      }
      return camps; // 🏕️
    }, {}),
  ).sort(),
];

export const formatEvents = ({ events, options }) =>
  events.map((event) => {
    const { endTime, startDate, startTime } = event;
    let { endDate } = event;
    if (options.multi_day_events === "false") {
      endDate = startDate;
    }
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    return {
      campaignName: event.campaignName,
      end,
      endDate,
      id: event.id,
      start,
      startDate,
      title: event.name,
    };
  });
