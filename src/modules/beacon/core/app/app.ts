import { AppContext } from "./appContext";

export interface App {
    id: string,
    name: string,
    start(context: AppContext): void | Promise<void>;
    stop(): void | Promise<void>;
}