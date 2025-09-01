/**
 * @vitest-environment jsdom
 */
import {
  addEvent,
  formatEvents,
  getCalendarEvents,
  getCategories,
  getEvents,
  getEventsWithCategories,
  renderCalendar,
  renderCategories,
  renderEventsWithoutCategories,
  setCalendarEvents,
} from "../../assets/js/calendar.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("neon_crm_calendar", {
  org_id: "abcd",
  rest_url: "/fake-url",
});

describe("formatEvents", () => {
  it("formats an event correctly", () => {
    const unformattedEvents = [
      {
        "Event Category Name": "Workshop",
        "Event End Date": "2023-10-01",
        "Event End Time": "12:00:00",
        "Event ID": "123",
        "Event Name": "Sample Event",
        "Event Start Date": "2023-10-01",
        "Event Start Time": "10:00:00",
      },
    ];
    expect(formatEvents(unformattedEvents)[0]).toEqual({
      category: "Workshop",
      end: new Date("2023-10-01T12:00:00"),
      endDate: "2023-10-01",
      id: "123",
      start: new Date("2023-10-01T10:00:00"),
      startDate: "2023-10-01",
      title: "Sample Event",
    });
  });
});

describe("getCategories", () => {
  it("extracts unique categories from events", () => {
    const events = [
      { category: "Workshop" },
      { category: "Seminar" },
      { category: "Workshop" },
      { category: undefined },
      {},
    ];
    expect(getCategories(events)).toEqual(["Seminar", "Workshop"]);
  });
});

describe("renderCategories", () => {
  it("returns early if categories are not enabled via shortcode", () => {
    globalThis.fetch = vi.fn();
    renderCategories(undefined, {});
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("renders category buttons", async () => {
    const categoriesEl = document.createElement("div");
    const mockResponse = {
      searchResults: [
        { "Event Category Name": "Workshop" },
        { "Event Category Name": "Seminar" },
      ],
    };
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    );
    const calendar = {
      addEvent: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    };
    await renderCategories(categoriesEl, calendar);
    expect(categoriesEl.children.length).toBe(3); // Including "All" button
    expect(categoriesEl.children[0].querySelector("label").textContent).toMatch(
      "All",
    );
    // alphabetized
    expect(categoriesEl.children[1].querySelector("label").textContent).toMatch(
      "Seminar",
    );
    expect(categoriesEl.children[2].querySelector("label").textContent).toMatch(
      "Workshop",
    );
    categoriesEl.children[1].querySelector("input").dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );
  });
});

describe("renderEventsWithoutCategories", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div class='neon-crm-calendar'><div class='loading'></div></div>`;
  });
  it("removes loading", () => {
    renderEventsWithoutCategories();
    expect(document.body.innerHTML).not.toContain("loading");
  });
  it("returns early if calendar events are already set", () => {
    setCalendarEvents([{ name: "Event 1" }]);
    renderEventsWithoutCategories([{ name: "Stale Event" }]);
    expect(getCalendarEvents()[0].name).toBe("Event 1");
  });
  it("only sets calendar events if none are there already", () => {
    setCalendarEvents([]);
    const calendar = {
      addEvent: (name) => name,
    };
    renderEventsWithoutCategories([{ name: "Event 1" }], calendar);
    expect(getCalendarEvents()[0].name).toBe("Event 1");
  });
});

describe("addEvent", () => {
  it("adds an event to the calendar", () => {
    const calendar = {
      addEvent: vi.fn(),
    };
    addEvent(calendar, {
      endDate: "2025-08-30",
      startDate: "2025-08-30",
    });
    expect(calendar.addEvent).toHaveBeenCalledWith({
      allDay: false,
      endDate: "2025-08-30",
      startDate: "2025-08-30",
    });
    addEvent(calendar, {
      endDate: "2025-08-31",
      startDate: "2025-08-30",
    });
    expect(calendar.addEvent).toHaveBeenCalledWith({
      allDay: true,
      endDate: "2025-08-31",
      startDate: "2025-08-30",
    });
  });
});

let onEventClick = () => {};
describe("renderCalendar", () => {
  it("initializes the calendar", () => {
    vi.stubGlobal("open", vi.fn());
    vi.stubGlobal("FullCalendar", {
      Calendar: class {
        constructor(_element, opts) {
          onEventClick = opts.eventClick;
        }
        render() {}
      },
    });
    const calendarEl = document.createElement("div");
    renderCalendar(calendarEl);
    onEventClick({ event: { id: "1" } });
    expect(window.open).toHaveBeenCalledWith(
      "https://abcd.app.neoncrm.com/np/clients/abcd/eventRegistration.jsp?event=1",
      "_blank",
    );
  });
});

describe("getEvents", () => {
  it("fetches and formats events", async () => {
    const mockResponse = {
      events: [{ "Event Name": "Sample Event" }],
    };
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    );
    const events = await getEvents();
    expect(events.length).toBe(1);
    expect(events[0].title).toBe("Sample Event");
  });

  it("handles fetch errors gracefully", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      }),
    );
    console.error = vi.fn();
    const events = await getEvents();
    expect(events).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});

describe("getEventsWithCategories", () => {
  it("fetches and formats events", async () => {
    const mockResponse = {
      searchResults: [{ name: "Sample Event" }],
    };
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    );
    const events = await getEventsWithCategories();
    expect(events.length).toBe(1);
    expect(events[0].title).toBe("Sample Event");
  });

  it("handles fetch errors gracefully", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      }),
    );
    console.error = vi.fn();
    const events = await getEventsWithCategories();
    expect(events).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
