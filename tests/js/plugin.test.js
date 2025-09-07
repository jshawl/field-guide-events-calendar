/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, init, update, view } from "../../assets/js/plugin.js";

vi.stubGlobal("field_guide_events_calendar", {
  org_id: "abcd",
  rest_url:
    "http://localhost:8888/index.php?rest_route=/field_guide_events_calendar/v1",
});

const addEventMock = vi.fn();
const calendarRenderMock = vi.fn();
const removeAllEventsMock = vi.fn();
let onEventClick = vi.fn();
let onDatesSet = vi.fn();

vi.stubGlobal("FullCalendar", {
  Calendar: class {
    constructor(_element, opts) {
      onEventClick = opts.eventClick;
      onDatesSet = opts.datesSet;
    }
    addEvent(args) {
      return addEventMock(args);
    }
    getEvents() {
      return [];
    }
    removeAllEvents() {
      return removeAllEventsMock();
    }
    render() {
      return calendarRenderMock();
    }
  },
});

describe("plugin", () => {
  beforeEach(() => {
    document.body.innerHTML = `
    <div class="field_guide_events_calendar" data-filter_campaigns="true">
      <div class='campaigns'></div>
      <div class='loading'></div>
      <div id='calendar'></div>
    </div>
  `;
  });

  describe("init", () => {
    const dispatch = vi.fn();
    it("dispatches options and calendar init", () => {
      init(dispatch);
      expect(dispatch).toHaveBeenCalledWith({
        options: {
          filter_campaigns: "true",
        },
        type: "INIT",
      });
    });
  });

  describe("update", () => {
    let initialModel = {};
    beforeEach(() => {
      initialModel = {
        options: {
          multi_day_events: "false",
        },
      };
    });

    it("INIT", () => {
      const [model] = update(
        { options: { filter_campaigns: "true" }, type: "INIT" },
        initialModel,
      );
      expect(model.options).toStrictEqual({
        filter_campaigns: "true",
      });
      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => ({
            events: [],
          }),
        }),
      );
      // and fetch
      onDatesSet({
        endStr: "2020-01-02",
        startStr: "2020-01-01",
      });
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it("DATES_SET", () => {
      const [model, command] = update(
        {
          info: {
            endStr: "2020-01-02",
            startStr: "2020-01-01",
          },
          type: "DATES_SET",
        },
        initialModel,
      );
      expect(model.loading).toBe(true);
      expect(command).toBeInstanceOf(Function);
    });

    it("EVENTS_FETCHED", () => {
      const [model] = update(
        { events: [{}], type: "EVENTS_FETCHED" },
        initialModel,
      );
      expect(model.loading).toBe(false);
    });

    it("CAMPAIGN_FILTER_CHANGED", () => {
      const [model] = update(
        { filter: "Not All", type: "CAMPAIGN_FILTER_CHANGED" },
        initialModel,
      );
      expect(model.filter).toBe("Not All");
    });

    it("ON_EVENT_CLICK", () => {
      const model = update({ id: 123, type: "ON_EVENT_CLICK" }, initialModel);
      expect(model[0]).toStrictEqual(initialModel);
      expect(model[1]).toBeInstanceOf(Function);
    });

    it("throws on unhandled messages", () => {
      expect(() => update({ type: "DEF_NOT_HANDLED" })).toThrowError();
    });
  });

  describe("view", () => {
    const dispatch = vi.fn();
    const model = {
      events: [{ campaignName: "Seminar" }],
      filter: "All",
      loading: true,
      options: {
        filter_campaigns: "false",
      },
    };

    it("removes and readds events", () => {
      init(dispatch);
      removeAllEventsMock.mockClear();
      view(model, dispatch);
      expect(removeAllEventsMock).toHaveBeenCalledOnce();
      expect(addEventMock).toHaveBeenCalledOnce();
    });

    it("toggles the loading image", () => {
      const loadingEl = document.querySelector(
        ".field_guide_events_calendar .loading",
      );
      view({ ...model, loading: true }, dispatch);
      expect(loadingEl.style.display).toBe("block");
      view({ ...model, loading: false }, dispatch);
      expect(loadingEl.style.display).toBe("none");
    });

    it("builds campaign filters", () => {
      view(
        {
          ...model,
          options: {
            ...model.options,
            filter_campaigns: "true",
          },
        },
        dispatch,
      );
      const selector = "[type='radio'][value='All'][checked='true']";
      const selected = document.querySelector(selector);
      expect(selected).toBeTruthy();
      selected.dispatchEvent(new Event("change", { bubbles: true }));
      expect(dispatch).toHaveBeenCalledWith({
        filter: "All",
        type: "CAMPAIGN_FILTER_CHANGED",
      });
    });
  });

  describe("commands", () => {
    describe("fetchEvents", () => {
      it("dispatches EVENTS_FETCHED", async () => {
        const start = "2020-01-01";
        const end = "2020-01-02";
        const options = {};
        const response = { events: [] };
        globalThis.fetch = vi.fn(() =>
          Promise.resolve({
            json: () => response,
          }),
        );
        const dispatch = vi.fn();
        await commands.fetchEvents({ end, options, start })(dispatch);
        expect(dispatch).toHaveBeenCalledWith({
          type: "EVENTS_FETCHED",
          ...response,
        });
      });
    });

    describe("onEventClick", () => {
      it("opens the event url in a new tab", () => {
        globalThis.open = vi.fn();
        onEventClick({ event: { id: 123 } });
        expect(globalThis.open).toHaveBeenCalledWith(
          expect.stringContaining("123"),
          "_blank",
        );
        commands.onEventClick({ id: 456 })();
        expect(globalThis.open).toHaveBeenCalledWith(
          expect.stringContaining("456"),
          "_blank",
        );
      });
    });
  });
});
