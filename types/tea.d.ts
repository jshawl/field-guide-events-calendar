declare namespace Tea {
  type Cmd = { name: string; run: (dispatch: DispatchFn) => void };

  type CmdFactory<T> = (options: T) => Cmd;

  type CreateAppFn = <T extends Options>({
    init,
    initialModel,
    subscriptions,
    update,
    view,
  }: {
    init: InitFn;
    initialModel: Model<T>;
    subscriptions: SubscriptionsFn;
    update: UpdateFn<Model<T>>;
    view: ViewFn<Model<T>>;
  }) => { start: () => void };

  type DispatchFn = (msg: Msg & Options) => Promise<void> | void;

  type InitFn = (dispatch: DispatchFn) => void;

  type Model<T extends Options = Options> = T;

  type Msg<T = Options> = { type: string } & T;

  type Options = Record<string, unknown>;

  type Subscription = {
    key: string;
    start: (dispatch: DispatchFn) => void;
    stop?: () => void;
  };

  type SubscriptionsFn = (model: Model) => Subscription[];

  type UpdateFn<T extends Model> = (msg: Msg, model: T) => [Model<T>, Cmd];

  type ViewFn<T extends Model> = (model: T) => void;
}
