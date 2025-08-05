// import { json, type ActionFunctionArgs } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
// import db from "../db.server";
// import { PrismaClient } from "@prisma/client";


// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { shop, session, topic, payload } = await authenticate.webhook(request);

//   console.log(`Received ${topic} webhook for ${shop}`);

//   const prisma = new PrismaClient();
//   // console.log("Payload-", payload)


//   // Webhook requests can trigger multiple times and after an app has already been uninstalled.
//   // If this webhook already ran, the session may have been deleted previously.
//   if (session) {
//     {
//       console.log("==============Order Create Webhook Started==============");

//       // Ensure it's a POST request
//       if (request.method !== "POST") {
//         return json({ error: "Invalid request method" }, { status: 405 });
//       }

//       try {
//         const newOrder = await prisma.$transaction(async (prisma) => {
//           const orderEmail = payload.customer?.email;
//           const customerShopifyId = payload.customer?.id?.toString();
//           const orderFirstName = payload.customer?.first_name;
//           const orderLastName = payload.customer?.last_name;
      
//           // Calculate order count and total order value from all orders of this customer
//           const orderStats = await prisma.order.aggregate({
//             where: { email: orderEmail },
//             _count: { id: true },
//             _sum: { totalPrice: true },
//           });
      
//           const orderCount = orderStats._count.id || 0;
//           const totalOrderValue = orderStats._sum.totalPrice || 0.0;
      
//           // Upsert the customer data from the Order model's fields
//           const upsertedCustomer = await prisma.customer.upsert({
//             where: { email: orderEmail },
//             create: {
//               id: `gid://shopify/Customer/${customerShopifyId}`, // Use Shopify Customer ID
//               email: orderEmail,
//               firstName: orderFirstName || null,
//               lastName: orderLastName || null,
//               orderCount: orderCount + 1, // Increment count for this new order
//               totalOrderValue:
//                 totalOrderValue + parseFloat(payload.total_price || "0"), // Add total price of current order
//             },
//             update: {
//               firstName: orderFirstName || null,
//               lastName: orderLastName || null,
//               orderCount: orderCount + 1, // Increment count for this new order
//               totalOrderValue:
//                 totalOrderValue + parseFloat(payload.total_price || "0"), // Add total price of current order
//             },
//           });
      
//           // Upsert Order
//           const order = await prisma.order.upsert({
//             where: { id: `gid://shopify/Order/${payload.id.toString()}` },
//             create: {
//               id: `gid://shopify/Order/${payload.id.toString()}`,
//               shop: session.shop,
//               name: payload.name,
//               email: orderEmail,
//               createdAt: new Date(payload.created_at),
//               updatedAt: new Date(payload.updated_at),
//               totalPrice: parseFloat(payload.total_price) || 0.0,
//               currencyCode: payload.currency,
//               // customerId: `gid://shopify/Customer/${upsertedCustomer.id.toString()}`,
//               customerId: upsertedCustomer.id, // Link to the upserted customer
//               customerFirstName: orderFirstName || null,
//               customerLastName: orderLastName || null,
//               shippingFirstName: payload.shipping_address?.first_name || null,
//               shippingLastName: payload.shipping_address?.last_name || null,
//               address1: payload.shipping_address?.address1 || null,
//               address2: payload.shipping_address?.address2 || null,
//               city: payload.shipping_address?.city || null,
//               province: payload.shipping_address?.province || null,
//               country: payload.shipping_address?.country || null,
//               zip: payload.shipping_address?.zip || null,
//             },
//             update: {
//               name: payload.name,
//               email: orderEmail,
//               updatedAt: new Date(payload.updated_at),
//               totalPrice: parseFloat(payload.total_price) || 0.0,
//               currencyCode: payload.currency,
//               customerId: `gid://shopify/Customer/${upsertedCustomer.id.toString()}`,
//               // customerId: upsertedCustomer.id, // Link to the upserted customer
//               customerFirstName: orderFirstName || null,
//               customerLastName: orderLastName || null,
//               shippingFirstName: payload.shipping_address?.first_name || null,
//               shippingLastName: payload.shipping_address?.last_name || null,
//               address1: payload.shipping_address?.address1 || null,
//               address2: payload.shipping_address?.address2 || null,
//               city: payload.shipping_address?.city || null,
//               province: payload.shipping_address?.province || null,
//               country: payload.shipping_address?.country || null,
//               zip: payload.shipping_address?.zip || null,
//             },
//           });
      
//             // Upsert Line Items and their related Products
//             for (const item of payload.line_items) {
//               let product = null;
      
//               // Check if productId exists and upsert the product if necessary
//               if (item.product_id) {
//                 product = await prisma.product.upsert({
//                   where: { id: `gid://shopify/Product/${item.product_id.toString()}` },
//                   create: {
//                     id: `gid://shopify/Product/${item.product_id.toString()}`,
//                     // id: item.product_id.toString(),
//                     title: item.name, // Assuming product title is the same as line item name
//                     images: item.image ? [item.image] : [], // Assuming the image is an array of one image
//                   },
//                   update: {
//                     title: item.name,
//                     images: item.image ? [item.image] : [],
//                   },
//                 });
//               }
      
//               // Prepare create and update objects
//               const createData = {
//                 id: `gid://shopify/LineItem/${item.id.toString()}`,
//                 orderId: order.id,
//               // orderId:  `gid://shopify/Order/${order.id}`,
//                 name: item.name,
//                 title: item.title,
//                 quantity: item.quantity || 1,
//                 price: parseFloat(item.price) || 0.0,
//                 imageUrl: item.image || null,
//                 // productId:  `gid://shopify/Product/${product?.id.toString()}` || "", // Ensure productId is always a string
//                 productId: product?.id || "", // Ensure productId is always a string
//               };
      
//               const updateData = {
//                 name: item.name,
//                 title: item.title,
//                 quantity: item.quantity || 1,
//                 price: parseFloat(item.price) || 0.0,
//                 imageUrl: item.image || null,
//                 productId: product?.id || "", // Ensure productId is always a string
//               };
      
//               // Upsert Line Item
//               await prisma.orderLineItem.upsert({
//                 where: { id: `gid://shopify/LineItem/${item.id.toString()}` },
//                 create: createData,
//                 update: updateData,
//               });
//             }
      
      
//           return order;
//         });
      
//         console.log("Order and line items upserted successfully:");
//       } catch (error) {
//         console.error("Error upserting order and line items:", error);
//       }
      
//     }
//   } else {
//     console.log("No session found for shop", shop);
//   }


//   return new Response();
// };


// March 26
// Webhook with order tag

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const prisma = new PrismaClient();
  // console.log("Payload-", payload)

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    {
      console.log("==============Order Create Webhook Started==============");

      // Ensure it's a POST request
      if (request.method !== "POST") {
        return json({ error: "Invalid request method" }, { status: 405 });
      }

      try {
        const newOrder = await prisma.$transaction(async (prisma) => {
          const orderEmail = payload.customer?.email;
          const customerShopifyId = payload.customer?.id?.toString();
          const orderFirstName = payload.customer?.first_name;
          const orderLastName = payload.customer?.last_name;

          // Calculate order count and total order value from all orders of this customer
          const orderStats = await prisma.order.aggregate({
            where: { email: orderEmail },
            _count: { id: true },
            _sum: { totalPrice: true },
          });

          const orderCount = orderStats._count.id || 0;
          const totalOrderValue = orderStats._sum.totalPrice || 0.0;

          // Upsert the customer data from the Order model's fields
          const upsertedCustomer = await prisma.customer.upsert({
            where: { email: orderEmail },
            create: {
              id: `gid://shopify/Customer/${customerShopifyId}`, // Use Shopify Customer ID
              email: orderEmail,
              firstName: orderFirstName || null,
              lastName: orderLastName || null,
              orderCount: orderCount + 1, // Increment count for this new order
              totalOrderValue:
                totalOrderValue + parseFloat(payload.total_price || "0"), // Add total price of current order
            },
            update: {
              firstName: orderFirstName || null,
              lastName: orderLastName || null,
              orderCount: orderCount + 1, // Increment count for this new order
              totalOrderValue:
                totalOrderValue + parseFloat(payload.total_price || "0"), // Add total price of current order
            },
          });

          // Convert Shopify's order "tags" (a comma-separated string) into a string array
          // If the order had no tags, this yields an empty array.
          const tagsArray = payload.tags
            ? payload.tags.split(",").map((tag: string) => tag.trim())
            : [];

          // Upsert Order
          const order = await prisma.order.upsert({
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
              customerId: upsertedCustomer.id, // Link to the upserted customer
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
              tags: tagsArray, // store order tags as string[]
            },
            update: {
              name: payload.name,
              email: orderEmail,
              updatedAt: new Date(payload.updated_at),
              totalPrice: parseFloat(payload.total_price) || 0.0,
              currencyCode: payload.currency,
              customerId: `gid://shopify/Customer/${upsertedCustomer.id.toString()}`,
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
              tags: tagsArray, // update order tags as string[]
            },
          });

          // Upsert Line Items and their related Products
          for (const item of payload.line_items) {
            let product = null;

            // Check if productId exists and upsert the product if necessary
            if (item.product_id) {
              product = await prisma.product.upsert({
                where: { id: `gid://shopify/Product/${item.product_id.toString()}` },
                create: {
                  id: `gid://shopify/Product/${item.product_id.toString()}`,
                  title: item.name, // Assuming product title is the same as line item name
                  images: item.image ? [item.image] : [],
                },
                update: {
                  title: item.name,
                  images: item.image ? [item.image] : [],
                },
              });
            }

            // Prepare create and update objects
            const createData = {
              id: `gid://shopify/LineItem/${item.id.toString()}`,
              orderId: order.id,
              name: item.name,
              title: item.title,
              quantity: item.quantity || 1,
              price: parseFloat(item.price) || 0.0,
              imageUrl: item.image || null,
              productId: product?.id || "",
            };

            const updateData = {
              name: item.name,
              title: item.title,
              quantity: item.quantity || 1,
              price: parseFloat(item.price) || 0.0,
              imageUrl: item.image || null,
              productId: product?.id || "",
            };

            // Upsert Line Item
            await prisma.orderLineItem.upsert({
              where: { id: `gid://shopify/LineItem/${item.id.toString()}` },
              create: createData,
              update: updateData,
            });
          }

          return order;
        });

        console.log("Order and line items upserted successfully:");
      } catch (error) {
        console.error("Error upserting order and line items:", error);
      }
    }
  } else {
    console.log("No session found for shop", shop);
  }

  return new Response();
};
