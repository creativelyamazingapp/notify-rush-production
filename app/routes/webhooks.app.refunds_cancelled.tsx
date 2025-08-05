import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { PrismaClient } from "@prisma/client";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const prisma = new PrismaClient();

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    console.log("==============Order Cancelled Webhook Received==============");

    // Ensure it's a POST request
    if (request.method !== "POST") {
      return json({ error: "Invalid request method" }, { status: 405 });
    }
    try {
    

      // Extract the order ID from the payload
      const gidOrderId = payload.admin_graphql_api_id;
      const orderId = gidOrderId.split("/").pop(); // Extracts the ID after the last '/'

      // Check if the order exists in the database
      const existingOrder = await prisma.order.findUnique({
        where: { id: `gid://shopify/Order/${orderId}` }, // Ensure the correct format is used
      });

      // If order exists, proceed to update cancellation data and insert refund data
      if (existingOrder) {
        // Check if the customer exists
        const customerShopifyId = payload.customer?.id.toString();
        let customer = null;
        if (customerShopifyId) {
          customer = await prisma.customer.findUnique({
            where: { id: customerShopifyId },
          });
        }

        // If the customer doesn't exist, set customerId to null or handle accordingly
        const customerId = customer ? customerShopifyId : null;

        // Update the order record to reflect cancellation details
        const cancelledOrder = await prisma.order.update({
          where: { id: `gid://shopify/Order/${orderId}` },
          data: {
            updatedAt: new Date(payload.cancelled_at),
            totalPrice: parseFloat(payload.total_price), // Updating the total price
            currencyCode: payload.currency, // Updating the currency code
            name: payload.name, // Updating order name or number
            email: payload.email || existingOrder.email, // If email exists, update it
            customerId: customerId, // Update customer ID if exists
            customerFirstName: payload.customer?.first_name,
            customerLastName: payload.customer?.last_name,
            shippingFirstName: payload.shipping_address?.first_name,
            shippingLastName: payload.shipping_address?.last_name,
            address1: payload.shipping_address?.address1,
            address2: payload.shipping_address?.address2,
            city: payload.shipping_address?.city,
            province: payload.shipping_address?.province,
            country: payload.shipping_address?.country,
            zip: payload.shipping_address?.zip,
          },
        });

        console.log(
          "Order updated successfully with cancellation details:",
          cancelledOrder,
        );

        // Process refunds if they exist
        if (payload.refunds && payload.refunds.length > 0) {
          for (const refund of payload.refunds) {
            // Extract necessary data from each refund in the refunds array
            const {
              id: refundId,
              created_at: createdAt,
              note,
              transactions,
              refund_line_items,
            } = refund;

            // Calculate total refund amount (from transactions array in the refund)
            const totalRefundAmount = transactions.reduce(
              (acc, transaction) => acc + parseFloat(transaction.amount),
              0,
            );

            // Currency code can be taken from transactions, or set as default (e.g., "USD")
            const currencyCode = transactions[0]?.currency || "USD";

            // Insert or update refund record
            const newRefund = await prisma.refund.upsert({
              where: { id: `gid://shopify/Refund/${refundId}` },
              create: {
                id: `gid://shopify/Refund/${refundId}`,
                amount: totalRefundAmount,
                currencyCode,
                createdAt: new Date(createdAt),
                orderId: existingOrder.id,
                note: note || null,
              },
              update: {
                amount: totalRefundAmount,
                currencyCode,
                createdAt: new Date(createdAt),
                note: note || null,
              },
            });


            // Insert or update refund line items
            for (const lineItem of refund_line_items) {
              const lineItemId = lineItem.line_item_id.toString();
              const quantity = lineItem.quantity || 1;

              await prisma.refundLineItem.upsert({
                where: { id: `gid://shopify/LineItem/${lineItemId}` }, // Correctly use the line item unique identifier
                create: {
                  id: `gid://shopify/LineItem/${lineItemId}`, // Use a unique format for id
                  refundId: newRefund.id,
                  lineItemId: `gid://shopify/LineItem/${lineItemId}`,
                  title: lineItem.line_item.title,
                  quantity,
                  orderName: existingOrder.name, // Store the order name for reference
                },
                update: {
                  title: lineItem.line_item.title,
                  quantity,
                  orderName: existingOrder.name,
                },
              });

              console.log(
                `Refund line item upserted for item ID: ${lineItemId}`,
              );
            }
          }
        }

        // Return a successful response
        return json(
          { message: "Order cancellation processed successfully" },
          { status: 200 },
        );
      } else {
        console.error(
          `Order with ID ${orderId} does not exist in the database.`,
        );
        return json(
          { error: `Order with ID ${orderId} does not exist` },
          { status: 404 },
        );
      }
    } catch (error) {
      console.error("Error processing order cancellation webhook:", error);
      return json(
        { error: "Error processing order cancellation webhook" },
        { status: 500 },
      );
    }
  } else {
    console.log("No session found for shop", shop);
  }

  return new Response();
};
