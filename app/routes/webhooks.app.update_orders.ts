import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1) Verify webhook and parse payload from Shopify
  const { shop, session, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const prisma = new PrismaClient();

  // For safety, confirm it's an orders/updated webhook
  // (If you only registered orders/updated with Shopify, you can skip this check.)
//   if (topic !== "orders/updated") {
//     return json({ error: "Invalid webhook topic" }, { status: 400 });
//   }

  // Webhook requests can arrive multiple times or after uninstallation
  // If there's no session, the shop might have uninstalled the app.
  if (!session) {
    console.log("[orders/updated] No session found for shop", shop);
    return new Response();
  }

  console.log("==============Order Updated Webhook Started==============");

  // Ensure it's a POST request
  if (request.method !== "POST") {
    return json({ error: "Invalid request method" }, { status: 405 });
  }

  try {
    // 2) Upsert the order + tags in a transaction
    await prisma.$transaction(async (prismaTx) => {
      const orderEmail = payload.customer?.email;
      const customerShopifyId = payload.customer?.id?.toString();
      const orderFirstName = payload.customer?.first_name;
      const orderLastName = payload.customer?.last_name;

      // We can do the same aggregator approach if desired:
      // Count how many orders this email has, sum their totals, etc.
      // (Or omit if you only need to update tags.)
      const orderStats = await prismaTx.order.aggregate({
        where: { email: orderEmail },
        _count: { id: true },
        _sum: { totalPrice: true },
      });
      const orderCount = orderStats._count.id || 0;
      const totalOrderValue = orderStats._sum.totalPrice || 0.0;

      // Upsert the customer object (just like your creation logic)
      // The "customer" might be updated with new info
      const upsertedCustomer = await prismaTx.customer.upsert({
        where: { email: orderEmail },
        create: {
          id: `gid://shopify/Customer/${customerShopifyId}`,
          email: orderEmail,
          firstName: orderFirstName || null,
          lastName: orderLastName || null,
          orderCount: orderCount, // Not necessarily +1, since the order already exists
          totalOrderValue,
        },
        update: {
          firstName: orderFirstName || null,
          lastName: orderLastName || null,
          // Optionally recalc orderCount and totalOrderValue if needed
        },
      });

      // Convert Shopify's tag string into a string array
      // e.g. "Tag1, Tag2" -> ["Tag1","Tag2"]
      const tagsArray = payload.tags
        ? payload.tags.split(",").map((t: string) => t.trim())
        : [];

      // Upsert the order record
      const order = await prismaTx.order.upsert({
        where: { id: `gid://shopify/Order/${payload.id.toString()}` },
        create: {
          id: `gid://shopify/Order/${payload.id.toString()}`,
          shop: session.shop,
          name: payload.name,
          email: orderEmail,
          createdAt: new Date(payload.created_at),
          updatedAt: new Date(payload.updated_at),
          totalPrice: parseFloat(payload.total_price) || 0.0,
          currencyCode: payload.currency,
          customerId: upsertedCustomer.id,
          customerFirstName: orderFirstName || null,
          customerLastName: orderLastName || null,
          shippingFirstName: payload.shipping_address?.first_name || null,
          shippingLastName: payload.shipping_address?.last_name || null,
          address1: payload.shipping_address?.address1 || null,
          address2: payload.shipping_address?.address2 || null,
          city: payload.shipping_address?.city || null,
          province: payload.shipping_address?.province || null,
          country: payload.shipping_address?.country || null,
          zip: payload.shipping_address?.zip || null,
          tags: tagsArray, // store tags array
        },
        update: {
          // Update fields that might have changed
          name: payload.name,
          email: orderEmail,
          updatedAt: new Date(payload.updated_at),
          totalPrice: parseFloat(payload.total_price) || 0.0,
          currencyCode: payload.currency,
          customerId: upsertedCustomer.id,
          customerFirstName: orderFirstName || null,
          customerLastName: orderLastName || null,
          shippingFirstName: payload.shipping_address?.first_name || null,
          shippingLastName: payload.shipping_address?.last_name || null,
          address1: payload.shipping_address?.address1 || null,
          address2: payload.shipping_address?.address2 || null,
          city: payload.shipping_address?.city || null,
          province: payload.shipping_address?.province || null,
          country: payload.shipping_address?.country || null,
          zip: payload.shipping_address?.zip || null,
          tags: tagsArray, // update tags array
        },
      });

      // Optionally, re-upsert line items if the updated payload includes them
      // (Shopify often sends the entire order body on "orders/updated".)
      // If not needed, you can omit the line items logic below.
      if (payload.line_items?.length) {
        for (const item of payload.line_items) {
          let product = null;

          if (item.product_id) {
            product = await prismaTx.product.upsert({
              where: { id: `gid://shopify/Product/${item.product_id.toString()}` },
              create: {
                id: `gid://shopify/Product/${item.product_id.toString()}`,
                title: item.name,
                images: item.image ? [item.image] : [],
              },
              update: {
                title: item.name,
                images: item.image ? [item.image] : [],
              },
            });
          }

          await prismaTx.orderLineItem.upsert({
            where: { id: `gid://shopify/LineItem/${item.id.toString()}` },
            create: {
              id: `gid://shopify/LineItem/${item.id.toString()}`,
              orderId: order.id,
              name: item.name,
              title: item.title,
              quantity: item.quantity || 1,
              price: parseFloat(item.price) || 0.0,
              imageUrl: item.image || null,
              productId: product?.id || "",
            },
            update: {
              name: item.name,
              title: item.title,
              quantity: item.quantity || 1,
              price: parseFloat(item.price) || 0.0,
              imageUrl: item.image || null,
              productId: product?.id || "",
            },
          });
        }
      }
    });

    console.log("[orders/updated] Order tags updated successfully.");
  } catch (error) {
    console.error("[orders/updated] Error upserting order & tags:", error);
  } finally {
    await prisma.$disconnect();
  }

  return new Response();
};
