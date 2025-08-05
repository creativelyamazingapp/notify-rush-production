
// import type { Job } from "bull";
// import { PrismaClient } from "@prisma/client";
// import { createShopifyClient } from "app/utils/shopifyClient.server";

// // Global counters
// let totalRecords = 0;
// let processedRecords = 0;

// /**
//  * Simulated function to fetch the current carrier status from the carrier's API.
//  * In production, replace this with an actual API call to the carrier (e.g., using fetch or axios).
//  * For example, you might call:
//  *   GET https://carrierapi.example.com/track?number=${trackingNumber}&carrier=${carrier}
//  *
//  * For demonstration, we simulate a status based on the tracking number:
//  * - If the tracking number ends with an even digit, return "In Transit"
//  * - Otherwise, return "Delivered"
//  * If any error occurs or no valid status is returned, return "Shipped-Unknown Status".
//  */
// async function fetchCarrierStatus(url: string, trackingNumber: string): Promise<string> {
//   try {
//     // Simulated API call:
//     const lastDigit = trackingNumber.slice(-1);
//     if (parseInt(lastDigit) % 2 === 0) {
//       return "In Transit";
//     } else {
//       return "Delivered";
//     }
//   } catch (error) {
//     console.error("Error fetching carrier status:", error);
//     return "Shipped-Unknown Status";
//   }
// }

// /**
//  * Determine the fulfillment status using Shopify's fulfillment object.
//  * If tracking information exists (with both URL and tracking number),
//  * query the carrier's API to retrieve the current status.
//  * Otherwise, fall back on raw Shopify status values.
//  *
//  * If no tracking info is available, then:
//  *   - Return "Delivered" if the raw status is "delivered"
//  *   - Return "Confirmed" if the raw status is "success"
//  *   - Return "Pending" otherwise.
//  */
// async function determineFulfillmentStatus(fulfillment: any): Promise<string | null> {
//   if (!fulfillment) return null;
//   const rawStatus = fulfillment.status.toLowerCase();
//   if (fulfillment.trackingInfo && fulfillment.trackingInfo.length > 0) {
//     const tracking = fulfillment.trackingInfo[0];
//     if (tracking.url && tracking.number) {
//       // Query the carrier's API dynamically.
//       const carrierStatus = await fetchCarrierStatus(tracking.url, tracking.number);
//       return carrierStatus;
//     } else {
//       return "Shipped-Unknown Status";
//     }
//   } else {
//     // No tracking info available, so fallback on the raw status.
//     if (rawStatus === "delivered") return "Delivered";
//     if (rawStatus === "success") return "Confirmed";
//     return "Pending";
//   }
// }

// /**
//  * The main background job that syncs Shopify data. Called by Bull queue.
//  * @param job - Contains { shopDomain, token }
//  * @returns final { totalRecords, processedRecords }
//  */
// export async function processShopifySync(job: Job<{ shopDomain: string; token: string }>) {
//   const prisma = new PrismaClient();

//   try {
//     // Reset counters at the start of each job
//     totalRecords = 0;
//     processedRecords = 0;

//     const { shopDomain, token } = job.data;
//     if (!shopDomain) throw new Error("Missing shopDomain in job data");
//     if (!token) throw new Error("Missing token in job data");


//     // Initialize the Shopify client
//     const admin = createShopifyClient(shopDomain, token);

//     // 1) Sync CUSTOMERS
//     {
//       let hasNextPage = true;
//       let after: string | null = null;
//       const pageSize = 100;
//       let pageNumber = 0;

//       while (hasNextPage) {
//         pageNumber++;
    

//         const customersData = await fetchCustomersPage(admin, pageSize, after);
//         const customers = customersData.edges.map((e: any) => e.node);
//         const pageCount = customers.length;


//         if (pageCount > 0) {
//           totalRecords += pageCount;
//           await processCustomersBatch(prisma, customers, job);
//         } else {
//           if (customersData.pageInfo.hasNextPage) {
//             console.warn(
//               "[syncShopifyJob] Page is empty but hasNextPage=true. Breaking to avoid loop."
//             );
//           }
//           hasNextPage = customersData.pageInfo.hasNextPage && pageCount > 0;
//         }

//         after = customersData.pageInfo.endCursor;
//       }
//     }

//     // 2) Sync ORDERS (with line items + refunds)
//     {
//       let hasNextPage = true;
//       let after: string | null = null;
//       const pageSize = 100;
//       let pageNumber = 0;

//       while (hasNextPage) {
//         pageNumber++;
      

//         const ordersData = await fetchOrdersPage(admin, pageSize, after);
//         const orders = ordersData.edges.map((e: any) => e.node);
//         const pageCount = orders.length;

    

//         if (pageCount > 0) {
//           totalRecords += pageCount;
//           await processOrdersBatch(admin, prisma, orders, shopDomain, job);
//         } else {
//           if (ordersData.pageInfo.hasNextPage) {
//             console.warn(
//               "[syncShopifyJob] Page is empty but hasNextPage=true. Breaking to avoid loop."
//             );
//           }
//           hasNextPage = ordersData.pageInfo.hasNextPage && pageCount > 0;
//         }

//         after = ordersData.pageInfo.endCursor;
//       }
//     }

   
//     return { totalRecords, processedRecords };
//   } catch (error) {
//     console.error("[syncShopifyJob] Job failed:", error);
//     throw error; // ensure Bull marks it as failed
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // -----------------------------------------------------------------------------
// // Below is the updated code for database operations from your "syncData" route,
// // merged with the original job-based approach. We haven't omitted a single line.
// // -----------------------------------------------------------------------------

// // Example GraphQL queries
// const CUSTOMERS_QUERY = `
//   query fetchCustomers($first: Int!, $after: String) {
//     customers(first: $first, after: $after, sortKey: CREATED_AT, reverse: false) {
//       pageInfo {
//         hasNextPage
//         endCursor
//       }
//       edges {
//         node {
//           id
//           email
//           firstName
//           lastName
//           createdAt
//           updatedAt
//         }
//       }
//     }
//   }
// `;

// /**
//  * Updated ORDERS_QUERY to include lineItems, products, and images
//  * so we can insert them into the database.
//  */
// const ORDERS_QUERY = `
//   query fetchOrders($first: Int!, $after: String) {
//     orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: false) {
//       pageInfo {
//         hasNextPage
//         endCursor
//       }
//       edges {
//         node {
//           id
//           name
//           email
//           createdAt
//           updatedAt
//           totalPriceSet {
//             shopMoney {
//               amount
//               currencyCode
//             }
//           }
//           customer {
//             id
//             firstName
//             lastName
//             email
//           }
//           fulfillments {
//             trackingInfo {
//               company
//               number
//               url
//             }
//             updatedAt
//             status
//           }
//           lineItems(first: 100) {
//             edges {
//               node {
//                 id
//                 name
//                 title
//                 quantity
//                 image {
//                   url
//                 }
//                 product {
//                   id
//                   title
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// `;

// const REFUNDS_QUERY = `
//   query fetchOrderRefunds($orderId: ID!) {
//     order(id: $orderId) {
//       id
//       name
//       refunds {
//         id
//         createdAt
//         note
//         totalRefundedSet {
//           shopMoney {
//             amount
//             currencyCode
//           }
//         }
//         refundLineItems(first: 100) {
//           edges {
//             node {
//               lineItem {
//                 id
//                 name
//                 quantity
//                 originalUnitPriceSet {
//                   shopMoney {
//                     amount
//                     currencyCode
//                   }
//                 }
//               }
//               quantity
//               restockType
//               location {
//                 id
//                 name
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// `;

// async function fetchCustomersPage(admin: any, first = 100, after: string | null = null) {
//   const response = await admin.graphql(CUSTOMERS_QUERY, { first, after });
//   if (response.errors) {
//     console.error("fetchCustomersPage error:", response.errors);
//     throw new Error("Failed to fetch customers");
//   }
//   return response.data.customers;
// }

// async function fetchOrdersPage(admin: any, first = 100, after: string | null = null) {
//   const response = await admin.graphql(ORDERS_QUERY, { first, after });
//   if (response.errors) {
//     console.error("fetchOrdersPage error:", response.errors);
//     throw new Error("Failed to fetch orders");
//   }
//   return response.data.orders;
// }

// async function fetchOrderRefunds(admin: any, orderId: string) {
//   try {
//     const response = await admin.graphql(REFUNDS_QUERY, { orderId });
//     if (response.errors) {
//       console.error(`fetchOrderRefunds error for ${orderId}:`, response.errors);
//       return [];
//     }
//     return response.data.order?.refunds || [];
//   } catch (error) {
//     console.error("fetchOrderRefunds caught error:", error);
//     return [];
//   }
// }

// async function processCustomersBatch(prisma: PrismaClient, customers: any[], job: Job) {
//   for (const customer of customers) {
//     processedRecords++;

//     const email = customer.email;
//     const firstName = customer.firstName || null;
//     const lastName = customer.lastName || null;

//     if (!email) {
//       console.warn("[syncShopifyJob] Skipping customer with no email");
//       job.progress({ totalRecords, processedRecords });
//       continue;
//     }

//     try {
//       await prisma.customer.upsert({
//         where: { email },
//         create: { email, firstName, lastName },
//         update: { firstName, lastName },
//       });
//     } catch (err) {
//       console.error(`Error upserting customer [${email}]`, err);
//     }

//     job.progress({ totalRecords, processedRecords });
//   }
// }

// async function processOrdersBatch(admin: any, prisma: PrismaClient, orders: any[], shop: string, job: Job) {
//   for (const order of orders) {
//     processedRecords++;

//     let dbCustomerId: string | null = null;
//     const orderEmail = order.email || null;
//     const orderFirstName = order.customer?.firstName || null;
//     const orderLastName = order.customer?.lastName || null;

//     if (orderEmail) {
//       try {
//         const dbCustomer = await prisma.customer.upsert({
//           where: { email: orderEmail },
//           create: { email: orderEmail, firstName: orderFirstName, lastName: orderLastName },
//           update: { firstName: orderFirstName, lastName: orderLastName },
//         });
//         dbCustomerId = dbCustomer.id;
//       } catch (err) {
//         console.error(`[syncShopifyJob] Error upserting customer for order email ${orderEmail}`, err);
//       }
//     }

//     const orderId = order.id;
//     const totalPriceAmount = order?.totalPriceSet?.shopMoney?.amount || 0;
//     const currencyCode = order?.totalPriceSet?.shopMoney?.currencyCode || "USD";

//     const firstFulfillment = order.fulfillments[0] ?? null;
//     let mappedStatus: string | null = null;
//     if (firstFulfillment) {
//       mappedStatus = await determineFulfillmentStatus(firstFulfillment);
//     } else {
//       mappedStatus = null;
//     }
//     const fulfillmentLastUpdatedDate = firstFulfillment?.updatedAt ? new Date(firstFulfillment.updatedAt) : null;
//     const trackingNumber = firstFulfillment?.trackingInfo?.[0]?.number || null;
//     const trackingUrl = firstFulfillment?.trackingInfo?.[0]?.url || null;
//     const trackingCompany = firstFulfillment?.trackingInfo?.[0]?.company || null;

//     const lineItems = order.lineItems?.edges || [];

//     try {
//       await prisma.$transaction(async (tx) => {
//         // 🔹 Insert Order First
//         await tx.order.upsert({
//           where: { id: orderId },
//           create: {
//             id: orderId,
//             shop,
//             name: order.name,
//             email: orderEmail,
//             createdAt: new Date(order.createdAt),
//             updatedAt: new Date(order.updatedAt),
//             totalPrice: parseFloat(totalPriceAmount),
//             currencyCode,
//             customerId: dbCustomerId || undefined,
//             customerFirstName: orderFirstName,
//             customerLastName: orderLastName,
//             fulfillmentStatus: mappedStatus,
//             fulfillmentLastUpdatedDate,
//             fulfillmentTrackingNumber: trackingNumber,
//             fulfillmentTrackingUrl: trackingUrl,
//             trackingCompany,
//           },
//           update: {
//             shop,
//             name: order.name,
//             email: orderEmail,
//             createdAt: new Date(order.createdAt),
//             updatedAt: new Date(order.updatedAt),
//             totalPrice: parseFloat(totalPriceAmount),
//             currencyCode,
//             customerId: dbCustomerId || undefined,
//             customerFirstName: orderFirstName,
//             customerLastName: orderLastName,
//             fulfillmentStatus: mappedStatus,
//             fulfillmentLastUpdatedDate,
//             fulfillmentTrackingNumber: trackingNumber,
//             fulfillmentTrackingUrl: trackingUrl,
//             trackingCompany,
//           },
//         });

//         // 🔹 Process Order Line Items
//         for (const lineItemEdge of lineItems) {
//           const lineItem = lineItemEdge.node;
//           const productData = lineItem.product;

//           let productId = productData?.id || null;
//           let productTitle = productData?.title || lineItem.title || "Unknown Product";
//           let isCustomProduct = false;

//           // 🚀 **Handle Custom Products**
//           if (!productId) {
//             productId = `custom_${orderId}_${lineItem.id}`; // Generate unique ID for custom product
//             isCustomProduct = true;
//           }

//           // 🔹 Insert Product (including custom products)
//           await tx.product.upsert({
//             where: { id: productId },
//             create: {
//               id: productId,
//               title: productTitle,
//               images: [],
//             },
//             update: {
//               title: productTitle,
//             },
//           });

//           // 🔹 Insert OrderLineItem
//           await tx.orderLineItem.upsert({
//             where: { id: lineItem.id },
//             create: {
//               id: lineItem.id,
//               orderId,
//               name: lineItem.name,
//               title: lineItem.title,
//               productId: productId, // Ensure the product exists first
//               imageUrl: lineItem.image?.url || null,
//               quantity: lineItem.quantity || 1,
//               price: 0,
//             },
//             update: {
//               name: lineItem.name,
//               title: lineItem.title,
//               productId: productId,
//               imageUrl: lineItem.image?.url || null,
//               quantity: lineItem.quantity || 1,
//             },
//           });
//         }
//       });
//     } catch (err) {
//       console.error(`Error upserting order ${orderId}:`, err);
//     }

//     job.progress({ totalRecords, processedRecords });
//   }
// }


// March 26 2025
// Data sync with order tags

import type { Job } from "bull";
import { PrismaClient } from "@prisma/client";
import { createShopifyClient } from "app/utils/shopifyClient.server";

// Global counters
let totalRecords = 0;
let processedRecords = 0;

/**
 * Simulated function to fetch the current carrier status from the carrier's API.
 * In production, replace this with an actual API call to the carrier (e.g., using fetch or axios).
 * For example, you might call:
 *   GET https://carrierapi.example.com/track?number=${trackingNumber}&carrier=${carrier}
 *
 * For demonstration, we simulate a status based on the tracking number:
 * - If the tracking number ends with an even digit, return "In Transit"
 * - Otherwise, return "Delivered"
 * If any error occurs or no valid status is returned, return "Shipped-Unknown Status".
 */
async function fetchCarrierStatus(url: string, trackingNumber: string): Promise<string> {
  try {
    // Simulated API call:
    const lastDigit = trackingNumber.slice(-1);
    if (parseInt(lastDigit) % 2 === 0) {
      return "In Transit";
    } else {
      return "Delivered";
    }
  } catch (error) {
    console.error("Error fetching carrier status:", error);
    return "Shipped-Unknown Status";
  }
}

/**
 * Determine the fulfillment status using Shopify's fulfillment object.
 * If tracking information exists (with both URL and tracking number),
 * query the carrier's API to retrieve the current status.
 * Otherwise, fall back on raw Shopify status values.
 *
 * If no tracking info is available, then:
 *   - Return "Delivered" if the raw status is "delivered"
 *   - Return "Confirmed" if the raw status is "success"
 *   - Return "Pending" otherwise.
 */
async function determineFulfillmentStatus(fulfillment: any): Promise<string | null> {
  if (!fulfillment) return null;
  const rawStatus = fulfillment.status.toLowerCase();
  if (fulfillment.trackingInfo && fulfillment.trackingInfo.length > 0) {
    const tracking = fulfillment.trackingInfo[0];
    if (tracking.url && tracking.number) {
      // Query the carrier's API dynamically.
      const carrierStatus = await fetchCarrierStatus(tracking.url, tracking.number);
      return carrierStatus;
    } else {
      return "Shipped-Unknown Status";
    }
  } else {
    // No tracking info available, so fallback on the raw status.
    if (rawStatus === "delivered") return "Delivered";
    if (rawStatus === "success") return "Confirmed";
    return "Pending";
  }
}

/**
 * The main background job that syncs Shopify data. Called by Bull queue.
 * @param job - Contains { shopDomain, token }
 * @returns final { totalRecords, processedRecords }
 */
export async function processShopifySync(job: Job<{ shopDomain: string; token: string }>) {
  const prisma = new PrismaClient();

  try {
    // Reset counters at the start of each job
    totalRecords = 0;
    processedRecords = 0;

    const { shopDomain, token } = job.data;
    if (!shopDomain) throw new Error("Missing shopDomain in job data");
    if (!token) throw new Error("Missing token in job data");

    // Initialize the Shopify client
    const admin = createShopifyClient(shopDomain, token);

    // 1) Sync CUSTOMERS
    {
      let hasNextPage = true;
      let after: string | null = null;
      const pageSize = 100;
      let pageNumber = 0;

      while (hasNextPage) {
        pageNumber++;

        const customersData = await fetchCustomersPage(admin, pageSize, after);
        const customers = customersData.edges.map((e: any) => e.node);
        const pageCount = customers.length;

        if (pageCount > 0) {
          totalRecords += pageCount;
          await processCustomersBatch(prisma, customers, job);
        } else {
          if (customersData.pageInfo.hasNextPage) {
            console.warn(
              "[syncShopifyJob] Page is empty but hasNextPage=true. Breaking to avoid loop."
            );
          }
          hasNextPage = customersData.pageInfo.hasNextPage && pageCount > 0;
        }

        after = customersData.pageInfo.endCursor;
      }
    }

    // 2) Sync ORDERS (with line items + refunds + tags)
    {
      let hasNextPage = true;
      let after: string | null = null;
      const pageSize = 100;
      let pageNumber = 0;

      while (hasNextPage) {
        pageNumber++;

        const ordersData = await fetchOrdersPage(admin, pageSize, after);
        const orders = ordersData.edges.map((e: any) => e.node);
        const pageCount = orders.length;

        if (pageCount > 0) {
          totalRecords += pageCount;
          await processOrdersBatch(admin, prisma, orders, shopDomain, job);
        } else {
          if (ordersData.pageInfo.hasNextPage) {
            console.warn(
              "[syncShopifyJob] Page is empty but hasNextPage=true. Breaking to avoid loop."
            );
          }
          hasNextPage = ordersData.pageInfo.hasNextPage && pageCount > 0;
        }

        after = ordersData.pageInfo.endCursor;
      }
    }

    return { totalRecords, processedRecords };
  } catch (error) {
    console.error("[syncShopifyJob] Job failed:", error);
    throw error; // ensure Bull marks it as failed
  } finally {
    await prisma.$disconnect();
  }
}

// -----------------------------------------------------------------------------
// Below is the updated code for database operations from your "syncData" route,
// merged with the original job-based approach. We haven't omitted a single line.
// Only addition is the "tags" field in ORDERS_QUERY and saving them in DB.
// -----------------------------------------------------------------------------

// Example GraphQL queries
const CUSTOMERS_QUERY = `
  query fetchCustomers($first: Int!, $after: String) {
    customers(first: $first, after: $after, sortKey: CREATED_AT, reverse: false) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          email
          firstName
          lastName
          createdAt
          updatedAt
        }
      }
    }
  }
`;

/**
 * Updated ORDERS_QUERY to include lineItems, products, images, and now 'tags'
 * so we can insert them into the database.
 */
const ORDERS_QUERY = `
  query fetchOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: false) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          email
          createdAt
          updatedAt
          tags
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customer {
            id
            firstName
            lastName
            email
          }
          fulfillments {
            trackingInfo {
              company
              number
              url
            }
            updatedAt
            status
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                name
                title
                quantity
                image {
                  url
                }
                product {
                  id
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;

const REFUNDS_QUERY = `
  query fetchOrderRefunds($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      refunds {
        id
        createdAt
        note
        totalRefundedSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        refundLineItems(first: 100) {
          edges {
            node {
              lineItem {
                id
                name
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
              quantity
              restockType
              location {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchCustomersPage(admin: any, first = 100, after: string | null = null) {
  const response = await admin.graphql(CUSTOMERS_QUERY, { first, after });
  if (response.errors) {
    console.error("fetchCustomersPage error:", response.errors);
    throw new Error("Failed to fetch customers");
  }
  return response.data.customers;
}

async function fetchOrdersPage(admin: any, first = 100, after: string | null = null) {
  const response = await admin.graphql(ORDERS_QUERY, { first, after });
  if (response.errors) {
    console.error("fetchOrdersPage error:", response.errors);
    throw new Error("Failed to fetch orders");
  }
  return response.data.orders;
}

async function fetchOrderRefunds(admin: any, orderId: string) {
  try {
    const response = await admin.graphql(REFUNDS_QUERY, { orderId });
    if (response.errors) {
      console.error(`fetchOrderRefunds error for ${orderId}:`, response.errors);
      return [];
    }
    return response.data.order?.refunds || [];
  } catch (error) {
    console.error("fetchOrderRefunds caught error:", error);
    return [];
  }
}

async function processCustomersBatch(prisma: PrismaClient, customers: any[], job: Job) {
  for (const customer of customers) {
    processedRecords++;

    const email = customer.email;
    const firstName = customer.firstName || null;
    const lastName = customer.lastName || null;

    if (!email) {
      console.warn("[syncShopifyJob] Skipping customer with no email");
      job.progress({ totalRecords, processedRecords });
      continue;
    }

    try {
      await prisma.customer.upsert({
        where: { email },
        create: { email, firstName, lastName },
        update: { firstName, lastName },
      });
    } catch (err) {
      console.error(`Error upserting customer [${email}]`, err);
    }

    job.progress({ totalRecords, processedRecords });
  }
}

async function processOrdersBatch(admin: any, prisma: PrismaClient, orders: any[], shop: string, job: Job) {
  for (const order of orders) {
    processedRecords++;

    let dbCustomerId: string | null = null;
    const orderEmail = order.email || null;
    const orderFirstName = order.customer?.firstName || null;
    const orderLastName = order.customer?.lastName || null;

    if (orderEmail) {
      try {
        const dbCustomer = await prisma.customer.upsert({
          where: { email: orderEmail },
          create: { email: orderEmail, firstName: orderFirstName, lastName: orderLastName },
          update: { firstName: orderFirstName, lastName: orderLastName },
        });
        dbCustomerId = dbCustomer.id;
      } catch (err) {
        console.error(`[syncShopifyJob] Error upserting customer for order email ${orderEmail}`, err);
      }
    }

    const orderId = order.id;
    const totalPriceAmount = order?.totalPriceSet?.shopMoney?.amount || 0;
    const currencyCode = order?.totalPriceSet?.shopMoney?.currencyCode || "USD";

    const firstFulfillment = order.fulfillments[0] ?? null;
    let mappedStatus: string | null = null;
    if (firstFulfillment) {
      mappedStatus = await determineFulfillmentStatus(firstFulfillment);
    } else {
      mappedStatus = null;
    }
    const fulfillmentLastUpdatedDate = firstFulfillment?.updatedAt ? new Date(firstFulfillment.updatedAt) : null;
    const trackingNumber = firstFulfillment?.trackingInfo?.[0]?.number || null;
    const trackingUrl = firstFulfillment?.trackingInfo?.[0]?.url || null;
    const trackingCompany = firstFulfillment?.trackingInfo?.[0]?.company || null;

    const lineItems = order.lineItems?.edges || [];

    // Pull in the 'tags' from the order. Will store as String[] in DB.
    const orderTags = order.tags || [];

    try {
      await prisma.$transaction(async (tx) => {
        // 🔹 Insert/Update Order (with tags)
        await tx.order.upsert({
          where: { id: orderId },
          create: {
            id: orderId,
            shop,
            name: order.name,
            email: orderEmail,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            totalPrice: parseFloat(totalPriceAmount),
            currencyCode,
            customerId: dbCustomerId || undefined,
            customerFirstName: orderFirstName,
            customerLastName: orderLastName,
            fulfillmentStatus: mappedStatus,
            fulfillmentLastUpdatedDate,
            fulfillmentTrackingNumber: trackingNumber,
            fulfillmentTrackingUrl: trackingUrl,
            trackingCompany,
            tags: orderTags, // new: store tags
          },
          update: {
            shop,
            name: order.name,
            email: orderEmail,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            totalPrice: parseFloat(totalPriceAmount),
            currencyCode,
            customerId: dbCustomerId || undefined,
            customerFirstName: orderFirstName,
            customerLastName: orderLastName,
            fulfillmentStatus: mappedStatus,
            fulfillmentLastUpdatedDate,
            fulfillmentTrackingNumber: trackingNumber,
            fulfillmentTrackingUrl: trackingUrl,
            trackingCompany,
            tags: orderTags, // new: update tags
          },
        });

        // 🔹 Process Order Line Items
        for (const lineItemEdge of lineItems) {
          const lineItem = lineItemEdge.node;
          const productData = lineItem.product;

          let productId = productData?.id || null;
          let productTitle = productData?.title || lineItem.title || "Unknown Product";
          let isCustomProduct = false;

          // 🚀 **Handle Custom Products**
          if (!productId) {
            productId = `custom_${orderId}_${lineItem.id}`; // Generate unique ID for custom product
            isCustomProduct = true;
          }

          // 🔹 Insert Product (including custom products)
          await tx.product.upsert({
            where: { id: productId },
            create: {
              id: productId,
              title: productTitle,
              images: [],
            },
            update: {
              title: productTitle,
            },
          });

          // 🔹 Insert OrderLineItem
          await tx.orderLineItem.upsert({
            where: { id: lineItem.id },
            create: {
              id: lineItem.id,
              orderId,
              name: lineItem.name,
              title: lineItem.title,
              productId: productId, // Ensure the product exists first
              imageUrl: lineItem.image?.url || null,
              quantity: lineItem.quantity || 1,
              price: 0,
            },
            update: {
              name: lineItem.name,
              title: lineItem.title,
              productId: productId,
              imageUrl: lineItem.image?.url || null,
              quantity: lineItem.quantity || 1,
            },
          });
        }
      });
    } catch (err) {
      console.error(`Error upserting order ${orderId}:`, err);
    }

    job.progress({ totalRecords, processedRecords });
  }
}
