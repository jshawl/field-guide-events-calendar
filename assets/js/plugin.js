const initialModel = {
  events: [],
  filter: "All",
  loading: true,
  options: {},
};

let currentModel = { ...initialModel };

export const dispatch = (action) => {
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

export const init = (dispatch) => {
  dispatch({ type: "INIT" });
};

export const commands = {
  fetchEvents: async ({ start, end, dispatch }) => {
    const url = new URL(`${field_guide_events_calendar.rest_url}/neon/events`);
    url.searchParams.append("start", start);
    url.searchParams.append("end", end);
    const response = await fetch(url.toString());
    const { events } = await response.json();
    dispatch({ events, type: "EVENTS_FETCHED" });
  },
  onEventClick: ({ id }) => {
    const url = `https://${field_guide_events_calendar.org_id}.app.neoncrm.com/np/clients/${field_guide_events_calendar.org_id}/event.jsp?event=${id}`;
    window.open(url, "_blank");
  },
};

export const update = (msg, model) => {
  switch (msg.type) {
    case "INIT": {
      const el = document.querySelector(".field_guide_events_calendar");
      const options = { ...el.dataset };
      const calendarEl = el.querySelector("#calendar");
      const calendar = new FullCalendar.Calendar(calendarEl, calendarOptions);
      calendar.render();
      const loadingEl = document.querySelector(
        ".field_guide_events_calendar .loading",
      );
      return { ...model, calendar, loadingEl, options };
    }

    case "DATES_SET": {
      const start = msg.info.startStr.slice(0, 10);
      const end = msg.info.endStr.slice(0, 10);
      return [{ ...model, end, loading: true, start }, commands.fetchEvents];
    }

    case "EVENTS_FETCHED": {
      const events = formatEvents({
        events: msg.events,
        options: model.options,
      });
      if (!getCampaignNames(events).includes(model.filter)) {
        model.filter = "All";
      }
      return { ...model, events, loading: false };
    }

    case "CAMPAIGN_FILTER_CHANGED": {
      const { filter } = msg;
      return { ...model, filter };
    }

    case "ON_EVENT_CLICK": {
      return [model, () => commands.onEventClick({ id: msg.id })];
    }

    default: {
      throw new Error(`Unhandled message: ${JSON.stringify(msg)}`);
    }
  }
};

export const view = (model, dispatch) => {
  model.calendar?.removeAllEvents();
  model.events
    .filter((event) => ["All", event.campaignName].includes(model.filter))
    .map((event) =>
      model.calendar.addEvent({
        ...event,
        allDay: event.startDate !== event.endDate,
      }),
    );

  if (model.loadingEl) {
    if (model.loading) {
      model.loadingEl.style.display = "block";
    } else {
      model.loadingEl.style.display = "none";
    }
  }

  if (model.options.filter_campaigns !== "true") {
    return;
  }
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
    div.addEventListener("change", (event) =>
      dispatch({ filter: event.target.value, type: "CAMPAIGN_FILTER_CHANGED" }),
    );
    container.append(div);
  });
};

// Helpers
// -------

const calendarOptions = {
  datesSet: (info) => {
    dispatch({ info, type: "DATES_SET" });
  },
  eventClassNames: ["field_guide_events_calendar-event"],
  eventClick: (info) => dispatch({ id: info.event.id, type: "ON_EVENT_CLICK" }),
  headerToolbar: {
    left: "title",
    right: "prev,next today",
  },
  height: "auto",
  initialView: "dayGridMonth",
};

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
