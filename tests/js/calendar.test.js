/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  commands,
  elements,
  init,
  subscriptions,
  update,
  view,
} from "../../assets/js/calendar.js";

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

describe("calendar", () => {
  beforeEach(() => {
    document.body.innerHTML = `
    <div class="field_guide_events_calendar_container" data-filter_campaigns="true">
      <div class='field_guide_events_calendar_campaigns'></div>
      <div class='field_guide_events_calendar_loading'></div>
      <div class='field_guide_events_calendar_calendar'></div>
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
          rest_url: "https://example.com",
        },
      };
    });

    it("INIT", () => {
      const [model, cmd] = update(
        { options: { filter_campaigns: "true" }, type: "INIT" },
        initialModel,
      );
      expect(model.options).toStrictEqual({
        filter_campaigns: "true",
      });
      // and post-load side effects
      const dispatch = vi.fn();
      cmd.run(dispatch);
      const dates = {
        endStr: "2020-01-02",
        startStr: "2020-01-01",
      };
      onDatesSet(dates);
      expect(dispatch).toHaveBeenCalledWith({
        info: dates,
        type: "DATES_SET",
      });
    });

    it("DATES_SET", () => {
      const [model, cmd] = update(
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
      expect(cmd.name).toBe("FETCH_EVENTS");
    });

    it("EVENTS_FETCHED", () => {
      const [model] = update(
        { events: [{}], type: "EVENTS_FETCHED" },
        initialModel,
      );
      expect(model.loading).toBe(false);
    });

    it("EVENTS_FETCH_ERROR", () => {
      const consoleError = globalThis.console.error;
      globalThis.console.error = vi.fn();
      const [model] = update(
        { error: new Error("some_error"), type: "EVENTS_FETCH_ERROR" },
        initialModel,
      );
      globalThis.console.error = consoleError;
      expect(model.error).toStrictEqual(new Error("some_error"));
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
      expect(model[1].run).toBeInstanceOf(Function);
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
      loading: false,
      options: {
        filter_campaigns: "false",
      },
    };

    beforeEach(() => {
      addEventMock.mockClear();
    });

    it("removes and readds events", () => {
      commands.initCalendar().run(dispatch);
      removeAllEventsMock.mockClear();
      view(model, dispatch);
      expect(removeAllEventsMock).toHaveBeenCalledOnce();
      expect(addEventMock).toHaveBeenCalledOnce();
    });

    it("toggles the loading image", () => {
      const loadingEl = document.querySelector(
        ".field_guide_events_calendar_loading",
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
    });
  });

  describe("commands", () => {
    describe("fetchEvents", () => {
      it("dispatches EVENTS_FETCHED", async () => {
        const start = "2020-01-01";
        const end = "2020-01-02";
        const restUrl = "https://example.com";
        const response = { events: [{}] };
        globalThis.fetch = vi.fn(() =>
          Promise.resolve({
            json: () => response,
          }),
        );
        const dispatch = vi.fn();
        await commands.fetchEvents({ end, restUrl, start }).run(dispatch);
        expect(dispatch).toHaveBeenCalledWith({
          type: "EVENTS_FETCHED",
          ...response,
        });
      });
      it("dispatches EVENTS_FETCH_ERROR", async () => {
        const start = "2020-01-01";
        const end = "2020-01-02";
        const restUrl = "https://example.com";
        const response = { code: "no events" };
        globalThis.fetch = vi.fn(() =>
          Promise.resolve({
            json: () => response,
          }),
        );
        const dispatch = vi.fn();
        await commands.fetchEvents({ end, restUrl, start }).run(dispatch);
        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "EVENTS_FETCH_ERROR",
          }),
        );
      });
    });

    describe("none", () => {
      it("does nothing", () => {
        const cmd = commands.none();
        expect(() => cmd.run()).not.toThrowError();
      });
    });

    describe("onEventClick", () => {
      it("opens the event url in a new tab", () => {
        const dispatch = vi.fn();
        commands.initCalendar().run(dispatch);
        onEventClick({ event: { id: 123 } });
        expect(dispatch).toHaveBeenCalledWith({
          id: 123,
          type: "ON_EVENT_CLICK",
        });
        globalThis.open = vi.fn();

        commands.onEventClick({ id: 456, orgId: "abc" }).run();
        expect(globalThis.open).toHaveBeenCalledWith(
          expect.stringContaining("456"),
          "_blank",
        );
      });
    });
    it("none", () => {
      expect(() => commands.none()).not.toThrowError();
    });
  });

  describe("subscriptions", () => {
    it("sets up campaign button event listeners", () => {
      const input = document.createElement("input");
      input.setAttribute("type", "radio");
      input.setAttribute("value", "My Campaign");
      elements.container().append(input);
      const dispatch = vi.fn();
      subscriptions().map((subscription) => subscription.start(dispatch));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      expect(dispatch).toHaveBeenCalledWith({
        filter: "My Campaign",
        type: "CAMPAIGN_FILTER_CHANGED",
      });
    });
  });
});
