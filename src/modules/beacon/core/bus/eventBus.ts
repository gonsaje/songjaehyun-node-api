export type EventHandler = (payload: unknown) => void;

export interface EventBus {
  publish(eventName: string, payload: unknown): void;
  subscribe(eventName: string, handler: EventHandler): () => void;
}

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, EventHandler[]>();

  publish(eventName: string, payload: unknown): void {
    const eventHandlers = this.handlers.get(eventName) ?? [];

    for (const handler of eventHandlers) {
      handler(payload);
    }
  }

  subscribe(eventName: string, handler: EventHandler): () => void {
    const eventHandlers = this.handlers.get(eventName) ?? [];
    eventHandlers.push(handler);
    this.handlers.set(eventName, eventHandlers);

    return () => {
      const currentHandlers = this.handlers.get(eventName) ?? [];
      const nextHandlers = currentHandlers.filter((h) => h !== handler);

      if (nextHandlers.length === 0) {
        this.handlers.delete(eventName);
        return;
      }

      this.handlers.set(eventName, nextHandlers);
    };
  }
}