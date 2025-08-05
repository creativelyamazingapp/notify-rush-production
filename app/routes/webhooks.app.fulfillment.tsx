// import type { ActionFunctionArgs } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
// import db from "../db.server";
// import { PrismaClient } from "@prisma/client";

// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { shop, session, topic, payload } = await authenticate.webhook(request);

//   console.log(`Received ${topic} webhook for ${shop}`);

//   const prisma = new PrismaClient();

//   // Webhook requests can trigger multiple times and after an app has already been uninstalled.
//   // If this webhook already ran, the session may have been deleted previously.
//   if (session) {
//     console.log("=================>FulFulment Webhook<=================");

//     // Ensure it's a POST request
//     if (request.method !== "POST") {
//       return new Response("Invalid request method", { status: 405 });
//     }

//     try {
     

//       // Extract the order ID from the payload
//       const gidOrderId = payload.admin_graphql_api_id;
//       const orderId = gidOrderId.split("/").pop(); // Extracts the ID after the last '/'

//       // Check if the order exists in the database
//       const existingOrder = await prisma.order.findUnique({
//         where: { id: `gid://shopify/Order/${orderId}` } // Ensure the correct format is used
//       });

//       if (existingOrder) {
//         // Update the order record with fulfillment details
//         const updatedOrder = await prisma.order.update({
//           where: { id: `gid://shopify/Order/${orderId}` },
//           data: {
//             fulfillmentStatus: payload.fulfillment_status,
//             fulfillmentLastUpdatedDate: new Date(payload.updated_at),
//             fulfillmentTrackingNumber: payload.fulfillments[0]?.tracking_number || null,
//             fulfillmentTrackingUrl: payload.fulfillments[0]?.tracking_urls[0] || null,
//             trackingCompany: payload.fulfillments[0]?.tracking_company || null,
//           },
//         });

//         console.log("Order updated successfully with fulfillment details:");

//         return new Response("Fulfillment data updated successfully", { status: 200 });
//       } else {
//         console.error(`Order with ID ${orderId} does not exist in the database.`);
//         return new Response(`Order with ID ${orderId} does not exist`, { status: 404 });
//       }
//     } catch (error) {
//       console.error("Error processing fulfillment webhook:", error);
//       return new Response("Error processing fulfillment webhook", { status: 500 });
//     }
//   } else {
//     console.log("No session found for shop", shop);
//   }

//   return new Response();
// };


import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

/**
 * Optional: Convert raw Shopify statuses to your internal simplified statuses.
 * If you want to store Shopify's status verbatim, remove this function
 * and store payload.fulfillment_status directly.
 */
function mapShopifyFulfillmentStatus(shopifyStatus: string | null) {
  if (!shopifyStatus) return null;
  const lower = shopifyStatus.toLowerCase();
  switch (lower) {
    case "fulfilled":
    case "fulfilled_in_transit":
    case "in_transit":
    case "partially_fulfilled":
    case "partially_shipped":
    case "shipped":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return shopifyStatus; // fallback to raw
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const prisma = new PrismaClient();

  // Webhook requests can trigger multiple times even after an app is uninstalled,
  // so the session may have been deleted previously.
  if (session) {
    console.log("=================>FulFulment Webhook<=================");

    // Ensure it's a POST request
    if (request.method !== "POST") {
      await prisma.$disconnect();
      return new Response("Invalid request method", { status: 405 });
    }

    try {
      // Extract the Shopify GID from the payload, e.g. "gid://shopify/Order/1234567890"
      const gidOrderId = payload.admin_graphql_api_id; 
      const orderId = gidOrderId.split("/").pop(); // Get the numeric portion after last '/'

      // Check if the order exists in the database
      const existingOrder = await prisma.order.findUnique({
        where: { id: `gid://shopify/Order/${orderId}` },
      });

      if (!existingOrder) {
        console.error(`Order with ID ${orderId} does not exist in the database.`);
        await prisma.$disconnect();
        return new Response(`Order with ID ${orderId} does not exist`, { status: 404 });
      }

      // Possibly multiple fulfillments. We'll pick the *most recently updated* or the first.
      const fulfillments = payload.fulfillments || [];
      if (fulfillments.length === 0) {
        console.warn("No fulfillments array in payload");
        await prisma.$disconnect();
        return new Response("No fulfillments to process", { status: 200 });
      }

      // Sort fulfillments by updated_at desc, pick the latest
      fulfillments.sort((a: any, b: any) => {
        return new Date(b.updated_at).valueOf() - new Date(a.updated_at).valueOf();
      });
      const latestFulfillment = fulfillments[0];

      // Example: Map the raw Shopify "fulfillment_status" to your internal status
      const mappedStatus = mapShopifyFulfillmentStatus(payload.fulfillment_status || null);

      // Update the order record with fulfillment details
      await prisma.order.update({
        where: { id: `gid://shopify/Order/${orderId}` },
        data: {
          // If you'd prefer the raw Shopify status, store payload.fulfillment_status directly
          fulfillmentStatus: mappedStatus,
          fulfillmentLastUpdatedDate: new Date(latestFulfillment.updated_at),
          fulfillmentTrackingNumber: latestFulfillment?.tracking_number || null,
          fulfillmentTrackingUrl: latestFulfillment?.tracking_urls?.[0] || null,
          trackingCompany: latestFulfillment?.tracking_company || null,
        },
      });

      console.log("Order updated successfully with fulfillment details");
      await prisma.$disconnect();
      return new Response("Fulfillment data updated successfully", { status: 200 });
    } catch (error) {
      console.error("Error processing fulfillment webhook:", error);
      await prisma.$disconnect();
      return new Response("Error processing fulfillment webhook", { status: 500 });
    }
  } else {
    console.log("No session found for shop", shop);
  }

  await prisma.$disconnect();
  return new Response();
};
