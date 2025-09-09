import { createApp } from "./tea.js";

// MODEL

const initialModel = {
  direction: "Future",
  error: false,
  events: [],
  loading: true,
  options: {},
  totalPages: 0,
};

// INIT

export const init = (dispatch) => {
  const el = elements.container();
  const options = { ...el.dataset };
  dispatch({ options, type: "INIT" });
};

// UPDATE

const yyyyMmDd = (date) => date.toISOString().slice(0, 10);

const filterAndSortEvents = ({ campaign, events, direction }) => {
  const regex = new RegExp(campaign, "i");
  let filteredEvents = events
    .filter(({ campaignName }) => regex.test(campaignName))
    .sort((eventA, eventB) => eventA.startDate.localeCompare(eventB.startDate));
  if (direction === "Past") {
    filteredEvents = filteredEvents.reverse();
  }
  return filteredEvents;
};

export const commands = {
  fetchEvents: ({ direction, rest_url, totalPages }) => ({
    name: "FETCH_EVENTS",
    run: async (dispatch) => {
      dispatch({ type: "EVENTS_FETCH_START" });
      const now = new Date();
      const url = new URL(`${rest_url}/neon/events`);
      if (direction === "Future") {
        url.searchParams.append("start", yyyyMmDd(now));
      }
      if (direction === "Past") {
        now.setDate(now.getDate() - 1);
        url.searchParams.append("end", yyyyMmDd(now));
        url.searchParams.append("currentPage", totalPages - 1);
      }
      try {
        const response = await fetch(url.toString());
        const { events, pagination } = await response.json();
        dispatch({
          events,
          totalPages: pagination.totalPages,
          type: "EVENTS_FETCHED",
        });
      } catch (error) {
        dispatch({ error: error.message, type: "EVENTS_FETCH_ERROR" });
      }
    },
  }),
  getTotalPages: ({ rest_url }) => ({
    name: "GET_TOTAL_PAGES",
    run: async (dispatch) => {
      const start = yyyyMmDd(new Date());
      const url = new URL(`${rest_url}/neon/events`);
      url.searchParams.append("end", start);
      url.searchParams.append("pageSize", 1);
      try {
        const response = await fetch(url.toString());
        const {
          pagination: { totalResults },
        } = await response.json();
        const MAX_PAGE_SIZE = 200;
        const totalPages = Math.ceil(totalResults / MAX_PAGE_SIZE);
        dispatch({ totalPages, type: "TOTAL_PAGES_FETCHED" });
      } catch (error) {
        dispatch({ error: error.message, type: "EVENTS_FETCH_ERROR" });
      }
    },
  }),
  none: () => ({ name: "NONE", run: () => {} }),
};

// eslint-disable-next-line max-lines-per-function
export const update = (msg, model) => {
  switch (msg.type) {
    case "INIT": {
      const { rest_url } = msg.options;
      const { direction } = model;
      return [
        { ...model, options: msg.options },
        commands.fetchEvents({ direction, rest_url }),
      ];
    }
    case "EVENTS_FETCH_START": {
      return [
        { ...model, error: false, events: [], loading: true },
        commands.none(),
      ];
    }
    case "EVENTS_FETCHED": {
      const { events, totalPages } = msg;
      const { campaign } = model.options;
      const { direction } = model;
      const filteredEvents = filterAndSortEvents({
        campaign,
        direction,
        events,
      });
      return [
        {
          ...model,
          error: false,
          events: filteredEvents,
          loading: false,
          totalPages,
        },
        commands.none(),
      ];
    }
    case "EVENTS_FETCH_ERROR": {
      const { error } = msg;
      // eslint-disable-next-line no-console
      console.error(error);
      return [{ ...model, error, events: [], loading: false }, commands.none()];
    }
    case "DIRECTION_CHANGE_PAST": {
      const {
        options: { rest_url },
      } = model;
      const direction = "Past";
      return [
        { ...model, direction, error: false, events: [], loading: true },
        commands.getTotalPages({ rest_url }),
      ];
    }
    case "DIRECTION_CHANGE_FUTURE": {
      const {
        options: { rest_url },
      } = model;
      const direction = "Future";
      return [
        { ...model, direction, error: false, events: [], loading: true },
        commands.fetchEvents({ direction, rest_url }),
      ];
    }
    case "TOTAL_PAGES_FETCHED": {
      const { totalPages } = msg;
      const { direction } = model;
      const { rest_url } = model.options;
      return [
        { ...model, totalPages },
        commands.fetchEvents({
          direction,
          rest_url,
          totalPages,
        }),
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
    key: "directionToggle",
    start(dispatch) {
      const el = elements.container();
      const handler = (event) => {
        const btn = event.target.closest("[data-direction]");
        if (!btn) {
          return;
        }
        if (btn.dataset.direction === "Past") {
          dispatch({ type: "DIRECTION_CHANGE_PAST" });
        } else {
          dispatch({ type: "DIRECTION_CHANGE_FUTURE" });
        }
      };
      el.addEventListener("click", handler);
      this.stop = () => el.removeEventListener("click", handler);
    },
  },
];

// VIEW

const elements = {
  container: () => document.querySelector(".field_guide_events_list_container"),
};

export const view = (model) => {
  const { direction, error, loading } = model;
  elements.container().innerHTML = `
    ${renderHeader({ direction })}
    ${renderError({ error })}
    ${renderEvents(model)}
    ${renderLoading({ loading })}
  `;
};

const renderHeader = ({ direction }) => {
  let nextDirection = "Past";
  if (direction === "Past") {
    nextDirection = "Future";
  }
  return `
        <div class="field_guide_events_list_header">
            <h2>${direction} Events</h2>
            <button class="field_guide_events_list_change_direction" data-direction="${nextDirection}">
                ${nextDirection}
            </button>
        </div>
    `;
};

const formatEventDate = (event) => {
  const startDate = new Date(`${event.startDate}T${event.startTime}`);
  return {
    day: startDate.getDate().toString().padStart(2, "0"),
    month: startDate.toLocaleString("default", { month: "long" }).slice(0, 3),
    year: startDate.getFullYear().toString().slice(2, 4),
  };
};

const renderEvents = (model) => {
  const { error, events, loading } = model;
  if (!loading && !error && events.length === 0) {
    return `<div>No events found.</div>`;
  }
  return `<div>${events
    .map((event) => {
      const { day, month, year } = formatEventDate(event);
      const orgId = model.options.org_id;
      const { id } = event;
      const url = `https://${orgId}.app.neoncrm.com/np/clients/${orgId}/event.jsp?event=${id}`;
      return `<a href="${url}" class="field_guide_events_list_event" target="_blank">
        <div class="field_guide_events_list_event_date">
          <div class="field_guide_events_list_event_date_day">${day}</div>
          <div class="field_guide_events_list_event_date_month_year">${month}, ${year}</div>
        </div>
        <div class="field_guide_events_list_event_details">
            <div class="field_guide_events_list_event_campaign_name">${event.campaignName}</div>
            <h5 class="field_guide_events_list_event_name">${event.name}</h5>
        </div>
        <div class="field_guide_events_list_event_cta"><span>&rsaquo;</span></div>
    </a>`;
    })
    .join("")}</div>`;
};

const renderLoading = ({ loading }) => {
  if (!loading) {
    return "";
  }
  return `<div class="field_guide_events_list_loading"></div>`;
};

const renderError = ({ error }) => {
  if (!error) {
    return "";
  }
  return `<div>Something went wrong.</div>`;
};

// MAIN

if (!("process" in globalThis)) {
  const app = createApp({ init, initialModel, subscriptions, update, view });
  app.start();
}
