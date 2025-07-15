import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "logs" model, go to https://nu3.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "Logs",
  fields: {
    error: { type: "string", storageKey: "error" },
    message: { type: "string", storageKey: "message" },
    source: { type: "string", storageKey: "source" },
    status: { type: "string", storageKey: "status" },
  },
};
