/** @type {Tea.CreateAppFn} */
export const createApp = ({
  init,
  initialModel,
  subscriptions,
  update,
  view,
}) => {
  const initialModelKeys = Object.keys(initialModel);
  let currentModel = initialModel;
  let activeSubs = /**@type {Tea.Subscription[]}*/ ([]);
  /** @type {Tea.DispatchFn} */
  const dispatch = (msg) => {
    const [newModel, command] = update(msg, currentModel);
    const newModelKeys = Object.keys(newModel);
    const diff = newModelKeys.filter(
      (newModelKey) => !initialModelKeys.includes(newModelKey),
    );
    if (diff.length > 0) {
      throw new Error(
        `[tea] keys added outside of initial model: ${JSON.stringify(diff)}`,
      );
    }
    currentModel = newModel;
    command.run(dispatch);
    view(currentModel);
    refreshSubscriptions(currentModel);
  };

  /**
   * @param {Tea.Model} model
   */
  const refreshSubscriptions = (model) => {
    const newSubs = subscriptions(model);

    // stop removed subs
    activeSubs
      .filter((old) => !newSubs.some((newer) => newer.key === old.key))
      .forEach((sub) => sub.stop?.());

    // start added subs
    newSubs
      .filter((newer) => !activeSubs.some((old) => old.key === newer.key))
      .forEach((sub) => sub.start(dispatch));

    activeSubs = newSubs;
  };

  const start = () => {
    init(dispatch);
  };
  return { start };
};
