import { createApp } from "./tea.js";

// MODEL

const initialModel = {
  events: [],
  filter: "All",
  loading: false,
  options: {},
};

// INIT

export const init = (dispatch) => {
  const el = elements.container();
  const options = { ...el.dataset };
  dispatch({ options, type: "INIT" });
};

// UPDATE

// eslint-disable-next-line unicorn/no-null
let _calendar = null;
export const commands = {
  fetchEvents: ({ end, restUrl, start }) => ({
    run: async (dispatch) => {
      dispatch({ type: "EVENTS_FETCH_START" });
      const url = new URL(`${restUrl}/neon/events`);
      url.searchParams.append("start", start);
      url.searchParams.append("end", end);
      const response = await fetch(url.toString());
      const { events } = await response.json();
      dispatch({ events, type: "EVENTS_FETCHED" });
    },
  }),
  initCalendar: () => ({
    run: (dispatch) => {
      _calendar = new FullCalendar.Calendar(
        elements.calendar(),
        getCalendarOptions(dispatch),
      );
      _calendar.render();
    },
  }),
  none: () => ({ run: () => {} }),
  onEventClick: ({ id, orgId }) => ({
    run: (_dispatch) => {
      const url = `https://${orgId}.app.neoncrm.com/np/clients/${orgId}/event.jsp?event=${id}`;
      window.open(url, "_blank");
    },
  }),
};

export const update = (msg, model) => {
  switch (msg.type) {
    case "INIT": {
      return [{ ...model, options: msg.options }, commands.initCalendar()];
    }

    case "DATES_SET": {
      const start = msg.info.startStr.slice(0, 10);
      const end = msg.info.endStr.slice(0, 10);
      const restUrl = model.options.rest_url;
      return [model, commands.fetchEvents({ end, restUrl, start })];
    }

    case "EVENTS_FETCH_START": {
      return [{ ...model, loading: true }, commands.none()];
    }

    case "EVENTS_FETCHED": {
      const events = formatEvents({
        events: msg.events,
        options: model.options,
      });
      let { filter } = model;
      if (!getCampaignNames(events).includes(filter)) {
        filter = "All";
      }
      return [{ ...model, events, filter, loading: false }, commands.none()];
    }

    case "CAMPAIGN_FILTER_CHANGED": {
      const { filter } = msg;
      return [{ ...model, filter }, commands.none()];
    }

    case "ON_EVENT_CLICK": {
      return [
        model,
        commands.onEventClick({ id: msg.id, orgId: model.options.org_id }),
      ];
    }

    default: {
      throw new Error(`Unhandled message: ${JSON.stringify(msg)}`);
    }
  }
};

// SUBSCRIPTIONS

export const subscriptions = () => [
  {
    key: "addCampaignEventListeners",
    start(dispatch) {
      const el = elements.container();
      const handler = (event) => {
        const btn = event.target.closest("[type='radio']");
        if (!btn) {
          return;
        }
        dispatch({
          filter: event.target.value,
          type: "CAMPAIGN_FILTER_CHANGED",
        });
      };
      el.addEventListener("change", handler);
      this.stop = () => el.removeEventListener("change", handler);
    },
  },
];

// VIEW

export const elements = {
  calendar: () =>
    document.querySelector(".field_guide_events_calendar_calendar"),
  campaigns: () =>
    document.querySelector(".field_guide_events_calendar_campaigns"),
  container: () =>
    document.querySelector(".field_guide_events_calendar_container"),
  loading: () => document.querySelector(".field_guide_events_calendar_loading"),
};

export const view = (model) => {
  const { events, filter, loading, options } = model;
  renderLoading({ loading });
  renderCalendar({ events, filter, loading });
  if (options.filter_campaigns === "true") {
    renderCampaignFilters({ events, filter });
  }
};

const renderLoading = ({ loading }) => {
  const loadingEl = elements.loading();
  if (loading) {
    loadingEl.style.display = "block";
  } else {
    loadingEl.style.display = "none";
  }
};

const renderCalendar = ({ events, filter, loading }) => {
  const calendar = getCalendar();
  calendar?.removeAllEvents();
  if (loading) {
    return;
  }
  events
    .filter((event) => ["All", event.campaignName].includes(filter))
    .map((event) =>
      calendar?.addEvent({
        ...event,
        allDay: event.startDate !== event.endDate,
      }),
    );
};

const renderCampaignFilters = ({ events, filter }) => {
  const campaignNames = getCampaignNames(events);
  const container = elements.campaigns();
  container.innerHTML = "";
  campaignNames.forEach((campaignName) => {
    const div = document.createElement("div");
    let checkedAttribute = "";
    if (campaignName === filter) {
      checkedAttribute = "checked='true'";
    }
    div.innerHTML = `
            <input id="field_guide_events_calendar_campaign_name_${campaignName}" type="radio" name="field_guide_events_calendar_campaign_name" value="${campaignName}" ${checkedAttribute}/>
            <label for="field_guide_events_calendar_campaign_name_${campaignName}">
              ${campaignName}
            </label>
          `;
    container.append(div);
  });
};

const getCalendar = () => _calendar;
const getCalendarOptions = (dispatch) => ({
  datesSet: (info) => {
    dispatch({ info, type: "DATES_SET" });
  },
  eventClassNames: ["field_guide_events_calendar_event"],
  eventClick: (info) => dispatch({ id: info.event.id, type: "ON_EVENT_CLICK" }),
  headerToolbar: {
    left: "title",
    right: "prev,next today",
  },
  height: "auto",
  initialView: "dayGridMonth",
});

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

// MAIN

if (!("process" in globalThis)) {
  const app = createApp({ init, initialModel, subscriptions, update, view });
  app.start();
}
