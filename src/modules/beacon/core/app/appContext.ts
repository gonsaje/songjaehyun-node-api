export interface AppContext {
  publish: (event: string, payload: any) => void;
  subscribe: (eventName: string, handler: (payload: unknown) => void,) => () => void;

  logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
}