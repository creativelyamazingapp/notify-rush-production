import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

/**
 * Optional: Convert raw Shopify fulfillment status to your internal statuses.
 * If you want the raw Shopify status, remove this function
 * and store payload.status directly.
 */
function mapShopifyFulfillmentStatus(shopifyStatus: string | null) {
  if (!shopifyStatus) return null;
  const lower = shopifyStatus.toLowerCase();
  switch (lower) {
    case "pending":
    case "confirmed":
      return "Confirmed";
    case "in_transit":
    case "on_hold":
    case "partially_fulfilled":
      return "In Transit";
    case "out_for_delivery":
      return "Out for Delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return shopifyStatus; // fallback to the raw status
  }
}

/**
 * `fulfillments/update` webhook. Triggered when an existing fulfillment
 * is updated, e.g. going from "in_transit" to "out_for_delivery".
 */
export async function action({ request }: ActionFunctionArgs) {
  // Parse the Shopify webhook
  const { shop, session, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // The session may be null if the app is uninstalled, etc.
  if (!session) {
    console.log("No session found for shop:", shop);
    return new Response("No session found", { status: 401 });
  }

  // Validate HTTP method
  if (request.method !== "POST") {
    return new Response("Invalid request method", { status: 405 });
  }

  // Initialize Prisma
  const prisma = new PrismaClient();

  try {
    console.log("===========> Fulfillments Update Webhook <===========");

    // Identify the local order using Shopify's order_id
    // e.g. 820982911946154508 -> "gid://shopify/Order/820982911946154508"
    const shopifyOrderId = `gid://shopify/Order/${payload.order_id}`;

    // Try to find the existing order in your local DB
    const existingOrder = await prisma.order.findUnique({
      where: { id: shopifyOrderId },
    });

    if (!existingOrder) {
      console.error(
        `Order with ID ${shopifyOrderId} does not exist in the database.`,
      );
      return new Response(`Order with ID ${shopifyOrderId} does not exist`, {
        status: 404,
      });
    }

    console.log("Payload- ", payload)

    // Map Shopify's fulfillment status if desired
    const mappedStatus = mapShopifyFulfillmentStatus(payload.shipment_status || null);

    // Update the existing order with new fulfillment info
    // from the payload
    await prisma.order.update({
      where: { id: shopifyOrderId },
      data: {
        fulfillmentStatus: mappedStatus,
        fulfillmentLastUpdatedDate: new Date(payload.updated_at),
        fulfillmentTrackingNumber: payload.tracking_number || null,
        fulfillmentTrackingUrl: payload.tracking_urls?.[0] || null,
        trackingCompany: payload.tracking_company || null,
      },
    });

    console.log("Order updated successfully with new fulfillment details.");
    return new Response("Fulfillment data updated successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing fulfillments/update webhook:", error);
    return new Response("Error processing fulfillments/update webhook", {
      status: 500,
    });
  } finally {
    // Clean up the DB connection
    await prisma.$disconnect();
  }
}
