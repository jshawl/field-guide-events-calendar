import { describe, it, expect } from "vitest";
import { formatEvents, get, getCategories } from "../../assets/js/calendar.js";

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
