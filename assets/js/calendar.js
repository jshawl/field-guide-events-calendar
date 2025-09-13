import { createApp } from "./tea.js";

// MODEL
/**
 * @typedef {Tea.Model<{
 *  error: boolean;
 *  events: Neon.Event[];
 *  filter: string;
 *  loading: boolean;
 *  options: {
 *    filter_campaigns: "true" | "false";
 *    multi_day_events: "true" | "false";
 *    org_id: string;
 *    rest_url: string;
 *  };
 * }>} Model
 * @type {Model}
 */
const initialModel = {
  error: false,
  events: [],
  filter: "All",
  loading: false,
  options: {
    filter_campaigns: "false",
    multi_day_events: "true",
    org_id: "",
    rest_url: "",
  },
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

// eslint-disable-next-line unicorn/no-null
let _calendar = /** @type {FullCalendar.Calendar | null} */ (null);
export const commands = {
  /** @type {Tea.CmdFactory<{
   *  end: string
   *  restUrl: string
   *  start: string
   * }>} */
  fetchEvents: ({ end, restUrl, start }) => ({
    name: "FETCH_EVENTS",
    run: async (dispatch) => {
      const url = new URL(`${restUrl}/neon/events`);
      url.searchParams.append("start", start);
      url.searchParams.append("end", end);
      const response = await fetch(url.toString());
      const { events } = await response.json();
      dispatch({ events, type: "EVENTS_FETCHED" });
    },
  }),
  /** @type {Tea.CmdFactory<unknown>} */
  initCalendar: () => ({
    name: "INIT_CALENDAR",
    run: (dispatch) => {
      const el = elements.calendar();
      if (!el) {
        return;
      }
      _calendar = new FullCalendar.Calendar(el, getCalendarOptions(dispatch));
      _calendar.render();
    },
  }),
  /** @type {Tea.CmdFactory<unknown>} */
  none: () => ({ name: "NONE", run: () => {} }),
  /** @type {Tea.CmdFactory<{id: number, orgId: string}>} */
  onEventClick: ({ id, orgId }) => ({
    name: "ON_EVENT_CLICK",
    run: (_dispatch) => {
      const url = `https://${orgId}.app.neoncrm.com/np/clients/${orgId}/event.jsp?event=${id}`;
      window.open(url, "_blank");
    },
  }),
};

/** @type {Tea.UpdateFn<Model>} */
export const update = (msg, model) => {
  switch (msg.type) {
    case "INIT": {
      const { options } = /** @type {Tea.Msg<Pick<Model, 'options'>>}*/ (msg);
      return [{ ...model, options }, commands.initCalendar({})];
    }

    case "DATES_SET": {
      const { info } =
        /** @type {Tea.Msg<{info: {endStr: string; startStr: string}}>}*/ (msg);
      const start = info.startStr.slice(0, 10);
      const end = info.endStr.slice(0, 10);
      const restUrl = model.options.rest_url;
      return [
        { ...model, loading: true },
        commands.fetchEvents({ end, restUrl, start }),
      ];
    }

    case "EVENTS_FETCHED": {
      const { events } = /** @type {Tea.Msg<Pick<Model, 'events'>>}*/ (msg);
      const formattedEvents = formatEvents({
        events,
        options: model.options,
      });
      let { filter } = model;
      if (!getCampaignNames(formattedEvents).includes(filter)) {
        filter = "All";
      }
      return [
        { ...model, events: formattedEvents, filter, loading: false },
        commands.none({}),
      ];
    }

    case "CAMPAIGN_FILTER_CHANGED": {
      const { filter } = /** @type {Tea.Msg<Pick<Model, 'filter'>>} */ (msg);
      return [{ ...model, filter }, commands.none({})];
    }

    case "ON_EVENT_CLICK": {
      const { id } = /** @type {Tea.Msg<Pick<Neon.Event, 'id'>>} */ (msg);
      return [
        model,
        commands.onEventClick({ id, orgId: model.options.org_id }),
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
    key: "addCampaignEventListeners",
    start(dispatch) {
      const el = elements.container();
      if (!el) {
        return;
      }
      /** @type EventListener */
      const handler = (event) => {
        const { target } = event;
        const input = /** @type {HTMLInputElement} */ (target);
        const btn = /** @type HTMLElement */ (input.closest("[type='radio']"));
        if (!btn) {
          return;
        }
        dispatch({
          filter: input.value,
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

/** @type {Tea.ViewFn<Model>} */
export const view = (model) => {
  const { events, filter, loading, options } = model;
  renderLoading({ loading });
  renderCalendar({ events, filter, loading });
  if (options.filter_campaigns === "true") {
    renderCampaignFilters({ events, filter });
  }
};

/**
 *
 * @param {Pick<Model, 'loading'>} options
 * @returns
 */
const renderLoading = ({ loading }) => {
  const loadingEl = elements.loading();
  if (!(loadingEl instanceof HTMLElement)) {
    return;
  }
  if (loading) {
    loadingEl.style.display = "block";
  } else {
    loadingEl.style.display = "none";
  }
};

/**
 *
 * @param {Pick<Model, 'loading' | 'events' | 'filter'>} options
 * @returns
 */
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

/**
 *
 * @param {Pick<Model, 'events' | 'filter'>} options
 * @returns
 */
const renderCampaignFilters = ({ events, filter }) => {
  const campaignNames = getCampaignNames(events);
  const container = elements.campaigns();
  if (!container) {
    return;
  }
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
/**
 * @param {Tea.DispatchFn} dispatch
 */
const getCalendarOptions = (dispatch) => ({
  /**
   *
   * @param {unknown} info
   */
  datesSet: (info) => {
    dispatch({ info, type: "DATES_SET" });
  },
  eventClassNames: ["field_guide_events_calendar_event"],
  /**
   *
   * @param {{event: Neon.Event}} info
   * @returns
   */
  eventClick: (info) => dispatch({ id: info.event.id, type: "ON_EVENT_CLICK" }),
  headerToolbar: {
    left: "title",
    right: "prev,next today",
  },
  height: "auto",
  initialView: "dayGridMonth",
});

/**
 *
 * @param {Neon.Event[]} events
 * @returns
 */
export const getCampaignNames = (events) => [
  "All",
  ...Object.keys(
    events.reduce((camps, ev) => {
      if (ev.campaignName) {
        camps[ev.campaignName] = true;
      }
      return camps; // 🏕️
    }, /** @type {Record<string, boolean>} */ ({})),
  ).sort(),
];

/**
 * formatEvents
 * @param {Pick<Model,'events' | 'options'>} options
 * @returns {Neon.Event[]}
 */
export const formatEvents = ({ events, options }) =>
  events.map((event) => {
    const { endTime, id, name, startDate, startTime } = event;
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
      endTime,
      id,
      name,
      start,
      startDate,
      startTime: event.startTime,
      title: event.name,
    };
  });

// MAIN

if (!("process" in globalThis)) {
  const app = createApp({ init, initialModel, subscriptions, update, view });
  app.start();
}
