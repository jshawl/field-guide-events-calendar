import { createApp } from "./tea.js";

// MODEL
/**
 * @typedef {Tea.Model<{
 *  direction: "Past" | "Future";
 *  error: boolean;
 *  events: Event[];
 *  loading: boolean;
 *  options: {
 *   campaign: string;
 *   org_id: string;
 *   rest_url: string;
 *  };
 *  totalPages: number;
 * }>} Model
 * @type {Model}
 */
const initialModel = {
  direction: "Future",
  error: false,
  events: [],
  loading: false,
  options: {
    campaign: "",
    org_id: "",
    rest_url: "",
  },
  totalPages: 0,
};

// INIT
/** @type {Tea.InitFn} */
export const init = (dispatch) => {
  const el = elements.container();
  if (el instanceof HTMLElement) {
    const options = { ...el.dataset };
    dispatch({ options, type: "INIT" });
  }
};

// UPDATE

/**
 *
 * @param {Date} date
 * @returns {string}
 */
const yyyyMmDd = (date) => date.toISOString().slice(0, 10);

/**
 * @typedef {Object} Event
 * @property {string} campaignName
 * @property {number} id
 * @property {string} name
 * @property {string} startDate
 * @property {string} startTime
 *
 * @param {Object} options
 * @param {string} options.campaign
 * @param {Event[]} options.events
 * @param {Model["direction"]} options.direction
 * @returns
 */
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
  /** @type {Tea.CmdFactory<{
   *  direction: Model["direction"]
   *  rest_url: string
   *  totalPages?: number
   * }>} */
  fetchEvents: ({ direction, rest_url, totalPages }) => ({
    name: "FETCH_EVENTS",
    run: async (dispatch) => {
      const now = new Date();
      const url = new URL(`${rest_url}/neon/events`);
      if (direction === "Future") {
        url.searchParams.append("start", yyyyMmDd(now));
      }
      if (direction === "Past") {
        now.setDate(now.getDate() - 1);
        url.searchParams.append("end", yyyyMmDd(now));
        url.searchParams.append("currentPage", `${Number(totalPages) - 1}`);
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
        let errorMessage = "Something went wrong.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch({ error: errorMessage, type: "EVENTS_FETCH_ERROR" });
      }
    },
  }),
  /** @type {Tea.CmdFactory<{rest_url: string}>} */
  getTotalPages: ({ rest_url }) => ({
    name: "GET_TOTAL_PAGES",
    run: async (dispatch) => {
      const start = yyyyMmDd(new Date());
      const url = new URL(`${rest_url}/neon/events`);
      url.searchParams.append("end", start);
      url.searchParams.append("pageSize", "1");
      try {
        const response = await fetch(url.toString());
        const data = await response.json();
        const { pagination } =
          /** @type {{pagination: {totalResults: number}}} */ (data);
        const { totalResults } = pagination;
        const MAX_PAGE_SIZE = 200;
        const totalPages = Math.ceil(totalResults / MAX_PAGE_SIZE);
        dispatch({ totalPages, type: "TOTAL_PAGES_FETCHED" });
      } catch (error) {
        let errorMessage = "Something went wrong.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch({ error: errorMessage, type: "EVENTS_FETCH_ERROR" });
      }
    },
  }),
  none: () => ({ name: "NONE", run: () => {} }),
};

/** @type {Tea.UpdateFn<Model>} */
// eslint-disable-next-line max-lines-per-function
export const update = (msg, model) => {
  switch (msg.type) {
    case "INIT": {
      const { options } = /** @type {Tea.Msg<Pick<Model, 'options'>>} */ (msg);
      const { rest_url } = options;
      const { direction } = model;
      return [
        { ...model, loading: true, options: { ...options, rest_url } },
        commands.fetchEvents({ direction, rest_url }),
      ];
    }
    case "EVENTS_FETCHED": {
      const { events, totalPages } =
        /** @type {Tea.Msg<{events: Event[], totalPages: number}>} */ (msg);
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
      const { error } = /** @type Tea.Msg<{error: Error}> */ (msg);
      // eslint-disable-next-line no-console
      console.error(error);
      return [
        { ...model, error: true, events: [], loading: false },
        commands.none(),
      ];
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
      const { totalPages } = /** @type {Tea.Msg<{totalPages: number}>} */ (msg);
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
/** @type {Tea.SubscriptionsFn} */
export const subscriptions = () => [
  {
    key: "directionToggle",
    start(dispatch) {
      const el = elements.container();
      if (!el) {
        return;
      }
      /** @type EventListener */
      const handler = (event) => {
        const target = /** @type HTMLElement*/ (event.target);
        const btn = /** @type HTMLElement */ (
          target.closest("[data-direction]")
        );
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

/** @type {Tea.ViewFn<Model>} */
export const view = (model) => {
  const { direction, error, loading } = model;
  const container = elements.container();
  if (!container) {
    return;
  }
  container.innerHTML = `
    ${renderHeader({ direction })}
    ${renderError({ error })}
    ${renderEvents(model)}
    ${renderLoading({ loading })}
  `;
};

/**
 *
 * @param {Pick<Model, 'direction'>} options
 * @returns {string}
 */
const renderHeader = ({ direction }) => {
  let nextDirection = "Past";
  if (direction === "Past") {
    nextDirection = "Future";
  }
  return `
        <div class="field_guide_events_list_header">
            <h2>${direction} Events</h2>
            <button class="field_guide_events_list_change_direction btn btn-default btn-sm" data-direction="${nextDirection}">
                ${nextDirection}
            </button>
        </div>
    `;
};

/**
 *
 * @param {Event} event
 * @returns
 */
const formatEventDate = (event) => {
  const startDate = new Date(`${event.startDate}T${event.startTime}`);
  return {
    day: startDate.getDate().toString().padStart(2, "0"),
    month: startDate.toLocaleString("default", { month: "long" }).slice(0, 3),
    year: startDate.getFullYear().toString().slice(2, 4),
  };
};

/**
 *
 * @param {Model} model
 */
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

/**
 *
 * @param {Pick<Model, 'loading'>} options
 * @returns
 */
const renderLoading = ({ loading }) => {
  if (!loading) {
    return "";
  }
  return `<div class="field_guide_events_list_loading"></div>`;
};

/**
 *
 * @param {Pick<Model, 'error'>} options
 * @returns {string}
 */
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
