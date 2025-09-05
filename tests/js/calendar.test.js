/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatEvents,
  getCampaignNames,
  getEvents,
  main,
  render,
  renderCalendar,
  renderCampaigns,
} from "../../assets/js/calendar.js";

vi.stubGlobal("field_guide_events_calendar", {
  org_id: "abcd",
  rest_url:
    "http://localhost:8888/index.php?rest_route=/field_guide_events_calendar/v1",
});

const addEventMock = vi.fn();
const calendarRenderMock = vi.fn();

vi.stubGlobal("FullCalendar", {
  Calendar: class {
    constructor(_element, opts) {
      onEventClick = opts.eventClick;
      opts.datesSet({ endStr: "2024-01-31", startStr: "2024-01-01" });
    }
    addEvent(args) {
      return addEventMock(args);
    }
    getEvents() {
      return [];
    }
    render() {
      return calendarRenderMock();
    }
  },
});

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div class="field_guide_events_calendar">
      <div class="loading"></div>
      <div class="calendar"></div>
    </div>`;
  });

  it("renders the calendar", async () => {
    const mockResponse = {
      events: [{ name: "Sample Event" }],
    };
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    );
    await main();
    expect(calendarRenderMock).toHaveBeenCalledTimes(1);
  });
});

describe("formatEvents", () => {
  it("formats an event correctly", () => {
    const events = [
      {
        campaignName: "Workshop",
        endDate: "2023-10-01",
        endTime: "12:00:00",
        id: 123,
        name: "Sample Event",
        startDate: "2023-10-01",
        startTime: "10:00:00",
      },
    ];
    const options = {};
    expect(formatEvents({ events, options })[0]).toEqual({
      campaignName: "Workshop",
      end: new Date("2023-10-01T12:00:00"),
      endDate: "2023-10-01",
      id: 123,
      start: new Date("2023-10-01T10:00:00"),
      startDate: "2023-10-01",
      title: "Sample Event",
    });
  });

  it("uses the start date and end time if multi_day_events is false", () => {
    const events = [
      {
        endDate: "2024-11-02",
        endTime: "12:00:00",
        startDate: "2024-10-01",
        startTime: "10:00:00",
      },
    ];
    const options = { multi_day_events: "false" };
    expect(formatEvents({ events, options })[0]).toMatchObject({
      end: new Date("2024-10-01T12:00:00"),
      endDate: "2024-10-01",
    });
  });
});

describe("getCampaignNames", () => {
  it("extracts unique campaign names from events", () => {
    const events = [
      { campaignName: "Workshop" },
      { campaignName: "Seminar" },
      { campaignName: "Workshop" },
      { campaignName: undefined },
      {},
    ];
    expect(getCampaignNames(events)).toEqual(["Seminar", "Workshop"]);
  });
});

describe("render", () => {
  it("removes existing calendar events", () => {
    const removeMock = vi.fn();
    const calendar = {
      getEvents: vi.fn().mockReturnValue([{ remove: removeMock }]),
    };
    render({ calendar, campaignName: "All", events: [] });
    expect(removeMock).toHaveBeenCalled();
  });

  it("adds events matching the campaign filter", () => {
    const addMock = vi.fn();
    const calendar = {
      addEvent: addMock,
      getEvents: vi.fn().mockReturnValue([]),
    };
    const events = [
      { campaignName: "A", id: 1 },
      { campaignName: "B", id: 2 },
    ];
    render({ calendar, campaignName: "A", events });
    expect(addMock).toHaveBeenCalledTimes(1);
    expect(addMock).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});

describe("renderCampaigns", () => {
  let options = {};
  let calendar = {};
  const addMock = vi.fn();
  beforeEach(() => {
    options.filter_campaigns = "true";
    const events = [
      { campaignName: "Workshop" },
      { campaignName: "Seminar" },
    ].map((event) => ({
      ...event,
      addEvent: addMock,
      remove: vi.fn(),
    }));
    calendar = {
      addEvent: addMock,
      getEvents: vi.fn().mockReturnValue(events),
    };
    document.body.innerHTML = "<div class='container'></div>";
    const container = document.querySelector(".container");
    renderCampaigns({ calendar, container, events, options });
  });

  it("adds buttons for each campgaign", () => {
    expect(document.querySelectorAll("input[type='radio']").length).toBe(3); // Including "All"
  });

  it("renders calendar on campaign change", () => {
    const seminarRadio = document.querySelector("input[value='Seminar']");
    seminarRadio.checked = true;
    seminarRadio.dispatchEvent(new Event("change", { bubbles: true }));
    expect(addMock).toHaveBeenCalledTimes(1);
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaignName: "Seminar" }),
    );
  });

  it("returns early if filtering is disabled", () => {
    options.filter_campaigns = "false";
    const container = document.createElement("div");
    const calendar = { getEvents: vi.fn().mockReturnValue([]) };
    const events = [];
    renderCampaigns({ calendar, container, events, options });
    expect(container.querySelectorAll("input[type='radio']").length).toBe(0);
  });
});

let onEventClick = () => {};
describe("renderCalendar", () => {
  it("initializes the calendar", () => {
    document.body.innerHTML = `<div class="field_guide_events_calendar"></div>`;
    vi.stubGlobal("open", vi.fn());
    const calendarEl = document.createElement("div");
    renderCalendar(calendarEl);
    onEventClick({ event: { id: "1" } });
    expect(window.open).toHaveBeenCalledWith(
      "https://abcd.app.neoncrm.com/np/clients/abcd/event.jsp?event=1",
      "_blank",
    );
  });
});

describe("getEvents", () => {
  it("fetches and formats events", async () => {
    const mockResponse = {
      events: [{ name: "Sample Event" }],
    };
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    );
    const events = await getEvents({ options: {} });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining(encodeURIComponent("/neon/events")),
      }),
    );
    expect(events.length).toBe(1);
    expect(events[0].title).toBe("Sample Event");
  });

  it("toggles loading state", async () => {
    document.body.innerHTML = `<div class="field_guide_events_calendar">
      <div class="loading"></div>
    </div>`;

    let resolvePromise = vi.fn();
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    globalThis.fetch = vi.fn(() => promise);
    getEvents({ options: {} });
    expect(
      document.querySelector(".field_guide_events_calendar .loading").style
        .display,
    ).toBe("block");
    resolvePromise({ json: () => Promise.resolve({ events: [] }) });
    await promise;
    await vi.waitFor(() => {
      expect(
        document.querySelector(".field_guide_events_calendar .loading").style
          .display,
      ).toBe("none");
    });
  });

  it("handles fetch errors gracefully", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      }),
    );
    console.error = vi.fn();
    const events = await getEvents({});
    expect(events).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
