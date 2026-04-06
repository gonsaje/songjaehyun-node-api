export type EventHandler = (payload: unknown) => void;

export interface EventBus {
  publish(eventName: string, payload: unknown): void;
  subscribe(eventName: string, handler: EventHandler): () => void;
}