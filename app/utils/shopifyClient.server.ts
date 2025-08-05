// app/utils/shopifyClient.server.ts
import axios from "axios";

/**
 * A client that exposes `admin.graphql(query, variables)` using Axios.
 */
export function createShopifyClient(shopDomain: string, accessToken: string) {
  if (!shopDomain) {
    throw new Error("No shopDomain provided to createShopifyClient");
  }
  if (!accessToken) {
    throw new Error("No accessToken provided to createShopifyClient");
  }

  const baseURL = `https://${shopDomain}/admin/api/2023-01/graphql.json`;

  return {
    /**
     * Executes a GraphQL query against Shopify's Admin API.
     * @param query - The GraphQL query string.
     * @param variables - Optional variables for the GraphQL query.
     * @returns The data returned by the Shopify API.
     */
    async graphql(query: string, variables?: Record<string, any>) {
      try {
        const response = await axios.post(
          baseURL,
          { query, variables },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
          }
        );

        if (response.status !== 200) {
          throw new Error(`Shopify API responded with status ${response.status}: ${response.statusText}`);
        }

        // Check for GraphQL errors
        if (response.data.errors) {
          throw new Error(`Shopify GraphQL errors: ${JSON.stringify(response.data.errors)}`);
        }

        return response.data;
      } catch (error: any) {
        if (error.response && error.response.data) {
          throw new Error(`Shopify API error: ${JSON.stringify(error.response.data)}`);
        }
        throw new Error(`Shopify API error: ${error.message}`);
      }
    },
  };
}
