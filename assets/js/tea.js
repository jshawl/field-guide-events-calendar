export const createApp = ({
  init,
  initialModel,
  subscriptions,
  update,
  view,
} = {}) => {
  if (typeof initialModel !== "object") {
    throw new Error("[tea] missing required property initialModel");
  }
  if (typeof init !== "function") {
    throw new Error("[tea] init is not a function");
  }
  const initialModelKeys = Object.keys(initialModel);
  let currentModel = initialModel;
  let activeSubs = [];
  const dispatch = (action) => {
    const [newModel, command] = update(action, currentModel);
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

  const refreshSubscriptions = (model) => {
    const newSubs = subscriptions(model);

    // stop removed subs
    activeSubs
      .filter((old) => !newSubs.some((newer) => newer.key === old.key))
      .forEach((sub) => sub.stop());

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
