import { PriceApiSyncManager } from '../services/priceapisyncmanager';
// All configuration is now centralized in config.ts and used by the manager.

export const options = {
  triggers: {
    scheduler: [
      { every: "week", on: "Monday", at: "06:00 UTC" },
    ],
  },
};

export const run = async ({ api }: { api: any }) => {
  let status = "success";
  let message = "PriceApi Sync executed successfully";
  let errorMsg = "";

  try {
    const manager = new PriceApiSyncManager();
    await manager.run();
  } catch (error) {
    status = "error";
    errorMsg = error instanceof Error ? error.message : String(error);
    message = "PriceApi Sync execution failed";
    console.error(message, error);
  }

  // Log the execution using the Gadget API object
  await api.logs.create({
    status,
    message,
    error: errorMsg,
    source: "PriceApiSync"
  });

  return { success: status === "success", message, error: errorMsg };
}; 