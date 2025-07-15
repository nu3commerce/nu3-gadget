import { BestBeforeNoticeManager } from '../services/bestbeforenoticemanager';

export const options = {
  triggers: {
    scheduler: [
      { every: "day", at: "06:00 UTC" },
    ],
  },
}

export const run = async ({ api }: { api: any }) => {
  let status = "success";
  let message = "Best Before Notice Manager executed successfully";
  let errorMsg = "";

  try {
    const manager = new BestBeforeNoticeManager();
    await manager.run();
  } catch (error) {
    status = "error";
    errorMsg = error instanceof Error ? error.message : String(error);
    message = "Best Before Notice Manager execution failed";
    console.error(message, error);
  }

  // Log the execution using the Gadget API object
  await api.logs.create({
    status,
    message,
    error: errorMsg,
    source: "BestBeforeNotice"
  });

  return { success: status === "success", message, error: errorMsg };
};