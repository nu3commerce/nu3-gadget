import { api } from "gadget-server";
import { createShopifyClient } from './shopifyConfig';

// Language mapping for recipe content
const languageMapping: { [key: string]: string } = {
  'de': 'de',
  'en': 'en',
  'fr': 'fr',
  'it': 'it',
  'es': 'es'
};

// Interfaces for recipe data
interface RecipePayload {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  featuredImage?: string;
  language: string;
}

interface RecipeSyncMessage {
  recipeId: string;
  handle: string;
  type: string;
  payload: RecipePayload;
  language: string;
}

export class RecipeSyncManager {
  constructor() {}

  async syncRecipe(message: RecipeSyncMessage): Promise<void> {
    const { recipeId, handle, type, payload, language } = message;
    
    // Get the shop from the payload or use a default
    const shop = 'nu3'; // This should be passed in the message or determined from context
    
    try {
      // Check if recipe already exists
      const existingRecipe = await this.getRecipeEntity(shop, recipeId, handle, type, language);
      
      let articleId: string;
      
      if (existingRecipe) {
        // Update existing article
        articleId = await this.updateArticle(shop, existingRecipe.externalArticleId, payload);
      } else {
        // Create new article
        articleId = await this.createArticle(shop, type, payload);
      }
      
      // Save to recipe content table
      await this.saveRecipeContent(shop, recipeId, handle, type, payload, articleId, language);
      
    } catch (error) {
      console.error('Error syncing recipe:', error);
      throw error;
    }
  }

  private async updateArticle(shop: string, articleId: string, payload: RecipePayload): Promise<string> {
    const shopifyClient = createShopifyClient(shop);
    
    // Get blog ID for the article type
    const blogEntity = await this.getBlogEntity(shop, payload.language);
    if (!blogEntity) {
      throw new Error(`Blog not found for type: ${payload.language}`);
    }

    // Update the article
    const articleData = {
      title: payload.title,
      content: payload.content,
      summary: payload.summary,
      tags: payload.tags.join(', '),
      published: true
    };

    await shopifyClient.article.update(blogEntity.externalBlogId, articleId, articleData);

    // Update metafields if featured image exists
    if (payload.featuredImage) {
      await shopifyClient.metafield.create({
        namespace: 'recipe',
        key: 'featured_image',
        value: payload.featuredImage,
        type: 'single_line_text_field',
        owner_resource: 'article',
        owner_id: articleId
      });
    }

    return articleId;
  }

  private async createArticle(shop: string, type: string, payload: RecipePayload): Promise<string> {
    const shopifyClient = createShopifyClient(shop);
    
    // Get blog ID for the article type
    const blogEntity = await this.getBlogEntity(shop, type);
    if (!blogEntity) {
      throw new Error(`Blog not found for type: ${type}`);
    }

    // Create the article
    const articleData = {
      title: payload.title,
      content: payload.content,
      summary: payload.summary,
      tags: payload.tags.join(', '),
      published: true
    };

    const article = await shopifyClient.article.create(blogEntity.externalBlogId, articleData);
    const articleId = article.id.toString();

    // Add metafields if featured image exists
    if (payload.featuredImage) {
      await shopifyClient.metafield.create({
        namespace: 'recipe',
        key: 'featured_image',
        value: payload.featuredImage,
        type: 'single_line_text_field',
        owner_resource: 'article',
        owner_id: articleId
      });
    }

    return articleId;
  }

  private async getRecipeEntity(shop: string, recipeId: string, handle: string, type: string, language: string): Promise<{ externalArticleId: string } | null> {
    // This would use the Gadget API to find existing recipe content
    // For now, returning null to indicate no existing recipe
    return null;
  }

  private async getBlogEntity(shop: string, type: string) {
    // This would use the Gadget API to find the blog mapping
    // For now, returning a default blog entity
    return {
      externalBlogId: '1' // This should be retrieved from recipeBlogType model
    };
  }

  private async saveRecipeContent(shop: string, recipeId: string, handle: string, type: string, payload: RecipePayload, articleId: string, language: string): Promise<void> {
    // This would use the Gadget API to save the recipe content
    // Implementation would use the recipeContent model
    console.log('Saving recipe content:', { shop, recipeId, handle, type, articleId, language });
  }
}