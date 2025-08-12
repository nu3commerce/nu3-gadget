import { RecipeSyncManager } from '../services/recipesyncmanager';

export const options = {
  triggers: {
    api: true,
  },
};

// HTTP endpoint for recipe sync (replaces Azure Function)
export const run = async ({ params, api }: { params: any, api: any }) => {
  let status = "success";
  let message = "Recipe sync completed successfully";
  let errorMsg = "";

  try {
    const manager = new RecipeSyncManager();
    await manager.syncRecipe(params);
  } catch (error) {
    status = "error";
    errorMsg = error instanceof Error ? error.message : String(error);
    message = "Recipe sync execution failed";
    console.error(message, error);
  }

  // Log the execution using the Gadget API object
  await api.logs.create({
    status,
    message,
    error: errorMsg,
    source: "RecipeSync"
  });

  return { success: status === "success", message, error: errorMsg };
};