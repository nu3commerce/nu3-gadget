import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "recipeBlogType" model, go to https://nu3.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "RecipeBlogType",
  fields: {
    shop: { 
      type: "string", 
      storageKey: "shop",
      validations: { required: true }
    },
    type: { 
      type: "string", 
      storageKey: "type",
      validations: { required: true }
    },
    externalBlogId: { 
      type: "string", 
      storageKey: "externalBlogId",
      validations: { required: true }
    },
  },
};