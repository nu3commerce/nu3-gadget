import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "recipeContent" model, go to https://nu3.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "RecipeContent",
  fields: {
    shop: { 
      type: "string", 
      storageKey: "shop",
      validations: { required: true }
    },
    recipeId: { 
      type: "string", 
      storageKey: "recipeId",
      validations: { required: true }
    },
    handle: { 
      type: "string", 
      storageKey: "handle" 
    },
    type: { 
      type: "string", 
      storageKey: "type" 
    },
    payload: { 
      type: "json", 
      storageKey: "payload" 
    },
    externalArticleId: { 
      type: "string", 
      storageKey: "externalArticleId" 
    },
    language: { 
      type: "string", 
      storageKey: "language" 
    },
  },
};