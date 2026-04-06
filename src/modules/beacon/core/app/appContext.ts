export interface AppContext {
  publish: (event: string, payload: any) => void;
  subscribe: (event: string, handler: (payload: any) => void) => void;

  logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
}