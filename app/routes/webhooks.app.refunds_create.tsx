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
    console.log("==============Refund Create Webhook Received==============");

    // Ensure it's a POST request
    if (request.method !== "POST") {
        return json({ error: "Invalid request method" }, { status: 405 });
    }

    try {

        // Extract the order ID from the payload
        const gidOrderId = payload.order_id;
        const orderId = gidOrderId.toString(); // Ensure the orderId is a string

        // Check if the order exists in the database
        const existingOrder = await prisma.order.findUnique({
            where: { id: `gid://shopify/Order/${orderId}` } // Ensure the correct format is used
        });

        // If order exists, proceed to insert refund data
        if (existingOrder) {
            // Extract necessary data from the refund in the payload
            const { id: refundId, created_at: createdAt, note, transactions, refund_line_items } = payload;

            // Calculate total refund amount (from transactions array in the refund)
            const totalRefundAmount = transactions.reduce((acc, transaction) => acc + parseFloat(transaction.amount), 0);

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
                }
            });

            console.log("Refund upserted successfully:", newRefund);

            // Insert or update refund line items
            for (const lineItem of refund_line_items) {
                const lineItemId = lineItem.line_item_id.toString();
                const quantity = lineItem.quantity || 1;

                await prisma.refundLineItem.upsert({
                    where: { id: `gid://shopify/Refund/${refundId}`  },
                    create: {
                        id: `gid://shopify/LineItem/${lineItemId.toString()}`,
                        refundId: newRefund.id,
                        lineItemId: `gid://shopify/LineItem/${lineItemId.toString()}`,
                        title: lineItem.line_item.title,
                        quantity,
                        orderName: existingOrder.name, // Store the order name for reference
                    },
                    update: {
                        title: lineItem.line_item.title,
                        quantity,
                        orderName: existingOrder.name,
                    }
                });

                console.log(`Refund line item upserted for item ID: ${lineItemId}`);
            }

            // Return a successful response
            return json({ message: "Refund processed successfully" }, { status: 200 });
        } else {
            console.error(`Order with ID ${orderId} does not exist in the database.`);
            return json({ error: `Order with ID ${orderId} does not exist` }, { status: 404 });
        }
    } catch (error) {
        console.error("Error processing refund webhook:", error);
        return json({ error: "Error processing refund webhook" }, { status: 500 });
    }
} else {
    console.log("No session found for shop", shop);
}


  return new Response();
};
