import { task } from "@trigger.dev/sdk/v3";

export const healthcheckTask = task({
  id: "tallymark-healthcheck",
  run: async () => {
    return {
      ok: true,
      service: "tallymark",
    };
  },
});
