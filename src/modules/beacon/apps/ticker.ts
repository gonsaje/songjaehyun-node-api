import { App } from "../core/app/app";

export const tickerApp: App = {
  id: "ticker",
  name: "Ticker App",

  start(context) {
    context.logger.info("Ticker started");

    setInterval(() => {
      const price = Math.random() * 100;

      const event = {
        symbol: "AAPL",
        price,
        timestamp: new Date(),
      };

      context.logger.info(`Publishing price: ${price}`);

      context.publish("quote.updated", event);
    }, 2000);
  },

  stop() {
    console.log("Ticker stopped");
  },
};