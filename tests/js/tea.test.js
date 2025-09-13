import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../assets/js/tea";
describe("createApp", () => {
  it("throws meaningful errors", () => {
    expect(() => createApp()).toThrowError(
      "[tea] missing required property initialModel",
    );
    const initialModel = {};
    expect(() => createApp({ initialModel })).toThrowError(
      "[tea] init is not a function",
    );
  });

  it("returns a start method", () => {
    const initialModel = {};
    const init = vi.fn();
    const app = createApp({ init, initialModel });
    expect(app.start).toBeInstanceOf(Function);
  });

  describe("runtime", () => {
    const initialModel = {};
    const command = { run: vi.fn() };
    const view = vi.fn();
    const subscriptions = vi.fn().mockImplementation(() => []);
    const update = vi.fn().mockImplementation(() => [{}, command]);
    const msg = { type: "TESTING" };
    const init = vi.fn().mockImplementation((dispatch) => dispatch(msg));
    const common = { init, initialModel, subscriptions, update, view };

    it("invokes init", () => {
      const app = createApp(common);
      app.start();
      expect(init).toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith(msg, {});
    });

    it("throws if the model shape changes after initial model", () => {
      const update = vi
        .fn()
        .mockImplementation(() => [{ unexpectedProperty: true }, command]);
      const app = createApp({
        ...common,
        update,
      });
      expect(() => app.start()).toThrowError(
        "[tea] keys added outside of initial model",
      );
    });
  });
});
