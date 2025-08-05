// import {
//   Page,
//   Layout,
//   Card,
//   Button,
//   Banner,
//   ResourceList,
// } from "@shopify/polaris";
// import { useFetcher } from "@remix-run/react";
// import { useEffect, useState } from "react";import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "app/shopify.server";
// import  Shopify  from '@shopify/shopify-api';
// import { GraphqlClient } from '@shopify/shopify-api';




// // Define types for PollingData and FetcherData
// type PollingData = {
//   status: string;
//   url?: string;
// };
// type FetcherData = PollingData | undefined;

// // Variables to track progress
// let totalRecords = 0;
// let processedRecords = 0;

// // Function to check the status of the bulk operation
// const checkBulkOperationStatus = async (admin, bulkOperationId) => {
//   try {
//     const response = await admin.graphql(`
//       query {
//         node(id: "${bulkOperationId}") {
//           ... on BulkOperation {
//             id
//             status
//             url
//             errorCode
//             objectCount
//             fileSize
//           }
//         }
//       }
//     `);

//     const data = await response.json();
//     console.log("Bulk Operation Status:", data);

//     return data.data.node;
//   } catch (error) {
//     console.error("Error checking bulk operation status:", error);
//     return null;
//   }
// };

// // Function to initiate the bulk operation
// const initiateBulkOperation = async (admin) => {
//   try {
//     const response = await admin.graphql(`
//       mutation {
//   bulkOperationRunQuery(
//     query: """
//     {
//       orders {
//         edges {
//           node {
//             id
//             name
//             email
//             createdAt
//             updatedAt
//             lineItems {
//               edges {
//                 node {
//                   id
//                   name
//                   title
//                   image {
//                     url
//                   }
//                   product {
//                     id
//                     title
//                   }
//                 }
//               }
//             }
//             totalPriceSet {
//               shopMoney {
//                 amount
//                 currencyCode
//               }
//             }
//             customer {
//               id
//               firstName
//               lastName
//               email
//             }
//             fulfillments {
//               trackingInfo {
//                 company
//                 number
//                 url
//               }
//               updatedAt
//               status
//             }
//           }
//         }
//       }
//     }
//     """
//   ) {
//     bulkOperation {
//       id
//       status
//       url
//     }
//     userErrors {
//       field
//       message
//     }
//   }
// }
//     `);
//     const data = await response.json();

//     if (
//       response.ok &&
//       !data.errors &&
//       data.data.bulkOperationRunQuery.bulkOperation
//     ) {
//       return {
//         success: true,
//         bulkOperation: data.data.bulkOperationRunQuery.bulkOperation,
//       };
//     } else {
//       console.error("Bulk operation initiation failed:", data.errors);
//       return { success: false, error: data.errors };
//     }
//   } catch (error) {
//     console.error("Bulk operation initiation failed:", error);
//     return { success: false, error };
//   }
// };

// let isFirstLog = true;

// // Function to fetch refunds for each order
// const fetchOrderRefunds = async (admin, orderId: string) => {
//   try {
//     const response = await admin.graphql(
//       `
//       query fetchOrderRefunds($orderId: ID!) {
//         order(id: $orderId) {
//           id
//           name
//           refunds {
//             id
//             createdAt
//             note
//             totalRefundedSet {
//               shopMoney {
//                 amount
//                 currencyCode
//               }
//             }
//             refundLineItems(first: 100) {
//               edges {
//                 node {
//                   lineItem {
//                     id
//                     name
//                     quantity
//                     originalUnitPriceSet {
//                       shopMoney {
//                         amount
//                         currencyCode
//                       }
//                     }
//                   }
//                   quantity
//                   restockType
//                   location {
//                     id
//                     name
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }`,
//       {
//         variables: { orderId },
//       },
//     );

//     const rawResponse = await response.text();

//     // Log only the first response for debugging, and stop logging after that
//     if (isFirstLog) {
//       console.log("Raw GraphQL Response:", rawResponse);
//       isFirstLog = false;
//     }

//     if (response.ok) {
//       const data = JSON.parse(rawResponse);
//       return data.data.order.refunds;
//     } else {
//       console.error(`Failed to fetch refunds for order ${orderId}`);
//       return null;
//     }
//   } catch (error) {
//     console.error("An error occurred during the GraphQL query:", error);
//     return null;
//   }
// };



// // Action function that initiates the bulk operation, polls for its completion, processes the data, and upserts refunds
// export const action: ActionFunction = async ({ request }) => {
//   const prisma = new PrismaClient();
//   try {
//     // Step 1: Authenticate the user
//     // const { admin } = await authenticate.admin(request);


//      // Get the storeId from the form submission
//      const formData = await request.formData();
//      const storeId = formData.get("storeId");
 
//      if (!storeId) {
//        return json({ status: "ERROR", error: "Store ID is required" }, { status: 400 });
//      }
 
 
//      if (!storeId) {
//       return json({ status: "ERROR", error: "Store ID is required" }, { status: 400 });
//     }




//    const admin = new Shopify.Clients.Graphql(shopDomain, accessToken);

//       // Use the client to make a GraphQL request
//       const query = `{
//         shop {
//           name
//         }
//       }`;
   
    

//     // Fetch the shop's accessToken and shopDomain from the Session model
//     const session = await prisma.session.findUnique({
//       where: { storeId: storeId as string }, // Adjust field names based on your schema
//     });

//     if (!session) {
//       return json({ status: "ERROR", error: "Invalid Store ID or session not found" }, { status: 400 });
//     }
   
//     // Step 2: Initiate the bulk operation
//     const { success, bulkOperation, error } =
//       await initiateBulkOperation(admin);

//     if (!success) {
//       console.error("Bulk operation initiation failed:", error);
//       return json({ status: "ERROR", error }, { status: 500 });
//     }

       

//     // Step 3: Poll for bulk operation completion
//     let operationStatus = bulkOperation.status;
//     let bulkDataUrl = null;

//     while (operationStatus !== "COMPLETED") {
//       // Wait for 5 seconds before checking the status again
//       await new Promise((resolve) => setTimeout(resolve, 5000));

//       const statusCheck = await checkBulkOperationStatus(
//         admin,
//         bulkOperation.id,
//       );
//       operationStatus = statusCheck.status;

//       if (operationStatus === "COMPLETED") {
//         bulkDataUrl = statusCheck.url; // URL to fetch the result data
//         break;
//       } else if (operationStatus === "FAILED") {
//         console.error("Bulk operation failed");
//         return json(
//           { status: "ERROR", error: "Bulk operation failed" },
//           { status: 500 },
//         );
//       }
//     }

//     if (!bulkDataUrl) {
//       console.error("No URL found for bulk data after completion.");
//       return json(
//         { status: "ERROR", error: "No URL for bulk data" },
//         { status: 500 },
//       );
//     }



//     // Step 4: Fetch the bulk operation result data from the returned URL
//     const bulkDataResponse = await fetch(bulkDataUrl);
//     const bulkDataText = await bulkDataResponse.text();
//     const lines = bulkDataText.split("\n").filter((line) => line.trim() !== "");

//     // Set totalRecords after fetching bulk data
//     totalRecords = lines.length;
//     processedRecords = 0; // Reset processedRecords when starting

//     console.log("Number of lines to process:", lines.length);

//     // Step 5: Process each line and perform database operations
//     const upsertPromises = [];

//     for (const line of lines) {
//       try {
//         const item = JSON.parse(line);

//         // Log progress
//         console.log(
//           `Processing record ${Math.min(
//             processedRecords + 1,
//             totalRecords,
//           )} of ${totalRecords}`,
//         );

//         // Check if the item is an Order
//         if (item.id.startsWith("gid://shopify/Order")) {
//           // Extract Order Information
//           const orderId = item.id;
//           const totalPriceAmount = item?.totalPriceSet?.shopMoney?.amount || 0;
//           const currencyCode = item?.totalPriceSet?.shopMoney?.currencyCode || "USD";

//           // Extract Customer Information from the Order
//           const orderEmail = item.email;
//           const orderFirstName = item.customer?.firstName || null;
//           const orderLastName = item.customer?.lastName || null;
//           const customerShopifyId = item.customer?.id || null;

//           // Fulfillment Details
//           const fulfillmentStatus = item.fulfillments[0]?.status || null;
//           const fulfillmentLastUpdatedDate = item.fulfillments[0]?.updatedAt
//             ? new Date(item.fulfillments[0].updatedAt)
//             : null;
//           const trackingNumber = item.fulfillments[0]?.trackingInfo[0]?.number || null;
//           const trackingUrl = item.fulfillments[0]?.trackingInfo[0]?.url || null;
//           const trackingCompany = item.fulfillments[0]?.trackingInfo[0]?.company || null;

//           // Calculate order count and total order value from all orders of this customer
//           const orderStats = await prisma.order.aggregate({
//             where: { email: orderEmail },
//             _count: { id: true },
//             _sum: { totalPrice: true },
//           });

//           const orderCount = orderStats._count.id || 0;
//           const totalOrderValue = orderStats._sum.totalPrice || 0.0;

//           // Upsert the Customer First
//           if (customerShopifyId) {
//             upsertPromises.push(
//               prisma.customer.upsert({
//                 where: { id: customerShopifyId },
//                 create: {
//                   id: customerShopifyId,
//                   email: orderEmail,
//                   firstName: orderFirstName,
//                   lastName: orderLastName,
//                   totalOrderValue:
//                     totalOrderValue +
//                     parseFloat(item?.totalPriceSet?.shopMoney?.amount || 0),
//                 },
//                 update: {
//                   firstName: orderFirstName,
//                   lastName: orderLastName,
//                   orderCount: orderCount + 1, // Increment count for this new order
//                   totalOrderValue:
//                     totalOrderValue +
//                     parseFloat(item?.totalPriceSet?.shopMoney?.amount || 0),
//                 },
//               }),
//             );
//             console.log(`Upserted customer ${customerShopifyId}`);
//           }

//           // Upsert the Order Next
//           upsertPromises.push(
//             prisma.order.upsert({
//               where: { id: orderId },
//               create: {
//                 id: orderId,
//                 shop: shopDomain,
//                 name: item.name,
//                 email: orderEmail,
//                 createdAt: new Date(item.createdAt),
//                 updatedAt: new Date(item.updatedAt),
//                 totalPrice: parseFloat(totalPriceAmount),
//                 currencyCode: currencyCode,
//                 customerId: customerShopifyId,
//                 customerFirstName: orderFirstName,
//                 customerLastName: orderLastName,
//                 fulfillmentStatus: fulfillmentStatus,
//                 fulfillmentLastUpdatedDate: fulfillmentLastUpdatedDate,
//                 fulfillmentTrackingNumber: trackingNumber,
//                 fulfillmentTrackingUrl: trackingUrl,
//                 trackingCompany: trackingCompany,
//               },
//               update: {
//                 name: item.name,
//                 email: orderEmail,
//                 createdAt: new Date(item.createdAt),
//                 updatedAt: new Date(item.updatedAt),
//                 totalPrice: parseFloat(totalPriceAmount),
//                 currencyCode: currencyCode,
//                 customerId: customerShopifyId,
//                 customerFirstName: orderFirstName,
//                 customerLastName: orderLastName,
//                 fulfillmentStatus: fulfillmentStatus,
//                 fulfillmentLastUpdatedDate: fulfillmentLastUpdatedDate,
//                 fulfillmentTrackingNumber: trackingNumber,
//                 fulfillmentTrackingUrl: trackingUrl,
//                 trackingCompany: trackingCompany,
//               },
//             }),
//           );
//           console.log(`Upserted order ${orderId}`);

//           // Fetch and upsert refunds associated with this order
//           const refunds = await fetchOrderRefunds(admin, orderId);
//           if (refunds) {
//             for (const refund of refunds) {
//               const refundAmount =
//                 refund?.totalRefundedSet?.shopMoney?.amount || 0;
//               const refundCurrency =
//                 refund?.totalRefundedSet?.shopMoney?.currencyCode || "USD";

//               // Upsert the Refund
//               upsertPromises.push(
//                 prisma.refund.upsert({
//                   where: { id: refund.id },
//                   create: {
//                     id: refund.id,
//                     orderId: orderId,
//                     note: refund.note,
//                     createdAt: new Date(refund.createdAt),
//                     currencyCode: refundCurrency,
//                     amount: parseFloat(refundAmount),
//                   },
//                   update: {
//                     note: refund.note,
//                     createdAt: new Date(refund.createdAt),
//                     amount: parseFloat(refundAmount),
//                     currencyCode: refundCurrency,
//                   },
//                 }),
//               );
//               console.log(`Upserted refund ${refund.id} for order ${orderId}`);

//               // Upsert refund line items for each refund
//               for (const lineItemEdge of refund.refundLineItems.edges) {
//                 const lineItem = lineItemEdge.node;

//                 upsertPromises.push(
//                   prisma.refundLineItem.upsert({
//                     where: { id: lineItem.lineItem.id },
//                     create: {
//                       id: lineItem.lineItem.id,
//                       refundId: refund.id,
//                       lineItemId: lineItem.lineItem.id,
//                       title: lineItem.lineItem.name,
//                       quantity: lineItem.quantity,
//                       orderName: item.name, // Store the Order name
//                     },
//                     update: {
//                       title: lineItem.lineItem.name,
//                       quantity: lineItem.quantity,
//                       orderName: item.name,
//                     },
//                   }),
//                 );
//                 console.log(
//                   `Upserted refund line item ${lineItem.lineItem.id}`,
//                 );
//               }
//             }
//           }
//         }

//         // Track progress and log intervals
//         processedRecords = Math.min(processedRecords + 1, totalRecords);
//         if (processedRecords % 10 === 0 || processedRecords === totalRecords) {
//           console.log(`Processed ${processedRecords} out of ${totalRecords}`);
//         }

//         // Stop processing when complete
//         if (processedRecords >= totalRecords) {
//           console.log("Processing completed.");
//           break;
//         }
//       } catch (error) {
//         console.error(`Failed to process line: ${line}`, error);
//       }
//     }

//     // Execute upserts in parallel
//     await Promise.all(upsertPromises);

//     // Return progress information
//     return json({
//       status: "COMPLETED",
//       totalRecords,
//       processedRecords,
//     });
//   } catch (error) {
//     console.error("Error in action function:", error);
//     return json({ status: "ERROR", error }, { status: 500 });
//   } finally {
//     // Always disconnect Prisma at the end
//     await prisma.$disconnect();
//   }
// };

// // Loader function to fetch the current bulk operation status
// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);

//   // Query the current bulk operation status
//   const responseBulk = await admin.graphql(`
//     query {
//       currentBulkOperation {
//         id
//         status
//         errorCode
//         createdAt
//         completedAt
//         objectCount
//         fileSize
//         url
//         partialDataUrl
//       }
//     }
//   `);

//   const data = await responseBulk.json();

//   // Log the bulk operation status to check if it's running or completed
//   if (responseBulk.ok && data.data.currentBulkOperation) {
//     // Return the bulk operation status along with progress data
//     return json({
//       bulkOperationStatus: data.data.currentBulkOperation,
//       totalRecords, // Total number of records to be processed
//       processedRecords, // Number of records processed so far
//     });
//   } else {
//     return json(null, { status: 500 });
//   }
// };

// // Define the type for the data returned by the loader
// type ProgressData = {
//   totalRecords: number;
//   processedRecords: number;
// };

// const AdminDataSync = () => {
//   const fetcher = useFetcher();
//   const [stores, setStores] = useState([]);
//   const [loading, setLoading]= useState(false);
//   const [selectedStore, setSelectedStore] = useState(null);
//   const [isSyncing, setIsSyncing] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");


//   const fetchStoreData = () => {
//     setLoading(true);
//     const fullUrl = `/getStores`;
//     fetcher.load(fullUrl);
//   };


//   // useEffect(() => {
//   //   if (fetcher.data && fetcher.data.stores) {
//   //     setStores(fetcher.data.stores);
//   //   }
//   // }, [fetcher.data]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         stores,
 
//       } = fetcher.data;
//      setStores(stores)
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     fetchStoreData();
//   }, []);

//   const handleSync = (storeId) => {
//     setSelectedStore(storeId);
//     setIsSyncing(true);
//     setErrorMessage("");

//     try {
//       fetcher.submit({ storeId }, { method: "post", action: "/app/adminSyncData" });
//     } catch (error) {
//       console.error("Sync Error:", error);
//       setErrorMessage("Failed to start sync. Please try again later.");
//       setIsSyncing(false);
//     }
//   };

//   return (
//     <Page title="Admin - Store Data Sync">
//       <Layout>
//         {errorMessage && <Banner title={errorMessage} status="critical" />}

//         <Layout.Section>
//           <Card title="Stores" sectioned>
//             <ResourceList
//               resourceName={{ singular: "store", plural: "stores" }}
//               items={stores}
//               renderItem={(store) => {
//                 const { id, shop } = store;
//                 return (
//                   <ResourceList.Item id={id} accessibilityLabel={`Sync data for ${shop}`}>
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                       <div>{shop}</div>
//                       <Button
//                         onClick={() => handleSync(id)}
//                         disabled={isSyncing && selectedStore === id}
//                       >
//                         {isSyncing && selectedStore === id ? "Syncing..." : "Sync Data"}
//                       </Button>
//                     </div>
//                   </ResourceList.Item>
//                 );
//               }}
//             />
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// };

// export default AdminDataSync;
