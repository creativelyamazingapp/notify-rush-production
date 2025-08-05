// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   Button,
//   ProgressBar,
//   Banner,
// } from "@shopify/polaris";
// import { useFetcher } from "@remix-run/react";
// import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import { useEffect, useState } from "react";
// import { authenticate } from "app/shopify.server";

// // Track progress globally
// let totalRecords = 0;
// let processedRecords = 0;
// let isSyncRunning = false; // Track whether a sync is ongoing

// // Query customers incrementally by CREATED_AT ascending
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

// // Orders query
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

// async function fetchCustomersPage(admin, first = 100, after = null) {
//   const variables = { first, after };
//   const response = await admin.graphql(CUSTOMERS_QUERY, { variables });
//   const raw = await response.text();
//   if (!response.ok) {
//     console.error("Failed to fetch customers page:", raw);
//     throw new Error("Failed to fetch customers page");
//   }
//   const data = JSON.parse(raw);
//   return data.data.customers;
// }

// async function fetchOrdersPage(admin, first = 100, after = null) {
//   const variables = { first, after };
//   const response = await admin.graphql(ORDERS_QUERY, { variables });
//   const raw = await response.text();
//   if (!response.ok) {
//     console.error("Failed to fetch orders page:", raw);
//     throw new Error("Failed to fetch orders page");
//   }
//   const data = JSON.parse(raw);
//   return data.data.orders;
// }

// async function fetchOrderRefunds(admin, orderId: string) {
//   try {
//     const response = await admin.graphql(REFUNDS_QUERY, { variables: { orderId } });
//     const rawResponse = await response.text();
//     if (response.ok) {
//       const data = JSON.parse(rawResponse);
//       return data.data.order.refunds || [];
//     } else {
//       console.error(`Failed to fetch refunds for order ${orderId}:`, rawResponse);
//       return [];
//     }
//   } catch (error) {
//     console.error("Error fetching refunds:", error);
//     return [];
//   }
// }

// async function processCustomersBatch(prisma: PrismaClient, customers) {
//   for (const customer of customers) {
//     processedRecords += 1;
//     const customerId = customer.id;
//     const email = customer.email;
//     const firstName = customer.firstName || null;
//     const lastName = customer.lastName || null;

//     console.log("Upserting customer:", {
//       customerId,
//     });

//     // Try-catch to ensure if one fails, we continue with the next
//     try {
//       await prisma.$transaction(async (tx) => {
//         await tx.customer.upsert({
//           where: { id: customerId },
//           create: {
//             id: customerId,
//             email: email,
//             firstName: firstName,
//             lastName: lastName,
//           },
//           update: {
//             firstName: firstName,
//             lastName: lastName,
//           },
//         });
//       });
//     } catch (error) {
//       console.error(`Error upserting customer ${customerId} (${email}):`, error);
//       // Continue to next customer
//     }
//   }
// }

// async function processOrdersBatch(admin, prisma: PrismaClient, orders, shop: string) {
//   for (const order of orders) {
//     processedRecords += 1;
//     const orderId = order.id;
//     const totalPriceAmount = order?.totalPriceSet?.shopMoney?.amount || 0;
//     const currencyCode = order?.totalPriceSet?.shopMoney?.currencyCode || "USD";

//     const orderEmail = order.email;
//     const orderFirstName = order.customer?.firstName || null;
//     const orderLastName = order.customer?.lastName || null;
//     const customerShopifyId = order.customer?.id || null;

//     const fulfillmentStatus = order.fulfillments[0]?.status || null;
//     const fulfillmentLastUpdatedDate = order.fulfillments[0]?.updatedAt
//       ? new Date(order.fulfillments[0].updatedAt)
//       : null;
//     const trackingNumber = order.fulfillments[0]?.trackingInfo[0]?.number || null;
//     const trackingUrl = order.fulfillments[0]?.trackingInfo[0]?.url || null;
//     const trackingCompany = order.fulfillments[0]?.trackingInfo[0]?.company || null;

 

//     try {
//       await prisma.$transaction(async (tx) => {
//         await tx.order.upsert({
//           where: { id: orderId },
//           create: {
//             id: orderId,
//             shop: shop,
//             name: order.name,
//             email: orderEmail,
//             createdAt: new Date(order.createdAt),
//             updatedAt: new Date(order.updatedAt),
//             totalPrice: parseFloat(totalPriceAmount),
//             currencyCode: currencyCode,
//             customerId: customerShopifyId,
//             customerFirstName: orderFirstName,
//             customerLastName: orderLastName,
//             fulfillmentStatus: fulfillmentStatus,
//             fulfillmentLastUpdatedDate: fulfillmentLastUpdatedDate,
//             fulfillmentTrackingNumber: trackingNumber,
//             fulfillmentTrackingUrl: trackingUrl,
//             trackingCompany: trackingCompany,
//           },
//           update: {
//             name: order.name,
//             email: orderEmail,
//             createdAt: new Date(order.createdAt),
//             updatedAt: new Date(order.updatedAt),
//             totalPrice: parseFloat(totalPriceAmount),
//             currencyCode: currencyCode,
//             customerId: customerShopifyId,
//             customerFirstName: orderFirstName,
//             customerLastName: orderLastName,
//             fulfillmentStatus: fulfillmentStatus,
//             fulfillmentLastUpdatedDate: fulfillmentLastUpdatedDate,
//             fulfillmentTrackingNumber: trackingNumber,
//             fulfillmentTrackingUrl: trackingUrl,
//             trackingCompany: trackingCompany,
//           },
//         });

//         const refunds = await fetchOrderRefunds(admin, orderId);

//         for (const refund of refunds) {
//           const refundAmount = refund?.totalRefundedSet?.shopMoney?.amount || 0;
//           const refundCurrency = refund?.totalRefundedSet?.shopMoney?.currencyCode || "USD";

//           const refundUniqueId = refund.id;

//           try {
//             await tx.refund.upsert({
//               where: { id: refundUniqueId },
//               create: {
//                 id: refundUniqueId,
//                 orderId: orderId,
//                 note: refund.note,
//                 createdAt: new Date(refund.createdAt),
//                 currencyCode: refundCurrency,
//                 amount: parseFloat(refundAmount),
//               },
//               update: {
//                 note: refund.note,
//                 createdAt: new Date(refund.createdAt),
//                 amount: parseFloat(refundAmount),
//                 currencyCode: refundCurrency,
//               },
//             });
//           } catch (refundError) {
//             console.error(`Error upserting refund ${refundUniqueId} for order ${orderId}:`, refundError);
//             // continue with other refunds
//           }

//           for (const lineItemEdge of refund.refundLineItems.edges) {
//             const lineItem = lineItemEdge.node;
//             const refundLineItemUniqueId = lineItem.lineItem.id;

//             try {
//               await tx.refundLineItem.upsert({
//                 where: { id: refundLineItemUniqueId },
//                 create: {
//                   id: refundLineItemUniqueId,
//                   refundId: refundUniqueId,
//                   lineItemId: lineItem.lineItem.id,
//                   title: lineItem.lineItem.name,
//                   quantity: lineItem.quantity,
//                   orderName: order.name,
//                 },
//                 update: {
//                   title: lineItem.lineItem.name,
//                   quantity: lineItem.quantity,
//                   orderName: order.name,
//                 },
//               });
//             } catch (rliError) {
//               console.error(`Error upserting refund line item ${refundLineItemUniqueId} for refund ${refundUniqueId}:`, rliError);
//               // continue with other line items
//             }
//           }
//         }
//       });
//     } catch (orderError) {
//       console.error(`Error upserting order ${orderId}:`, orderError);
//       // continue with next order
//     }
//   }
// }

// export const action: ActionFunction = async ({ request }) => {
//   const prisma = new PrismaClient();
//   try {
//     if (isSyncRunning) {
//       return json({ status: "RUNNING", totalRecords, processedRecords });
//     }
//     isSyncRunning = true;
//     processedRecords = 0;
//     totalRecords = 0;

//     const { admin, session } = await authenticate.admin(request);

//     // 1. Sync Customers
//     {
//       let hasNextPage = true;
//       let after: string | null = null;
//       const pageSize = 100;

//       while (hasNextPage) {
//         const customersData = await fetchCustomersPage(admin, pageSize, after);
//         const customers = customersData.edges.map((edge) => edge.node);
//         const pageCount = customers.length;

//         hasNextPage = customersData.pageInfo.hasNextPage;
//         after = customersData.pageInfo.endCursor;


//         if (pageCount > 0) {
//           totalRecords += pageCount;
//           await processCustomersBatch(prisma, customers);
//         } else {
//           console.log("No customers found in this page. If hasNextPage is still true, it will attempt the next page.");
//         }
//       }
//     }

//     // 2. Sync Orders
//     {
//       let hasNextPage = true;
//       let after: string | null = null;
//       const pageSize = 100;

//       while (hasNextPage) {
//         const ordersData = await fetchOrdersPage(admin, pageSize, after);
//         const orders = ordersData.edges.map((edge) => edge.node);
//         const pageCount = orders.length;

//         hasNextPage = ordersData.pageInfo.hasNextPage;
//         after = ordersData.pageInfo.endCursor;


//         if (pageCount > 0) {
//           totalRecords += pageCount;
//           await processOrdersBatch(admin, prisma, orders, session.shop.toString());
//         } else {
//           console.log("No orders found in this page. If hasNextPage is still true, it will attempt the next page.");
//         }
//       }
//     }

//     isSyncRunning = false;
//     console.log(`Sync completed. totalRecords: ${totalRecords}, processedRecords: ${processedRecords}`);
//     return json({ status: "COMPLETED", totalRecords, processedRecords });
//   } catch (error) {
//     console.error("Error in action function:", error);
//     isSyncRunning = false;
//     return json({ status: "ERROR", error: String(error), totalRecords, processedRecords }, { status: 500 });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

// export const loader: LoaderFunction = async () => {
//   return json({
//     status: isSyncRunning ? "RUNNING" : "IDLE",
//     totalRecords,
//     processedRecords,
//   });
// };

// type ProgressData = {
//   totalRecords: number;
//   processedRecords: number;
//   status?: string;
// };

// const DataSync = () => {
//   const fetcher = useFetcher<ProgressData>();
//   const [totalRecordsState, setTotalRecords] = useState(0);
//   const [processedRecordsState, setProcessedRecords] = useState(0);
//   const [isExporting, setIsExporting] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
  

//   useEffect(() => {
//     if (isExporting) {
//       const interval = setInterval(() => {
//         fetcher.load("/app/syncData");
//       }, 5000);
//       return () => clearInterval(interval);
//     }
//   }, [isExporting, fetcher]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const { totalRecords = 0, processedRecords = 0, status } = fetcher.data;
//       setTotalRecords(totalRecords);
//       setProcessedRecords(processedRecords);

//       if (status === "COMPLETED" || (totalRecords > 0 && processedRecords >= totalRecords)) {
//         setIsExporting(false);
//       }

//       if (status === "ERROR") {
//         setErrorMessage("An error occurred during sync. Please try again.");
//         setIsExporting(false);
//       }
//     }
//   }, [fetcher.data]);

//   const startSync = async () => {
//     if (isExporting) return;
//     setIsExporting(true);
//     setErrorMessage("");
//     try {
//       fetcher.submit(null, { method: "post", action: "/app/syncData" });
//     } catch (error) {
//       console.error("Sync Error:", error);
//       setErrorMessage("Failed to start sync. Please try again later.");
//       setIsExporting(false);
//     }
//   };

//   const progressPercentage = totalRecordsState
//     ? Math.min((processedRecordsState / totalRecordsState) * 100, 100)
//     : 0;

//   return (
//     <Page title="Notify Rush - Data Sync">
//       <Layout>
//         {errorMessage && <Banner title={errorMessage} status="critical" />}
//         <Layout.Section>
//           <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//             <Card>
//             <Text variant="bodyLg" as="p">
//                 After installing Notify Rush. Please sync the data from your
//                 Shopify store to the app. Please click on the Sync Data button
//                 and once the progress page shows all the records are processed,
//                 you can check the app.
//                 <br />
//                 <br />
//                 Once you sync the complete data, the records will be synced
//                 automatically through webhooks.
//               </Text>
//             </Card>
//             <Card>
//               <Text as="h4" variant="headingMd">
//                 Data Sync
//               </Text>
//               <br />
//               <Button
//                 onClick={startSync}
//                 fullWidth
//                 variant="primary"
//                 disabled={isExporting}
//               >
//                 {isExporting ? "Data Syncing..." : "Start Data Sync"}
//               </Button>
//             </Card>
//           </div>
//         </Layout.Section>

//         {isExporting && (
//           <Layout.Section>
//             <Banner title="Data Sync in Progress">
//               <ProgressBar progress={progressPercentage} />
//               <p>
//                 {Math.min(processedRecordsState, totalRecordsState)} of {totalRecordsState} records processed
//               </p>
//             </Banner>
//           </Layout.Section>
//         )}

//         {!isExporting && processedRecordsState > 0 && processedRecordsState >= totalRecordsState && (
//           <Layout.Section>
//             <Banner title="Data Sync Complete" status="success">
//               <p>
//                 {processedRecordsState} of {totalRecordsState} records inserted or updated successfully.
//               </p>
//             </Banner>
//           </Layout.Section>
//         )}
//       </Layout>
//     </Page>
//   );
// };

// export default DataSync;


import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  ProgressBar,
  Banner,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { useEffect, useState } from "react";
import { authenticate } from "app/shopify.server";

// ------------------ Global progress tracking ------------------
let totalRecords = 0;
let processedRecords = 0;
let isSyncRunning = false; // Whether a sync is ongoing

// ------------------ GraphQL Queries ------------------
// 1) Query customers incrementally by CREATED_AT ascending
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

// 2) Query orders (now includes lineItems for product info)
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
                  # If you have images, you can query them further
                  # images(first: 5) {
                  #   edges {
                  #     node {
                  #       url
                  #     }
                  #   }
                  # }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// 3) Query refunds for a specific order
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

// ------------------ Fetch a page of customers ------------------
async function fetchCustomersPage(admin: any, first = 100, after: string | null = null) {
  const variables = { first, after };
  const response = await admin.graphql(CUSTOMERS_QUERY, { variables });
  const raw = await response.text();
  if (!response.ok) {
    console.error("Failed to fetch customers page:", raw);
    throw new Error("Failed to fetch customers page");
  }
  const data = JSON.parse(raw);
  return data.data.customers;
}

// ------------------ Fetch a page of orders (with line items) ------------------
async function fetchOrdersPage(admin: any, first = 100, after: string | null = null) {
  const variables = { first, after };
  const response = await admin.graphql(ORDERS_QUERY, { variables });
  const raw = await response.text();
  if (!response.ok) {
    console.error("Failed to fetch orders page:", raw);
    throw new Error("Failed to fetch orders page");
  }
  const data = JSON.parse(raw);
  return data.data.orders;
}

// ------------------ Fetch refunds for one order ------------------
async function fetchOrderRefunds(admin: any, orderId: string) {
  try {
    const response = await admin.graphql(REFUNDS_QUERY, { variables: { orderId } });
    const rawResponse = await response.text();
    if (response.ok) {
      const data = JSON.parse(rawResponse);
      return data.data.order.refunds || [];
    } else {
      console.error(`Failed to fetch refunds for order ${orderId}:`, rawResponse);
      return [];
    }
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return [];
  }
}

// ------------------ Process a batch of customers ------------------
async function processCustomersBatch(prisma: PrismaClient, customers: any[]) {
  for (const customer of customers) {
    processedRecords += 1;
    const customerId = customer.id;
    const email = customer.email;
    const firstName = customer.firstName || null;
    const lastName = customer.lastName || null;

    console.log("Upserting customer:", { customerId });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.customer.upsert({
          where: { id: customerId },
          create: {
            id: customerId,
            email,
            firstName,
            lastName,
          },
          update: {
            firstName,
            lastName,
          },
        });
      });
    } catch (error) {
      console.error(`Error upserting customer ${customerId} (${email}):`, error);
      // Continue to next customer
    }
  }
}

// ------------------ Process a batch of orders (with lineItems + refunds) ------------------
async function processOrdersBatch(admin: any, prisma: PrismaClient, orders: any[], shop: string) {
  for (const order of orders) {
    processedRecords += 1;

    const orderId = order.id;
    const totalPriceAmount = order?.totalPriceSet?.shopMoney?.amount || 0;
    const currencyCode = order?.totalPriceSet?.shopMoney?.currencyCode || "USD";
    const orderEmail = order.email;
    const orderFirstName = order.customer?.firstName || null;
    const orderLastName = order.customer?.lastName || null;
    const customerShopifyId = order.customer?.id || null;

    // Fulfillment details
    const fulfillmentStatus = order.fulfillments[0]?.status || null;
    const fulfillmentLastUpdatedDate = order.fulfillments[0]?.updatedAt
      ? new Date(order.fulfillments[0].updatedAt)
      : null;
    const trackingNumber = order.fulfillments[0]?.trackingInfo[0]?.number || null;
    const trackingUrl = order.fulfillments[0]?.trackingInfo[0]?.url || null;
    const trackingCompany = order.fulfillments[0]?.trackingInfo[0]?.company || null;

    // Grab line items
    const lineItems = order.lineItems?.edges || [];

    try {
      await prisma.$transaction(async (tx) => {
        // 1) Upsert the Order
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
            customerId: customerShopifyId,
            customerFirstName: orderFirstName,
            customerLastName: orderLastName,
            fulfillmentStatus,
            fulfillmentLastUpdatedDate,
            fulfillmentTrackingNumber: trackingNumber,
            fulfillmentTrackingUrl: trackingUrl,
            trackingCompany,
          },
          update: {
            name: order.name,
            email: orderEmail,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            totalPrice: parseFloat(totalPriceAmount),
            currencyCode,
            customerId: customerShopifyId,
            customerFirstName: orderFirstName,
            customerLastName: orderLastName,
            fulfillmentStatus,
            fulfillmentLastUpdatedDate,
            fulfillmentTrackingNumber: trackingNumber,
            fulfillmentTrackingUrl: trackingUrl,
            trackingCompany,
          },
        });

        // 2) Upsert line items + products
        for (const lineItemEdge of lineItems) {
          const lineItem = lineItemEdge.node;
          const productData = lineItem.product;
          // Upsert product if it exists
          if (productData && productData.id) {
            await tx.product.upsert({
              where: { id: productData.id },
              create: {
                id: productData.id,
                title: productData.title,
                images: [], // or parse from productData if you have productData.images
              },
              update: {
                title: productData.title,
                // images: ...
              },
            });
          }

          // Upsert orderLineItem
          await tx.orderLineItem.upsert({
            where: { id: lineItem.id },
            create: {
              id: lineItem.id,
              orderId,
              name: lineItem.name,
              title: lineItem.title,
              productId: productData?.id || "",
              imageUrl: lineItem.image?.url || null,
              quantity: lineItem.quantity || 1,
              price: 0, // If you want to store lineItem price, adapt from lineItem info
            },
            update: {
              name: lineItem.name,
              title: lineItem.title,
              productId: productData?.id || "",
              imageUrl: lineItem.image?.url || null,
              quantity: lineItem.quantity || 1,
              // price: ...
            },
          });
        }

        // 3) Fetch & upsert refunds
        const refunds = await fetchOrderRefunds(admin, orderId);
        for (const refund of refunds) {
          const refundAmount = refund?.totalRefundedSet?.shopMoney?.amount || 0;
          const refundCurrency = refund?.totalRefundedSet?.shopMoney?.currencyCode || "USD";
          const refundUniqueId = refund.id;

          // Upsert the Refund
          await tx.refund.upsert({
            where: { id: refundUniqueId },
            create: {
              id: refundUniqueId,
              orderId,
              note: refund.note,
              createdAt: new Date(refund.createdAt),
              currencyCode: refundCurrency,
              amount: parseFloat(refundAmount),
            },
            update: {
              note: refund.note,
              createdAt: new Date(refund.createdAt),
              currencyCode: refundCurrency,
              amount: parseFloat(refundAmount),
            },
          });

          // Upsert each refund line item
          for (const lineItemEdge of refund.refundLineItems.edges) {
            const li = lineItemEdge.node;
            const rliId = li.lineItem.id; // Using the same ID from Shopify for the refundLineItem

            await tx.refundLineItem.upsert({
              where: { id: rliId },
              create: {
                id: rliId,
                refundId: refundUniqueId,
                lineItemId: li.lineItem.id,
                title: li.lineItem.name,
                quantity: li.quantity,
                orderName: order.name,
              },
              update: {
                title: li.lineItem.name,
                quantity: li.quantity,
                orderName: order.name,
              },
            });
          }
        }
      });
    } catch (orderError) {
      console.error(`Error upserting order ${orderId}:`, orderError);
      // continue with next order
    }
  }
}

// ------------------ ACTION: Full Sync (Customers + Orders + Refunds + Items) ------------------
export const action: ActionFunction = async ({ request }) => {
  const prisma = new PrismaClient();
  try {
    if (isSyncRunning) {
      // If another sync is already running, just return current progress
      return json({ status: "RUNNING", totalRecords, processedRecords });
    }
    isSyncRunning = true;
    processedRecords = 0;
    totalRecords = 0;

    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop.toString();

    // 1) Sync Customers in pages
    {
      let hasNextPage = true;
      let after: string | null = null;
      const pageSize = 100;

      while (hasNextPage) {
        const customersData = await fetchCustomersPage(admin, pageSize, after);
        const customers = customersData.edges.map((edge: any) => edge.node);
        const pageCount = customers.length;

        hasNextPage = customersData.pageInfo.hasNextPage;
        after = customersData.pageInfo.endCursor;

        if (pageCount > 0) {
          totalRecords += pageCount;
          await processCustomersBatch(prisma, customers);
        } else {
          console.log("No customers found in this page.");
        }
      }
    }

    // 2) Sync Orders (with line items + refunds)
    {
      let hasNextPage = true;
      let after: string | null = null;
      const pageSize = 100;

      while (hasNextPage) {
        const ordersData = await fetchOrdersPage(admin, pageSize, after);
        const orders = ordersData.edges.map((edge: any) => edge.node);
        const pageCount = orders.length;

        hasNextPage = ordersData.pageInfo.hasNextPage;
        after = ordersData.pageInfo.endCursor;

        if (pageCount > 0) {
          totalRecords += pageCount;
          await processOrdersBatch(admin, prisma, orders, shop);
        } else {
          console.log("No orders found in this page.");
        }
      }
    }

    isSyncRunning = false;
    console.log(
      `Sync completed. totalRecords: ${totalRecords}, processedRecords: ${processedRecords}`
    );
    return json({ status: "COMPLETED", totalRecords, processedRecords });
  } catch (error) {
    console.error("Error in action function:", error);
    isSyncRunning = false;
    return json(
      { status: "ERROR", error: String(error), totalRecords, processedRecords },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};

// ------------------ LOADER: Return current progress & sync status ------------------
export const loader: LoaderFunction = async () => {
  return json({
    status: isSyncRunning ? "RUNNING" : "IDLE",
    totalRecords,
    processedRecords,
  });
};

type ProgressData = {
  totalRecords: number;
  processedRecords: number;
  status?: string;
};

// ------------------ REACT COMPONENT: DataSync Page ------------------
export default function DataSync() {
  const fetcher = useFetcher<ProgressData>();
  const [totalRecordsState, setTotalRecords] = useState(0);
  const [processedRecordsState, setProcessedRecords] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Poll the loader every 5s if we're syncing
  useEffect(() => {
    if (isExporting) {
      const interval = setInterval(() => {
        fetcher.load("/app/syncData");
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isExporting, fetcher]);

  // Update progress from loader results
  useEffect(() => {
    if (fetcher.data) {
      const { totalRecords = 0, processedRecords = 0, status } = fetcher.data;
      setTotalRecords(totalRecords);
      setProcessedRecords(processedRecords);

      if (
        status === "COMPLETED" ||
        (totalRecords > 0 && processedRecords >= totalRecords)
      ) {
        setIsExporting(false);
      }

      if (status === "ERROR") {
        setErrorMessage("An error occurred during sync. Please try again.");
        setIsExporting(false);
      }
    }
  }, [fetcher.data]);

  // Start the sync
  const startSync = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setErrorMessage("");

    try {
      fetcher.submit(null, { method: "post", action: "/app/syncData" });
    } catch (error) {
      console.error("Sync Error:", error);
      setErrorMessage("Failed to start sync. Please try again later.");
      setIsExporting(false);
    }
  };

  // Calculate progress
  const progressPercentage = totalRecordsState
    ? Math.min((processedRecordsState / totalRecordsState) * 100, 100)
    : 0;

  return (
    <Page title="Notify Rush - Data Sync">
      <Layout>
        {errorMessage && <Banner title={errorMessage} status="critical" />}
        <Layout.Section>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Card>
              <Text variant="bodyLg" as="p">
                After installing Notify Rush, please sync the data from your Shopify
                store to the app. Click on the Sync Data button. Once progress shows
                that all records have been processed, you can start using the app.
                <br />
                <br />
                After the initial sync, future orders will be synced automatically
                via webhooks.
              </Text>
            </Card>

            <Card>
              <Text as="h4" variant="headingMd">
                Data Sync
              </Text>
              <br />
              <Button
                onClick={startSync}
                fullWidth
                primary
                disabled={isExporting}
              >
                {isExporting ? "Data Syncing..." : "Start Data Sync"}
              </Button>
            </Card>
          </div>
        </Layout.Section>

        {isExporting && (
          <Layout.Section>
            <Banner title="Data Sync in Progress">
              <ProgressBar progress={progressPercentage} />
              <p>
                {Math.min(processedRecordsState, totalRecordsState)} of{" "}
                {totalRecordsState} records processed
              </p>
            </Banner>
          </Layout.Section>
        )}

        {!isExporting &&
          processedRecordsState > 0 &&
          processedRecordsState >= totalRecordsState && (
            <Layout.Section>
              <Banner title="Data Sync Complete" status="success">
                <p>
                  {processedRecordsState} of {totalRecordsState} records inserted
                  or updated successfully.
                </p>
              </Banner>
            </Layout.Section>
          )}
      </Layout>
    </Page>
  );
}
