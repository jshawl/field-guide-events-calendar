/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import {
  formatEvents,
  get,
  getCategories,
  renderCategories,
  renderCalendar,
  addEvent,
  getEvents,
} from "../../assets/js/calendar.js";

vi.stubGlobal("neoncrm_calendar", {
  rest_url: "/fake-url",
  org_id: "abcd",
});

describe("get", () => {
  it("gets a value from a list of key value pairs", () => {
    const kvs = [{ name: "Event Name", value: "Sample Event" }];
    expect(get(kvs, "Event Name")).toBe("Sample Event");
  });
  it("doesn't throw if the key isn't found", () => {
    const kvs = [{ name: "Event Name", value: "Sample Event" }];
    expect(get(kvs, "Nonexistent")).toBeUndefined();
  });
});

describe("formatEvents", () => {
  it("formats an event correctly", () => {
    const unformattedEvents = [
      {
        nameValuePair: [
          { name: "Event Name", value: "Sample Event" },
          { name: "Event ID", value: "123" },
          { name: "Event Start Date", value: "2023-10-01" },
          { name: "Event Start Time", value: "10:00:00" },
          { name: "Event End Date", value: "2023-10-01" },
          { name: "Event End Time", value: "12:00:00" },
          { name: "Event Category Name", value: "Workshop" },
        ],
      },
    ];
    expect(formatEvents(unformattedEvents)[0]).toEqual({
      id: "123",
      title: "Sample Event",
      start: new Date("2023-10-01T10:00:00"),
      end: new Date("2023-10-01T12:00:00"),
      startDate: "2023-10-01",
      endDate: "2023-10-01",
      category: "Workshop",
    });
  });
});

describe("getCategories", () => {
  it("extracts unique categories from events", () => {
    const events = [
      { category: "Workshop" },
      { category: "Seminar" },
      { category: "Workshop" },
      { category: null },
      {},
    ];
    expect(getCategories(events)).toEqual(["Seminar", "Workshop"]);
  });
});

describe("renderCategories", () => {
  it("renders category buttons", () => {
    const categoriesEl = document.createElement("div");
    const opts = {
      onChange: vi.fn(),
    };
    renderCategories(categoriesEl, ["Workshop", "Seminar"], opts);
    expect(categoriesEl.children.length).toBe(3); // Including "All" button
    expect(categoriesEl.children[0].textContent).toBe("All");
    expect(categoriesEl.children[1].textContent).toBe("Workshop");
    expect(categoriesEl.children[2].textContent).toBe("Seminar");
    categoriesEl.children[1].click();
    expect(opts.onChange).toHaveBeenCalledWith("Workshop");
  });
});

describe("addEvent", () => {
  it("adds an event to the calendar", () => {
    const calendar = {
      addEvent: vi.fn(),
    };
    addEvent(calendar, {
      startDate: "2025-08-30",
      endDate: "2025-08-30",
    });
    expect(calendar.addEvent).toHaveBeenCalledWith({
      startDate: "2025-08-30",
      endDate: "2025-08-30",
      allDay: false,
    });
    addEvent(calendar, {
      startDate: "2025-08-30",
      endDate: "2025-08-31",
    });
    expect(calendar.addEvent).toHaveBeenCalledWith({
      startDate: "2025-08-30",
      endDate: "2025-08-31",
      allDay: true,
    });
  });
});

describe("renderCalendar", () => {
  it("initializes the calendar", () => {
    vi.stubGlobal("open", vi.fn());
    let onEventClick;
    vi.stubGlobal("FullCalendar", {
      Calendar: class {
        constructor(_, opts) {
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
      "_blank"
    );
  });
});

describe("getEvents", () => {
  it("fetches and formats events", async () => {
    const mockResponse = {
      listEvents: {
        searchResults: {
          nameValuePairs: [
            {
              nameValuePair: [{ name: "Event Name", value: "Sample Event" }],
            },
          ],
        },
      },
    };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    );
    const events = await getEvents();
    expect(events.length).toBe(1);
    expect(events[0].title).toBe("Sample Event");
  });

  it("handles fetch errors gracefully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    );
    console.error = vi.fn();
    const events = await getEvents();
    expect(events).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
