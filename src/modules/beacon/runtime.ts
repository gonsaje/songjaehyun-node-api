import { InMemoryEventBus } from "./core/bus/eventBus";
import { App } from "./core/app/app";
import { AppState } from "./core/app/appState";

class BeaconRuntime {
  private eventBus = new InMemoryEventBus();
  private apps = new Map<string, { app: App; state: AppState }>();

  register(app: App) {
    this.apps.set(app.id, {
      app,
      state: AppState.REGISTERED,
    });
  }
}
