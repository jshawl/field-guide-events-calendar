/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  commands,
  init,
  subscriptions,
  update,
  view,
} from "../../assets/js/list";

describe("list", () => {
  let initialModel = {};
  beforeEach(() => {
    document.body.innerHTML = `<div 
        class="field_guide_events_list_container"
        data-rest_url="https://example.com"
    >
      <div>
        <button class="field_guide_events_list_change_direction">Past</button>
      </div>
    </div>`;
    initialModel = {
      direction: "Future",
      events: [{}],
      options: {
        campaign: "family fun",
        rest_url: "https://example.com",
      },
    };
  });

  describe("commands", () => {
    const totalResults = 1;
    const rest_url = "https://example.com";
    beforeEach(() => {
      const response = { events: [], pagination: { totalResults } };
      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => response,
        }),
      );
    });

    describe("fetchEvents", () => {
      it("gets future events", async () => {
        const dispatch = vi.fn();
        const direction = "Future";
        const cmd = commands.fetchEvents({ direction, rest_url });
        await cmd.run(dispatch);
        expect(dispatch).toHaveBeenCalledWith({
          events: [],
          type: "EVENTS_FETCHED",
        });
      });

      it("gets past events", async () => {
        const dispatch = vi.fn();
        const direction = "Past";
        const cmd = commands.fetchEvents({
          direction,
          rest_url,
          totalPages: 42,
        });

        await cmd.run(dispatch);
        expect(dispatch).toHaveBeenCalledWith({
          events: [],
          type: "EVENTS_FETCHED",
        });
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("currentPage=41"),
        );
      });

      it("dispatches errors", async () => {
        const error = new Error("something went wrong");
        globalThis.fetch = vi.fn(() => Promise.reject(error));
        const dispatch = vi.fn();
        const direction = "Past";
        const cmd = commands.fetchEvents({
          direction,
          rest_url,
          totalPages: 42,
        });
        await cmd.run(dispatch);
        expect(dispatch).toHaveBeenCalledWith({
          error: error.message,
          type: "EVENTS_FETCH_ERROR",
        });
      });
    });

    describe("getTotalPages", () => {
      it("getTotalPages", async () => {
        const dispatch = vi.fn();
        const cmd = commands.getTotalPages({ rest_url });
        await cmd.run(dispatch);
        expect(dispatch).toHaveBeenCalledWith({
          totalPages: 1,
          type: "TOTAL_PAGES_FETCHED",
        });
      });

      it("getTotalPages dispatches errors", async () => {
        const error = new Error("something went wrong");
        globalThis.fetch = vi.fn(() => Promise.reject(error));
        const dispatch = vi.fn();
        const cmd = commands.getTotalPages({ rest_url });
        await cmd.run(dispatch);
        expect(dispatch).toHaveBeenCalledWith({
          error: error.message,
          type: "EVENTS_FETCH_ERROR",
        });
      });
    });
    it("none", () => {
      const cmd = commands.none();
      expect(() => cmd.run()).not.toThrowError();
    });
  });

  describe("init", () => {
    it("dispatches INIT", () => {
      const dispatch = vi.fn();
      init(dispatch);
      expect(dispatch).toHaveBeenCalledWith({
        options: {
          rest_url: "https://example.com",
        },
        type: "INIT",
      });
    });
  });

  describe("subscriptions", () => {
    it("sets up event listeners", () => {
      const dispatch = vi.fn();
      subscriptions().map((subscription) => subscription.start(dispatch));
      const button = document.querySelector("button");
      button.dataset.direction = "Past";
      button.dispatchEvent(new Event("click", { bubbles: true }));
      expect(dispatch).toHaveBeenCalledWith({ type: "DIRECTION_CHANGE_PAST" });
      button.dataset.direction = "Future";
      button.dispatchEvent(new Event("click", { bubbles: true }));
      expect(dispatch).toHaveBeenCalledWith({
        type: "DIRECTION_CHANGE_FUTURE",
      });
    });
    it("ignores unrelated click events", () => {
      const dispatch = vi.fn();
      subscriptions().map((subscription) => subscription.start(dispatch));
      document.body
        .querySelector("div")
        .dispatchEvent(new Event("click", { bubbles: true }));
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("INIT", () => {
      const options = { rest_url: "https://example2.com" };
      const [model, cmd] = update({ options, type: "INIT" }, initialModel);
      expect(model.options.rest_url).toBe("https://example2.com");
      expect(model.loading).toBe(true);
      expect(cmd.name).toBe("FETCH_EVENTS");
    });

    describe("EVENTS_FETCHED", () => {
      const events = [
        {
          campaignName: "family fun",
          startDate: "2025-02-01",
        },
        {
          campaignName: "family fun",
          startDate: "2025-01-01",
        },
        {
          campaignName: "not fun",
        },
      ];

      it("filters campaign names and sorts ", () => {
        const [model] = update(
          { events, type: "EVENTS_FETCHED" },
          initialModel,
        );
        expect(model.events).toStrictEqual([
          {
            campaignName: "family fun",
            startDate: "2025-01-01",
          },
          {
            campaignName: "family fun",
            startDate: "2025-02-01",
          },
        ]);
        expect(model.loading).toBe(false);
        const [pastModel] = update(
          {
            events,
            type: "EVENTS_FETCHED",
          },
          { ...initialModel, direction: "Past" },
        );
        expect(pastModel.events).toStrictEqual(model.events.reverse());
      });
    });

    it("DIRECTION_CHANGE_PAST", () => {
      expect(initialModel.direction).toBe("Future");
      const [model, cmd] = update(
        { type: "DIRECTION_CHANGE_PAST" },
        initialModel,
      );
      expect(model.direction).toBe("Past");
      expect(cmd.name).toBe("GET_TOTAL_PAGES");
    });

    it("DIRECTION_CHANGE_FUTURE", () => {
      const [model, cmd] = update(
        { type: "DIRECTION_CHANGE_FUTURE" },
        initialModel,
      );
      expect(model.direction).toBe("Future");
      expect(cmd.name).toBe("FETCH_EVENTS");
    });

    it("TOTAL_PAGES_FETCHED", () => {
      const [model, cmd] = update(
        { totalPages: 42, type: "TOTAL_PAGES_FETCHED" },
        initialModel,
      );
      expect(model.totalPages).toBe(42);
      expect(cmd.name).toBe("FETCH_EVENTS");
    });

    it("EVENTS_FETCH_ERROR", () => {
      const [model, cmd] = update(
        { error: 22, type: "EVENTS_FETCH_ERROR" },
        initialModel,
      );
      expect(model.error).toBe(true);
      expect(model.loading).toBe(false);
      expect(model.events.length).toBe(0);
      expect(cmd.name).toBe("NONE");
    });

    it("throws on unhandled messages", () => {
      expect(() => update({ type: "IDK" })).toThrowError();
    });
  });

  describe("view", () => {
    it("has the right button", () => {
      const dispatch = vi.fn();
      view(initialModel, dispatch);
      const button = document.querySelector(
        ".field_guide_events_list_header button",
      );
      expect(button.innerHTML).toContain("Past");
    });

    it("has the right header", () => {
      const dispatch = vi.fn();
      view(initialModel, dispatch);
      const header = document.querySelector(".field_guide_events_list_header");
      expect(header.innerHTML).toMatch("Future Events");
      view({ ...initialModel, direction: "Past" }, dispatch);
      const header2 = document.querySelector(".field_guide_events_list_header");
      expect(header2.innerHTML).toMatch("Past Events");
    });

    it("shows errors", () => {
      view({ ...initialModel, error: true, events: [], loading: false });
      expect(document.body.innerHTML).toContain("Something went wrong.");
    });

    it("shows no events", () => {
      view({ ...initialModel, error: false, events: [], loading: false });
      expect(document.body.innerHTML).toContain("No events found.");
    });

    it("shows loading", () => {
      view({ ...initialModel, error: false, events: [], loading: true });
      expect(document.body.innerHTML).toContain("loading");
    });
  });
});
