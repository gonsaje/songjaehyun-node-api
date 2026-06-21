import { InMemoryEventBus } from "./core/bus/eventBus";
import { App } from "./core/app/app";
import { AppState } from "./core/app/appState";
import { AppContext } from "./core/app/appContext";

class BeaconRuntime {
	private eventBus = new InMemoryEventBus();
	private apps = new Map<string, { app: App; state: AppState }>();

	register(app: App) {
		if (this.apps.get(app.id)) {
			throw new Error(`App "${app.id}" is already registered.`);
		}

		this.apps.set(app.id, {
			app,
			state: AppState.REGISTERED,
		});
	}

	async start(appId: string): Promise<void> {
		const entry = this.getEntry(appId);
		if (entry.state !== AppState.REGISTERED) {
			throw new Error(`App "${appId}" is already in process: ${entry.state}`);
		}

		entry.state = AppState.STARTING;

		const appContext = this.createAppContext(appId);

		try {
			await entry.app.start(appContext);
			entry.state = AppState.RUNNING;
		} catch (error) {
			entry.state = AppState.FAILED;
			throw error;
		}
	}

	async stop(appId: string) {
		const entry = this.getEntry(appId);
		if (entry.state !== AppState.RUNNING) {
			throw new Error(`App "${appId}" is not running.`);
		}

		entry.state = AppState.STOPPING;

		try {
			await entry.app.stop();
			entry.state = AppState.STOPPED;
		} catch (error) {
			entry.state = AppState.FAILED;
			throw error;
		}

		// Reset State
		entry.state = AppState.REGISTERED;
	}

	getAppState(appId: string) {
		const entry = this.getEntry(appId);
		return entry.state;
	}

	private createAppContext(appId: string) {
		const appContext: AppContext = {
			publish: (eventName, payload) =>
				this.eventBus.publish(eventName, payload),
			subscribe: (eventName, handler) =>
				this.eventBus.subscribe(eventName, handler),
			logger: {
				info: (msg) => console.log(`[${appId}] ${msg}`),
				error: (msg) => console.error(`[${appId}] ${msg}`),
			},
		};

		return appContext;
	}

	getEntry(appId: string) {
		const entry = this.apps.get(appId);
		if (!entry) {
			throw new Error(`App "${appId}" is not registered.`);
		}	
		
		return entry;
	}

	listApps(state = undefined) {
		const apps: object[] = [];
		this.apps.forEach((entry) => {
			if (state !== undefined) {
				if (state == entry.state) {
					apps.push(entry);
				}
			} else {
				apps.push(entry);
			}
		});

		return apps;
	}
}
