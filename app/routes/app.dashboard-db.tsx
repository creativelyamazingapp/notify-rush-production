// import { useState, useEffect, useCallback } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Badge,
//   Banner,
//   Frame,
//   Toast,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css";
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import { sendEmail } from "./sendEmail"; // Adjust the path as necessary

// // Initialize Prisma Client
// const prisma = new PrismaClient();

// // Define the type for the loader data
// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;
//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//   }[];
//   currentPage: number;
//   totalPages: number;
//   // overallData: {
//   //   totalSalesAmount: number;
//   //   totalRefundAmount: number;
//   //   totalProfit: number;
//   // };
//   allOrders: any[]; // Holds all orders for search functionality
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const page = parseInt(url.searchParams.get("page") || "1", 10);
//   const filterType = url.searchParams.get("filterType") || "All";

//   // Convert to Date object
//   const startDate = startDateParam ? new Date(startDateParam) : null;
//   const endDate = endDateParam ? new Date(endDateParam) : null;

//   // Define filter logic based on filterType (Refunded, Non-Refunded, All)
//   let refundedFilter = {};
//   if (filterType === "Refunded") {
//     refundedFilter = {
//       refunds: {
//         some: {}, // Orders with refunds
//       },
//     };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = {
//       refunds: {
//         none: {}, // Orders without refunds
//       },
//     };
//   } else if (filterType === "Shipped") {
//     refundedFilter = {
//       fulfillmentStatus: "SUCCESS", // Only show shipped orders
//     };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [
//         { fulfillmentStatus: { not: "SUCCESS" } },
//         { fulfillmentStatus: null },
//       ], // Filter non-shipped orders
//     };
//   }

//   // Define page limit
//   const pageSize = 20;
//   const skip = (page - 1) * pageSize;

//   // Fetch total sales and refunds using Prisma's aggregation function
//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       shop: session.shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//     },
//   });

//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: {
//       order: {
//         shop: session.shop,
//         createdAt: {
//           gte: startDate || undefined,
//           lte: endDate || undefined,
//         },
//       },
//     },
//   });

//   // // Fetch all orders (not just the current page) for searching
//   // const allOrders = await prisma.order.findMany({
//   //   where: {
//   //     shop: session.shop,
//   //     createdAt: {
//   //       gte: startDate || undefined,
//   //       lte: endDate || undefined,
//   //     },
//   //     ...refundedFilter,
//   //   },
//   //   include: {
//   //     lineItems: true,
//   //     refunds: true,
//   //   },
//   // });

//   // // Fetch the orders for the current page
//   // const orders = await prisma.order.findMany({
//   //   where: {
//   //     shop: session.shop,
//   //     createdAt: {
//   //       gte: startDate || undefined,
//   //       lte: endDate || undefined,
//   //     },
//   //     refunds:
//   //       filterType === "Refunded"
//   //         ? { some: {} }
//   //         : filterType === "Non-Refunded"
//   //           ? { none: {} }
//   //           : undefined,
//   //   },
//   //   include: {
//   //     lineItems: true,
//   //     refunds: true,
//   //   },
//   //   orderBy: {
//   //     createdAt: "asc",
//   //   },
//   //   skip,
//   //   take: pageSize,
//   // });

//   // Fetch all orders for search functionality
//   const allOrders = await prisma.order.findMany({
//     where: {
//       shop: session.shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//   });

//   // Fetch orders for the current page
//   const orders = await prisma.order.findMany({
//     where: {
//       shop: session.shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//     skip,
//     take: pageSize,
//   });

//   // Prepare the table data
//   const ordersTableData = orders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     // Format shipping status and last updated date
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Prepare the data for all orders for search purposes
//   const allOrdersTableData = allOrders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     // Format shipping status and last updated date
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus, // Include this field
//       shippingLastUpdated, // Include this field
//     };
//   });

//   // Access the _sum properties directly after the query
//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;

//   // Calculate total profit
//   const totalProfit = totalSalesAmount - totalRefundAmount;

//   // const overallData = {
//   //   totalSalesAmount,
//   //   totalRefundAmount,
//   //   totalProfit,
//   // };

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: orders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages: Math.ceil(allOrders.length / pageSize),
//     // overallData,
//     allOrders: allOrdersTableData, // Provide all orders for search
//   });
// };

// const Dashboard = () => {
//   const [searchQuery, setSearchQuery] = useState(""); // State for search query
//   const [searchTopPro, setSearchTopPro] = useState(""); // State for search query

//   const [startChartDate, setStartChartDate] = useState(
//     format(subMonths(new Date(), 1), "yyyy-MM-dd"),
//   );
//   const [loading, setLoading] = useState(false);
//   const [endChartDate, setEndChartDate] = useState(
//     format(new Date(), "yyyy-MM-dd"),
//   );
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState([]);
//   const [topReasons, setTopReasons] = useState([]);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [refundDetails, setRefundDetails] = useState([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   const [errorMessage, setErrorMessage] = useState("");

//   const [selectedOrders, setSelectedOrders] = useState([]);

//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const fetcher = useFetcher();

//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     // overallData,
//     allOrders,
//   } = useLoaderData<LoaderData>();

//   const [filterType, setFilterType] = useState("All");
//   const [filteredRows, setFilteredRows] = useState([]);
//   const pageSize = 10; // Number of rows per page

//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 1), "yyyy-MM-dd"),
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

//   const [expandedRows, setExpandedRows] = useState({});

//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount,
//         totalProfit,
//         chartData,
//         topReasons,
//         topRefundedProducts,
//         refundedProducts,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(totalRefundAmount);
//       setChartProfit(totalProfit);
//       setChartMainData(chartData);
//       setTopReasons(topReasons);
//       setTopRefundedProducts(topRefundedProducts);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     fetchChartData();
//   }, []);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   const submit = useSubmit();

//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     setRefundDetails([]); // Ensure data is set to an array
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     setLoading(true);

//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Function to toggle the expansion of the ordered products row
//   const toggleRowExpansion = (orderNumber) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [orderNumber]: !prev[orderNumber],
//     }));
//   };

//   // Filter orders based on the search query
//   // const filteredOrders = (searchQuery ? allOrders : ordersTableData)
//   //   .filter((order) => {
//   //     const query = searchQuery.toLowerCase().trim();
//   //     return (
//   //       order.orderNumber.toLowerCase().includes(query) ||
//   //       order.customerName.toLowerCase().includes(query) ||
//   //       order.customerEmail.toLowerCase().includes(query) ||
//   //       order.orderedProducts.toLowerCase().includes(query)
//   //     );
//   //   })
//   //   .filter((order) => {
//   //     // Apply additional filter based on filterType
//   //     if (filterType === "Refunded") return order.isRefunded === "Yes";
//   //     if (filterType === "Non-Refunded") return order.isRefunded === "No";
//   //     if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//   //     if (filterType === "Non-Shipped")
//   //       return (
//   //         order.shippingStatus !== "SUCCESS" || order.shippingStatus === "N/A"
//   //       );

//   //     return true;
//   //   });

//   // Updated filter logic for multiple order numbers
//   const filteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (!searchQuery) return true;

//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter((q) => q !== "");

//       if (queries.length > 1) {
//         return queries.includes(order.orderNumber.toLowerCase());
//       }

//       const query = queries[0];
//       return (
//         order.orderNumber.toLowerCase().includes(query) ||
//         order.customerName.toLowerCase().includes(query) ||
//         order.customerEmail.toLowerCase().includes(query) ||
//         order.orderedProducts.toLowerCase().includes(query)
//       );
//     })
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//       if (filterType === "Non-Shipped")
//         return (
//           order.shippingStatus !== "SUCCESS" || order.shippingStatus === "N/A"
//         );

//       return true;
//     });

//   const statusBadge = (status) => {
//     let statusType = "default";
//     if (status === "SUCCESS") statusType = "success";
//     else if (status === "PENDING") statusType = "attention";

//     return <Badge status={statusType}>{status}</Badge>;
//   };

//   // Checkbox handler to select orders
//   const handleCheckboxChange = (orderNumber) => {
//     setSelectedOrders((prevSelected) =>
//       prevSelected.includes(orderNumber)
//         ? prevSelected.filter((id) => id !== orderNumber)
//         : [...prevSelected, orderNumber],
//     );
//   };

//   // Select all checkbox handler
//   const handleSelectAllChange = (event) => {
//     if (event.target.checked) {
//       // Select all filtered orders across all pages only if not already selected
//       const filteredOrderNumbers = filteredOrders.map(
//         (order) => order.orderNumber,
//       );
//       if (selectedOrders.length !== filteredOrderNumbers.length) {
//         setSelectedOrders(filteredOrderNumbers);
//       }
//     } else {
//       // Deselect all orders
//       setSelectedOrders([]);
//     }
//   };

//   // Function to create rows for each order, including expanded products
//   const getFormattedRows = () => {
//     const rows = [];

//     filteredOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ");
//       const hasMultipleProducts = productTitles.length > 1;

//       // Create the initial row that shows the first product with a checkbox
//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus,
//         order.shippingLastUpdated,
//         order.customerName,
//         order.customerEmail,
//         hasMultipleProducts ? (
//           <div
//             style={{
//               cursor: "pointer",
//               color: "blue",
//               textDecoration: "underline",
//             }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0]
//         ),
//         order.isRefunded,
//         order.orderAmount,
//       ]);

//       // If the row is expanded, add additional rows for each product
//       if (expandedRows[order.orderNumber] && hasMultipleProducts) {
//         productTitles.slice(1).forEach((title) => {
//           rows.push([
//             "", // Empty cells to keep column alignment
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: "20px" }}>{title}</div>, // Indented product name
//             "",
//             "",
//           ]);
//         });
//       }
//     });

//     return rows;
//   };

//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === filteredOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     "Is Refunded",
//     "Order Amount",
//   ];

//   useEffect(() => {
//     const rows = (searchQuery ? allOrders : ordersTableData)
//       .filter((order) => {
//         if (filterType === "Refunded") return order.isRefunded === "Yes";
//         if (filterType === "Non-Refunded") return order.isRefunded === "No";
//         if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";

//         return true;
//       })
//       .filter((order) => {
//         const query = searchQuery.toLowerCase().trim();
//         return (
//           order.orderNumber.toLowerCase().includes(query) ||
//           order.customerName.toLowerCase().includes(query) ||
//           order.orderedProducts.toLowerCase().includes(query)
//         );
//       })
//       .map((order) => [
//         order.orderNumber,
//         order.orderDate,
//         order.customerName,
//         order.customerEmail,
//         order.orderedProducts,
//         order.isRefunded,
//         order.orderAmount,
//       ]);
//     setFilteredRows(rows);
//   }, [filterType, searchQuery, ordersTableData, allOrders]);

//   const changeFilter = (filterType) => {
//     setFilterType(filterType);
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", filterType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   const goToPage = (page) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", page.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   const handleProductClick = async (product) => {
//     setSelectedProduct(product);

//     try {
//       // Fetch refund details for the selected product using title
//       const response = await fetch(
//         `/chartData?productTitle=${encodeURIComponent(product.title)}&startDate=${startDate}&endDate=${endDate}`,
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch refund details");
//       }

//       const data = await response.json();
//       setRefundDetails(data.refundDetails || []); // Ensure data is set to an array
//     } catch (error) {
//       console.error("Error fetching refund details:", error);
//       setRefundDetails([]); // Reset to an empty array on error
//       setErrorMessage("Please contact support."); // Set error message
//     }
//   };

//   const handleProductClickWrapper = (product) => () => {
//     handleProductClick(product);
//   };

//   useEffect(() => {
//     // Reset refundDetails and selectedProduct on component mount (page reload)
//     setRefundDetails([]);
//     setSelectedProduct(null);
//   }, []); // Empty dependency array ensures this runs only on mount

//   const filteredRefundDetails = refundDetails.filter(
//     (detail) =>
//       detail.orderNumber.toLowerCase().includes(searchTopPro.toLowerCase()) ||
//       detail.customerName.toLowerCase().includes(searchTopPro.toLowerCase()) ||
//       (detail.email?.toLowerCase() || "").includes(
//         searchTopPro.toLowerCase(),
//       ) ||
//       detail.refundNotes.toLowerCase().includes(searchTopPro.toLowerCase()),
//   );

//   // Send email to selected orders

//   interface Order {
//     orderNumber: string;
//     customerEmail: string;
//   }

//   interface YourComponentProps {
//     selectedOrders: Order[];
//   }

//   const getCustomerEmails = (orders: Order[]): string[] => {
//     return orders.map((order) => order.customerEmail).filter((email) => email); // Filter non-null emails
//   };

//   const handleSendEmail = () => {
//     // Find full details of selected orders from allOrders
//     const enrichedOrders = selectedOrders.map((orderNumber) =>
//       allOrders.find((order) => order.orderNumber === orderNumber),
//     );

//     // Filter out any orders that don't have emails or full details
//     const validOrders = enrichedOrders.filter(
//       (order) => order && order.customerEmail,
//     );

//     // Set the enriched list as selectedOrders
//     setSelectedOrders(validOrders);

//     setIsModalOpen(true); // Open the modal when the button is clicked
//     console.log("Sending email to orders:", validOrders);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false); // Close the modal when needed
//   };

//   // Helper function to introduce a delay
//   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   // Send email to all customers from selected orders with a delay
//   // Function to send emails to customers from selected orders
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false); // Controls visibility of the toast
//   const [toastMessage, setToastMessage] = useState(""); // Stores the error message

//   const toggleToast = useCallback(
//     () => setActiveToast((active) => !active),
//     [],
//   );

//   const sendEmailsToCustomers = async (selectedTemplate) => {
//     const { subject, bodyHtml, bodyText } = selectedTemplate;

//     selectedOrders.forEach(async (order) => {
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;

//       console.log(`Sending email to: ${toAddress}`);

//       try {
//         // Send email request
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });

//         // Handle response
//         if (response.ok) {
//           console.log(`Email sent successfully to ${toAddress}`);
//         } else {
//           const errorData = await response.json();
//           // Set error message and show toast
//           console.log("Error", errorData);

//           // Check if the error message contains "Email address is not verified"
//           if (errorMessage.includes("Email address is not verified")) {
//             setToastMessage(
//               "Fail to send email. Email address is not verified.",
//             );
//           } else {
//             setToastMessage(errorMessage);
//           }

//           setToastMessage(
//             errorData.error || "An error occurred while sending the email.",
//           );
//           setActiveToast(true);
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage(
//           "An unexpected error occurred while sending the email.",
//         );
//         setActiveToast(true);
//       }
//     });

//     // Close the modal after sending all emails
//     setIsModalOpen(false);
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner"></div>
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}
//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}

//         <Layout>
//           {noUserEmail && (
//             <Banner tone="critical" title="Error">
//               <p>{noUserEmail}</p>
//             </Banner>
//           )}
//           <div className="responsive-layout">
//             <div>
//               {/* Date Selector with Apply Button */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "10px",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <Card sectioned>
//                     <div
//                       style={{
//                         display: "flex",
//                         gap: "25px",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                     >
//                       <TextField
//                         label="Start Date"
//                         type="date"
//                         value={startDate}
//                         onChange={(value) => setStartDate(value)}
//                         autoComplete="off"
//                       />
//                       <TextField
//                         label="End Date"
//                         type="date"
//                         value={endDate}
//                         onChange={(value) => setEndDate(value)}
//                         autoComplete="off"
//                       />
//                       <Button primary onClick={handleSubmit} disabled={loading}>
//                         Apply
//                       </Button>
//                     </div>

//                     <div
//                       style={{
//                         display: "flex",
//                         gap: "25px",
//                         marginTop: "10px",
//                         justifyContent: "center",
//                       }}
//                     >
//                       <Button onClick={() => setDateRange(7)}>
//                         Last 7 Days
//                       </Button>
//                       <Button onClick={() => setDateRange(30)}>
//                         Last 30 Days
//                       </Button>
//                       <Button onClick={() => setDateRange(60)}>
//                         Last 60 Days
//                       </Button>
//                     </div>
//                   </Card>

//                   {/* Total Sales Card */}
//                   <Card sectioned>
//                     <Text variant="headingLg">
//                       Total Sales: {totalSalesAmount.toFixed(2)} {currencyCode}
//                     </Text>
//                   </Card>
//                   <div
//                     style={{
//                       display: "flex",
//                       gap: "10px",
//                       justifyContent: "center",
//                     }}
//                   ></div>
//                 </div>
//               </Layout.Section>
//               <Layout.Section id="table-section">
//                 {/* Show Send Email Button only when orders are selected */}
//                 {selectedOrders.length > 0 && (
//                   <div onClick={handleSendEmail}>
//                     <div
//                       onClick={handleSendEmail}
//                       style={{
//                         cursor: "pointer",
//                         backgroundColor: "#28a745", // Green background
//                         color: "white",
//                         borderRadius: "15px",
//                         margin: "20px",
//                         marginInline: "50px",
//                       }}
//                     >
//                       <p
//                         style={{
//                           alignContent: "center",
//                           textAlign: "center",
//                           font: "caption",
//                           fontSize: "30px",
//                           padding: "10px",
//                           fontFamily: "sans-serif",
//                         }}
//                       >
//                         Send Email
//                       </p>
//                     </div>
//                   </div>
//                 )}
//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)} // Correctly pass template
//                 />

//                 <div style={{ width: "full" }}>
//                   <Card sectioned>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "center",
//                         gap: "30px",
//                       }}
//                     >
//                       <Button
//                         variant={filterType === "All" ? "primary" : "plain"}
//                         onClick={() => changeFilter("All")}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         variant={
//                           filterType === "Refunded" ? "primary" : "plain"
//                         }
//                         onClick={() => changeFilter("Refunded")}
//                       >
//                         Refunded Orders
//                       </Button>
//                       <Button
//                         variant={
//                           filterType === "Non-Refunded" ? "primary" : "plain"
//                         }
//                         onClick={() => changeFilter("Non-Refunded")}
//                       >
//                         Non-Refunded Orders
//                       </Button>
//                       <Button
//                         variant={filterType === "Shipped" ? "primary" : "plain"}
//                         onClick={() => changeFilter("Shipped")}
//                       >
//                         Shipped Orders
//                       </Button>
//                       <Button
//                         variant={
//                           filterType === "Non-Shipped" ? "primary" : "plain"
//                         }
//                         onClick={() => changeFilter("Non-Shipped")}
//                       >
//                         Non-Shipped Orders
//                       </Button>
//                     </div>
//                   </Card>

//                   <Card sectioned>
//                     <TextField
//                       label="Search Orders"
//                       value={searchQuery}
//                       onChange={(value) => setSearchQuery(value)}
//                       autoComplete="off"
//                       placeholder="Search by order numbers (e.g., #101,#105,#108), customer name, or product"
//                     />
//                   </Card>

//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()} // Use function to generate rows
//                         // Add alternate row shading
//                         defaultSortDirection="descending"
//                         // Set column-specific alignments
//                         footerContent={`Total Orders: ${filteredOrders.length}`}
//                       />
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px",
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>
//                           Last
//                         </Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>
//         {/* Trigger toast */}
//         {activeToast && (
//           <Toast content={toastMessage} error onDismiss={toggleToast} />
//         )}
//       </Page>
//     </Frame>
//   );
// };

// export default Dashboard;

// import { useState, useEffect, useCallback } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Badge,
//   Banner,
//   Frame,
//   Toast,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css"; // Make sure Tailwind is also imported globally
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import { sendEmail } from "./sendEmail"; // Adjust the path as necessary

// // NEW: React-ChartJS-2 imports
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";

// // Initialize ChartJS with the needed components
// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// );

// // Initialize Prisma Client
// const prisma = new PrismaClient();

// // Define the type for the loader data
// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;
//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];
//   currentPage: number;
//   totalPages: number;
//   allOrders: any[]; // Holds all orders for search functionality

//   // Additional fields
//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const page = parseInt(url.searchParams.get("page") || "1", 10);
//   const filterType = url.searchParams.get("filterType") || "All";

//   // Convert to Date object
//   const startDate = startDateParam ? new Date(startDateParam) : null;
//   const endDate = endDateParam ? new Date(endDateParam) : null;

//   // Define filter logic based on filterType (Refunded, Non-Refunded, Shipped, Non-Shipped)
//   let refundedFilter = {};
//   if (filterType === "Refunded") {
//     refundedFilter = {
//       refunds: {
//         some: {}, // Orders with refunds
//       },
//     };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = {
//       refunds: {
//         none: {}, // Orders without refunds
//       },
//     };
//   } else if (filterType === "Shipped") {
//     refundedFilter = {
//       fulfillmentStatus: "SUCCESS", // Only show shipped orders
//     };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [
//         { fulfillmentStatus: { not: "SUCCESS" } },
//         { fulfillmentStatus: null },
//       ],
//     };
//   }

//   // Define page limit
//   const pageSize = 20;
//   const skip = (page - 1) * pageSize;

//   // Fetch total sales
//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       shop: session.shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//     },
//   });

//   // Fetch total refunds
//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: {
//       order: {
//         shop: session.shop,
//         createdAt: {
//           gte: startDate || undefined,
//           lte: endDate || undefined,
//         },
//       },
//     },
//   });

//   // Fetch all orders for search functionality
//   const allOrders = await prisma.order.findMany({
//     where: {
//       shop: session.shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//   });

//   // Fetch orders for the current page
//   const orders = await prisma.order.findMany({
//     where: {
//       shop: session.shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//     skip,
//     take: pageSize,
//   });

//   // Prepare the table data for the current page
//   const ordersTableData = orders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Prepare the data for all orders for search
//   const allOrdersTableData = allOrders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Calculate totals
//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;

//   // Additional aggregates
//   const totalOrdersCount = allOrders.length;
//   const totalShippedOrdersCount = allOrders.filter(
//     (o) => o.fulfillmentStatus === "SUCCESS",
//   ).length;
//   const totalRefundedOrdersCount = allOrders.filter(
//     (o) => o.refunds.length > 0,
//   ).length;
//   const totalUnfulfilledOrdersCount = allOrders.filter(
//     (o) => o.fulfillmentStatus !== "SUCCESS",
//   ).length;

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: orders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages: Math.ceil(allOrders.length / pageSize),
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   });
// };

// const Dashboard = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchTopPro, setSearchTopPro] = useState("");

//   // Default last 2 months
//   const [startChartDate, setStartChartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd"),
//   );
//   const [loading, setLoading] = useState(false);
//   const [endChartDate, setEndChartDate] = useState(
//     format(new Date(), "yyyy-MM-dd"),
//   );
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState([]);
//   const [topReasons, setTopReasons] = useState([]);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [refundDetails, setRefundDetails] = useState([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   const [errorMessage, setErrorMessage] = useState("");

//   const [selectedOrders, setSelectedOrders] = useState([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const fetcher = useFetcher();

//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,

//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   } = useLoaderData<LoaderData>();

//   const [filterType, setFilterType] = useState("All");
//   const [filteredRows, setFilteredRows] = useState([]);
//   const pageSize = 10;

//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd"),
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

//   const [expandedRows, setExpandedRows] = useState({});

//   const submit = useSubmit();

//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount,
//         totalProfit,
//         chartData,
//         topReasons,
//         topRefundedProducts,
//         refundedProducts,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(totalRefundAmount);
//       setChartProfit(totalProfit);
//       setChartMainData(chartData);
//       setTopReasons(topReasons);
//       setTopRefundedProducts(topRefundedProducts);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     fetchChartData();
//   }, []);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     setRefundDetails([]);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     setLoading(true);

//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Toggle expansion of products
//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [orderNumber]: !prev[orderNumber],
//     }));
//   };

//   // Filter logic for multiple order numbers
//   const filteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (!searchQuery) return true;

//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter((q) => q !== "");

//       if (queries.length > 1) {
//         return queries.includes(order.orderNumber.toLowerCase());
//       }

//       const query = queries[0];
//       return (
//         order.orderNumber.toLowerCase().includes(query) ||
//         order.customerName.toLowerCase().includes(query) ||
//         order.customerEmail.toLowerCase().includes(query) ||
//         order.orderedProducts.toLowerCase().includes(query)
//       );
//     })
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//       if (filterType === "Non-Shipped")
//         return (
//           order.shippingStatus !== "SUCCESS" || order.shippingStatus === "N/A"
//         );

//       return true;
//     });

//   const statusBadge = (status) => {
//     let statusType = "default";
//     if (status === "SUCCESS") statusType = "success";
//     else if (status === "PENDING") statusType = "attention";
//     return <Badge status={statusType}>{status}</Badge>;
//   };

//   // Checkbox handler
//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prevSelected) =>
//       prevSelected.includes(orderNumber)
//         ? prevSelected.filter((id) => id !== orderNumber)
//         : [...prevSelected, orderNumber],
//     );
//   };

//   // Select-all
//   const handleSelectAllChange = (event) => {
//     if (event.target.checked) {
//       const filteredOrderNumbers = filteredOrders.map(
//         (order) => order.orderNumber,
//       );
//       if (selectedOrders.length !== filteredOrderNumbers.length) {
//         setSelectedOrders(filteredOrderNumbers);
//       }
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   // Build rows
//   const getFormattedRows = () => {
//     const rows = [];
//     filteredOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ");
//       const hasMultipleProducts = productTitles.length > 1;

//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus,
//         order.shippingLastUpdated,
//         order.customerName,
//         order.customerEmail,
//         hasMultipleProducts ? (
//           <div
//             style={{
//               cursor: "pointer",
//               color: "blue",
//               textDecoration: "underline",
//             }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0]
//         ),
//         order.isRefunded,
//         order.orderAmount,
//       ]);

//       if (expandedRows[order.orderNumber] && hasMultipleProducts) {
//         productTitles.slice(1).forEach((title) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: "20px" }}>{title}</div>,
//             "",
//             "",
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === filteredOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     "Is Refunded",
//     "Order Amount",
//   ];

//   useEffect(() => {
//     const rows = (searchQuery ? allOrders : ordersTableData)
//       .filter((order) => {
//         if (filterType === "Refunded") return order.isRefunded === "Yes";
//         if (filterType === "Non-Refunded") return order.isRefunded === "No";
//         if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//         return true;
//       })
//       .filter((order) => {
//         const query = searchQuery.toLowerCase().trim();
//         return (
//           order.orderNumber.toLowerCase().includes(query) ||
//           order.customerName.toLowerCase().includes(query) ||
//           order.orderedProducts.toLowerCase().includes(query)
//         );
//       })
//       .map((order) => [
//         order.orderNumber,
//         order.orderDate,
//         order.customerName,
//         order.customerEmail,
//         order.orderedProducts,
//         order.isRefunded,
//         order.orderAmount,
//       ]);
//     setFilteredRows(rows);
//   }, [filterType, searchQuery, ordersTableData, allOrders]);

//   const changeFilter = (fType: string) => {
//     setFilterType(fType);
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   const goToPage = (page: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", page.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   const handleProductClick = async (product) => {
//     setSelectedProduct(product);
//     try {
//       const response = await fetch(
//         `/chartData?productTitle=${encodeURIComponent(
//           product.title,
//         )}&startDate=${startDate}&endDate=${endDate}`,
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch refund details");
//       }
//       const data = await response.json();
//       setRefundDetails(data.refundDetails || []);
//     } catch (error) {
//       console.error("Error fetching refund details:", error);
//       setRefundDetails([]);
//       setErrorMessage("Please contact support.");
//     }
//   };

//   const handleProductClickWrapper = (product) => () => {
//     handleProductClick(product);
//   };

//   useEffect(() => {
//     // Reset on mount
//     setRefundDetails([]);
//     setSelectedProduct(null);
//   }, []);

//   const filteredRefundDetails = refundDetails.filter(
//     (detail) =>
//       detail.orderNumber.toLowerCase().includes(searchTopPro.toLowerCase()) ||
//       detail.customerName.toLowerCase().includes(searchTopPro.toLowerCase()) ||
//       (detail.email?.toLowerCase() || "").includes(
//         searchTopPro.toLowerCase(),
//       ) ||
//       detail.refundNotes.toLowerCase().includes(searchTopPro.toLowerCase()),
//   );

//   // --- Send email to selected orders ---
//   interface Order {
//     orderNumber: string;
//     customerEmail: string;
//     customerName: string;
//   }

//   const getCustomerEmails = (orders: Order[]): string[] => {
//     return orders.map((order) => order.customerEmail).filter((email) => email);
//   };

//   const handleSendEmail = () => {
//     // Enrich selected orders
//     const enrichedOrders = selectedOrders.map((orderNumber) =>
//       allOrders.find((order) => order.orderNumber === orderNumber),
//     );
//     // Filter out any that don't have emails
//     const validOrders = enrichedOrders.filter(
//       (order) => order && order.customerEmail,
//     );
//     setSelectedOrders(validOrders);
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(
//     () => setActiveToast((active) => !active),
//     [],
//   );

//   const sendEmailsToCustomers = async (selectedTemplate) => {
//     const { subject, bodyHtml, bodyText } = selectedTemplate;
//     selectedOrders.forEach(async (order) => {
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;
//       try {
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           if (errorMessage.includes("Email address is not verified")) {
//             setToastMessage(
//               "Fail to send email. Email address is not verified.",
//             );
//           } else {
//             setToastMessage(errorData.error || "Error sending the email.");
//           }
//           setActiveToast(true);
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage(
//           "An unexpected error occurred while sending the email.",
//         );
//         setActiveToast(true);
//       }
//     });
//     setIsModalOpen(false);
//   };

//   // ------------------ CHART DATA using react-chartjs-2 -------------------------

//   // Doughnut chart for Shipped, Refunded, Unfulfilled
//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [
//           totalShippedOrdersCount,
//           totalRefundedOrdersCount,
//           totalUnfulfilledOrdersCount,
//         ],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4,
//       },
//     ],
//   };

//   // Bar chart for Sales vs Refunded
//   const barData = {
//     labels: ["Total Sales", "Total Refund"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount],
//       },
//     ],
//   };

//   // Optional bar chart config
//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top" as const,
//       },
//       title: {
//         display: true,
//         text: "Sales vs. Refund",
//       },
//     },
//   };

//   // --------------------------------------------------------------------------------

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner"></div>
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}
//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         <Layout>
//           {noUserEmail && (
//             <Banner tone="critical" title="Error">
//               <p>{noUserEmail}</p>
//             </Banner>
//           )}

//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Date Selector with Apply Button */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                   }}
//                 >
//                   {/* Date Selector Section */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(value) => setStartDate(value)}
//                       autoComplete="off"
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: "150px", // Ensures it works on small screens
//                       }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(value) => setEndDate(value)}
//                       autoComplete="off"
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: "150px",
//                       }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px",
//                         whiteSpace: "nowrap", // Prevent button text wrapping
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>

//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <Button
//                       onClick={() => setDateRange(7)}
//                       style={{ flex: "1 1 30%" }}
//                     >
//                       Last 7 Days
//                     </Button>
//                     <Button
//                       onClick={() => setDateRange(30)}
//                       style={{ flex: "1 1 30%" }}
//                     >
//                       Last 30 Days
//                     </Button>
//                     <Button
//                       onClick={() => setDateRange(60)}
//                       style={{ flex: "1 1 30%" }}
//                     >
//                       Last 60 Days
//                     </Button>
//                   </div>

//                   {/* Summary and Graphs */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px",
//                     }}
//                   >
//                     {/* Summary Section */}
//                     <Card
//                       sectioned
//                       style={{ padding: "16px", borderRadius: "12px" }}
//                     >
//                       <div style={{ marginBottom: "20px" }}>

//                       <Text
//                         variant="headingLg"

//                       >
//                         Summary
//                       </Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>
//                             💰
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)}{" "}
//                             {currencyCode}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>
//                             📦
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>
//                             🚚
//                           </span>
//                           <Text variant="bodyMd">
//                             Shipped Orders: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>
//                             🔄
//                           </span>
//                           <Text variant="bodyMd">
//                             Refunded Orders: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>
//                             ❗
//                           </span>
//                           <Text variant="bodyMd">
//                             Unfulfilled Orders: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>

//                     {/* Graphs Section */}
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns:
//                           "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px",
//                       }}
//                     >
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Doughnut data={doughnutData} />
//                         </div>
//                       </Card>
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar data={barData} options={barOptions} />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>

//               <Layout.Section id="table-section">
//                 {selectedOrders.length > 0 && (
//                   <div onClick={handleSendEmail}>
//                     <div
//                       onClick={handleSendEmail}
//                       style={{
//                         cursor: "pointer",
//                         backgroundColor: "#28a745",
//                         color: "white",
//                         borderRadius: "15px",
//                         margin: "20px",
//                         marginInline: "50px",
//                       }}
//                     >
//                       <p
//                         style={{
//                           alignContent: "center",
//                           textAlign: "center",
//                           font: "caption",
//                           fontSize: "30px",
//                           padding: "10px",
//                           fontFamily: "sans-serif",
//                         }}
//                       >
//                         Send Email
//                       </p>
//                     </div>
//                   </div>
//                 )}
//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />

//                 <div style={{ width: "full" }}>
//                   <Card sectioned>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "center",
//                         gap: "30px",
//                       }}
//                     >
//                       <Button
//                         variant={filterType === "All" ? "primary" : "plain"}
//                         onClick={() => changeFilter("All")}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         variant={
//                           filterType === "Refunded" ? "primary" : "plain"
//                         }
//                         onClick={() => changeFilter("Refunded")}
//                       >
//                         Refunded Orders
//                       </Button>
//                       <Button
//                         variant={
//                           filterType === "Non-Refunded" ? "primary" : "plain"
//                         }
//                         onClick={() => changeFilter("Non-Refunded")}
//                       >
//                         Non-Refunded Orders
//                       </Button>
//                       <Button
//                         variant={filterType === "Shipped" ? "primary" : "plain"}
//                         onClick={() => changeFilter("Shipped")}
//                       >
//                         Shipped Orders
//                       </Button>
//                       <Button
//                         variant={
//                           filterType === "Non-Shipped" ? "primary" : "plain"
//                         }
//                         onClick={() => changeFilter("Non-Shipped")}
//                       >
//                         Non-Shipped Orders
//                       </Button>
//                     </div>
//                   </Card>

//                   <Card sectioned>
//                     <TextField
//                       label="Search Orders"
//                       value={searchQuery}
//                       onChange={(value) => setSearchQuery(value)}
//                       autoComplete="off"
//                       placeholder="Search by order numbers (e.g., #101,#105,#108), customer name, or product"
//                     />
//                   </Card>

//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         defaultSortDirection="descending"
//                         footerContent={`Total Orders: ${filteredOrders.length}`}
//                       />
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px",
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>
//                           Last
//                         </Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>
//         {activeToast && (
//           <Toast content={toastMessage} error onDismiss={toggleToast} />
//         )}
//       </Page>
//     </Frame>
//   );
// };

// export default Dashboard;

// import { useState, useEffect, useCallback } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Badge,
//   Banner,
//   Frame,
//   Toast,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css"; // Ensure your Tailwind or custom styles are globally imported
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// // NEW: Confirmation modal after sending
// import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
// // This is your code that calls AWS SES on the server side
// import { sendEmail } from "./sendEmail"; // Adjust the path as necessary

// // React-ChartJS-2 imports
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";

// // Initialize ChartJS
// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title
// );

// const prisma = new PrismaClient();

// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;
//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];
//   currentPage: number;
//   totalPages: number;
//   allOrders: any[]; // Holds all orders for search functionality
//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const page = parseInt(url.searchParams.get("page") || "1", 10);
//   const filterType = url.searchParams.get("filterType") || "All";

//   // Convert to Date objects
//   const startDate = startDateParam ? new Date(startDateParam) : null;
//   const endDate = endDateParam ? new Date(endDateParam) : null;

//   // Determine refunded/shipped filters
//   let refundedFilter = {};
//   if (filterType === "Refunded") {
//     refundedFilter = {
//       refunds: {
//         some: {}, // Orders with refunds
//       },
//     };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = {
//       refunds: {
//         none: {}, // Orders without refunds
//       },
//     };
//   } else if (filterType === "Shipped") {
//     refundedFilter = {
//       fulfillmentStatus: "SUCCESS",
//     };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [
//         { fulfillmentStatus: { not: "SUCCESS" } },
//         { fulfillmentStatus: null },
//       ],
//     };
//   }

//   // Pagination
//   const pageSize = 20;
//   const skip = (page - 1) * pageSize;

//   // Total sales
//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//     },
//   });

//   // Total refunds
//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: {
//       order: {
//         shop,
//         createdAt: {
//           gte: startDate || undefined,
//           lte: endDate || undefined,
//         },
//       },
//     },
//   });

//   // Fetch all orders (for searching)
//   const allOrdersRaw = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//   });

//   // Fetch orders for current page
//   const orders = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate || undefined,
//         lte: endDate || undefined,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//     skip,
//     take: pageSize,
//   });

//   // Prepare table data
//   const ordersTableData = orders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Prepare data for all orders
//   const allOrdersTableData = allOrdersRaw.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Calculations
//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;

//   // Additional aggregates
//   const totalOrdersCount = allOrdersRaw.length;
//   const totalShippedOrdersCount = allOrdersRaw.filter(
//     (o) => o.fulfillmentStatus === "SUCCESS"
//   ).length;
//   const totalRefundedOrdersCount = allOrdersRaw.filter(
//     (o) => o.refunds.length > 0
//   ).length;
//   const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
//     (o) => o.fulfillmentStatus !== "SUCCESS"
//   ).length;

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: orders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages: Math.ceil(allOrdersRaw.length / pageSize),
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   });
// };

// const Dashboard = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchTopPro, setSearchTopPro] = useState("");

//   const [startChartDate, setStartChartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd")
//   );
//   const [loading, setLoading] = useState(false);
//   const [endChartDate, setEndChartDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState([]);
//   const [topReasons, setTopReasons] = useState([]);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [refundDetails, setRefundDetails] = useState([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   const [errorMessage, setErrorMessage] = useState("");

//   // For email sending
//   const [selectedOrders, setSelectedOrders] = useState([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // NEW: Confirmation modal after all emails are sent
//   const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
//   const [confirmationData, setConfirmationData] = useState([]); // store final results

//   const fetcher = useFetcher();

//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   } = useLoaderData<LoaderData>();

//   const [filterType, setFilterType] = useState("All");
//   const [filteredRows, setFilteredRows] = useState([]);
//   const pageSize = 10;

//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd")
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

//   const [expandedRows, setExpandedRows] = useState({});

//   const submit = useSubmit();

//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount,
//         totalProfit,
//         chartData,
//         topReasons,
//         topRefundedProducts,
//         refundedProducts,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(totalRefundAmount);
//       setChartProfit(totalProfit);
//       setChartMainData(chartData);
//       setTopReasons(topReasons);
//       setTopRefundedProducts(topRefundedProducts);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     fetchChartData();
//   }, []);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     setRefundDetails([]);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     setLoading(true);

//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [orderNumber]: !prev[orderNumber],
//     }));
//   };

//   // Multiple order search + filter
//   const filteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (!searchQuery) return true;
//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter((q) => q !== "");

//       if (queries.length > 1) {
//         // If user typed #101,#105 => match any of them
//         return queries.includes(order.orderNumber.toLowerCase());
//       }

//       const query = queries[0];
//       return (
//         order.orderNumber.toLowerCase().includes(query) ||
//         order.customerName.toLowerCase().includes(query) ||
//         order.customerEmail.toLowerCase().includes(query) ||
//         order.orderedProducts.toLowerCase().includes(query)
//       );
//     })
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//       if (filterType === "Non-Shipped")
//         return (
//           order.shippingStatus !== "SUCCESS" || order.shippingStatus === "N/A"
//         );
//       return true;
//     });

//   // Checkbox logic
//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prevSelected) =>
//       prevSelected.includes(orderNumber)
//         ? prevSelected.filter((id) => id !== orderNumber)
//         : [...prevSelected, orderNumber]
//     );
//   };

//   const handleSelectAllChange = (event) => {
//     if (event.target.checked) {
//       const filteredOrderNumbers = filteredOrders.map(
//         (order) => order.orderNumber
//       );
//       if (selectedOrders.length !== filteredOrderNumbers.length) {
//         setSelectedOrders(filteredOrderNumbers);
//       }
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   const getFormattedRows = () => {
//     const rows = [];
//     filteredOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ");
//       const hasMultipleProducts = productTitles.length > 1;

//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus,
//         order.shippingLastUpdated,
//         order.customerName,
//         order.customerEmail,
//         hasMultipleProducts ? (
//           <div
//             style={{
//               cursor: "pointer",
//               color: "blue",
//               textDecoration: "underline",
//             }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0]
//         ),
//         order.isRefunded,
//         order.orderAmount,
//       ]);

//       if (expandedRows[order.orderNumber] && hasMultipleProducts) {
//         productTitles.slice(1).forEach((title) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: "20px" }}>{title}</div>,
//             "",
//             "",
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === filteredOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     "Is Refunded",
//     "Order Amount",
//   ];

//   useEffect(() => {
//     const rows = (searchQuery ? allOrders : ordersTableData)
//       .filter((order) => {
//         if (filterType === "Refunded") return order.isRefunded === "Yes";
//         if (filterType === "Non-Refunded") return order.isRefunded === "No";
//         if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//         if (filterType === "Non-Shipped")
//           return (
//             order.shippingStatus !== "SUCCESS" || order.shippingStatus === "N/A"
//           );
//         return true;
//       })
//       .filter((order) => {
//         const query = searchQuery.toLowerCase().trim();
//         return (
//           order.orderNumber.toLowerCase().includes(query) ||
//           order.customerName.toLowerCase().includes(query) ||
//           order.orderedProducts.toLowerCase().includes(query)
//         );
//       })
//       .map((order) => [
//         order.orderNumber,
//         order.orderDate,
//         order.customerName,
//         order.customerEmail,
//         order.orderedProducts,
//         order.isRefunded,
//         order.orderAmount,
//       ]);
//     setFilteredRows(rows);
//   }, [filterType, searchQuery, ordersTableData, allOrders]);

//   const changeFilter = (fType: string) => {
//     setFilterType(fType);
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   const goToPage = (page: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", page.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   const handleProductClick = async (product) => {
//     setSelectedProduct(product);
//     try {
//       const response = await fetch(
//         `/chartData?productTitle=${encodeURIComponent(product.title)}&startDate=${startDate}&endDate=${endDate}`
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch refund details");
//       }
//       const data = await response.json();
//       setRefundDetails(data.refundDetails || []);
//     } catch (error) {
//       console.error("Error fetching refund details:", error);
//       setRefundDetails([]);
//       setErrorMessage("Please contact support.");
//     }
//   };

//   const handleProductClickWrapper = (product) => () => {
//     handleProductClick(product);
//   };

//   useEffect(() => {
//     setRefundDetails([]);
//     setSelectedProduct(null);
//   }, []);

//   // --- Sending emails to selected orders ---
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(() => setActiveToast((active) => !active), []);

//   const handleSendEmail = () => {
//     // Enrich selected orders from allOrders array
//     const enrichedOrders = selectedOrders.map((orderNumber) =>
//       allOrders.find((order) => order.orderNumber === orderNumber)
//     );
//     // Filter out any that don't have emails
//     const validOrders = enrichedOrders.filter(
//       (order) => order && order.customerEmail
//     );
//     if (!validOrders.length) {
//       setNoUserEmail("No valid emails found in the selected orders.");
//       return;
//     }
//     setSelectedOrders(validOrders);
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   /**
//    * Sends the chosen template to each selected order in sequence.
//    * Shows a final confirmation modal with the results of each send.
//    */
//   const sendEmailsToCustomers = async (selectedTemplate) => {
//     const { subject, bodyHtml, bodyText } = selectedTemplate;
//     const results = [];

//     // Send to each order sequentially so we can track results properly
//     for (let i = 0; i < selectedOrders.length; i++) {
//       const order = selectedOrders[i];
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;

//       try {
//         // Call the route that sends the actual email via AWS SES
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           setToastMessage(errorData.error || "Error sending the email.");
//           setActiveToast(true);

//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Error",
//           });
//         } else {
//           // If success, record "Delivered"
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Delivered",
//           });
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage("An unexpected error occurred while sending the email.");
//         setActiveToast(true);

//         results.push({
//           sNo: i + 1,
//           dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//           customerName,
//           customerEmail: toAddress,
//           orderNumber: orderId,
//           status: "Error",
//         });
//       }
//     }

//     // Close the "Email Template" modal
//     setIsModalOpen(false);
//     // Populate the final confirmation data
//     setConfirmationData(results);
//     // Show the confirmation modal
//     setIsConfirmationModalOpen(true);
//   };

//   // --- Chart Data ---
//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [
//           totalShippedOrdersCount,
//           totalRefundedOrdersCount,
//           totalUnfulfilledOrdersCount,
//         ],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4,
//       },
//     ],
//   };

//   const barData = {
//     labels: ["Total Sales", "Refunded"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount],
//       },
//     ],
//   };

//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top" as const,
//       },
//       title: {
//         display: true,
//         text: "Sales vs. Refund",
//       },
//     },
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner"></div>
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}
//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         <Layout>
//           {noUserEmail && (
//             <Banner status="critical" title="Error">
//               <p>{noUserEmail}</p>
//             </Banner>
//           )}

//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Left Panel for Date Filters & Graphs */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                   }}
//                 >
//                   {/* Date Filter */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(value) => setStartDate(value)}
//                       autoComplete="off"
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: "150px",
//                       }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(value) => setEndDate(value)}
//                       autoComplete="off"
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: "150px",
//                       }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>

//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
//                     <Button onClick={() => setDateRange(30)}>
//                       Last 30 Days
//                     </Button>
//                     <Button onClick={() => setDateRange(60)}>
//                       Last 60 Days
//                     </Button>
//                   </div>

//                   {/* Summary & Charts */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px",
//                     }}
//                   >
//                     {/* Summary */}
//                     <Card sectioned style={{ padding: "16px", borderRadius: "12px" }}>
//                       <div style={{ marginBottom: "20px" }}>
//                         <Text variant="headingLg">Summary</Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>💰</span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)} {currencyCode}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>📦</span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>🚚</span>
//                           <Text variant="bodyMd">
//                             Shipped Orders: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>🔄</span>
//                           <Text variant="bodyMd">
//                             Refunded Orders: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>❗</span>
//                           <Text variant="bodyMd">
//                             Unfulfilled Orders: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>

//                     {/* Charts */}
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px",
//                       }}
//                     >
//                       <Card sectioned style={{ borderRadius: "12px", padding: "16px" }}>
//                         <Text variant="headingMd" style={{ marginBottom: "8px" }}>
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Doughnut data={doughnutData} />
//                         </div>
//                       </Card>
//                       <Card sectioned style={{ borderRadius: "12px", padding: "16px" }}>
//                         <Text variant="headingMd" style={{ marginBottom: "8px" }}>
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar data={barData} options={barOptions} />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>

//               {/* Right Panel for Table */}
//               <Layout.Section id="table-section">
//                 {selectedOrders.length > 0 && (
//                   <div
//                     onClick={handleSendEmail}
//                     style={{
//                       cursor: "pointer",
//                       backgroundColor: "#28a745",
//                       color: "white",
//                       borderRadius: "15px",
//                       margin: "20px",
//                       marginInline: "50px",
//                     }}
//                   >
//                     <p
//                       style={{
//                         textAlign: "center",
//                         fontSize: "30px",
//                         padding: "10px",
//                         fontFamily: "sans-serif",
//                       }}
//                     >
//                       Send Email
//                     </p>
//                   </div>
//                 )}

//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />

//                 {/* Final Confirmation Modal after sending */}
//                 <EmailConfirmationModal
//                   isOpen={isConfirmationModalOpen}
//                   onClose={() => setIsConfirmationModalOpen(false)}
//                   data={confirmationData}
//                 />

//                 <div style={{ width: "100%" }}>
//                   <Card sectioned>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "center",
//                         gap: "30px",
//                       }}
//                     >
//                       <Button
//                         primary={filterType === "All"}
//                         onClick={() => changeFilter("All")}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         primary={filterType === "Refunded"}
//                         onClick={() => changeFilter("Refunded")}
//                       >
//                         Refunded Orders
//                       </Button>
//                       <Button
//                         primary={filterType === "Non-Refunded"}
//                         onClick={() => changeFilter("Non-Refunded")}
//                       >
//                         Non-Refunded Orders
//                       </Button>
//                       <Button
//                         primary={filterType === "Shipped"}
//                         onClick={() => changeFilter("Shipped")}
//                       >
//                         Shipped Orders
//                       </Button>
//                       <Button
//                         primary={filterType === "Non-Shipped"}
//                         onClick={() => changeFilter("Non-Shipped")}
//                       >
//                         Non-Shipped Orders
//                       </Button>
//                     </div>
//                   </Card>

//                   <Card sectioned>
//                     <TextField
//                       label="Search Orders"
//                       value={searchQuery}
//                       onChange={(value) => setSearchQuery(value)}
//                       autoComplete="off"
//                       placeholder="Search by order #, name, or product"
//                     />
//                   </Card>

//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         defaultSortDirection="descending"
//                         footerContent={`Total Orders: ${filteredOrders.length}`}
//                       />
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px",
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>Last</Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>

//         {activeToast && (
//           <Toast content={toastMessage} error onDismiss={toggleToast} />
//         )}
//       </Page>
//     </Frame>
//   );
// };

// export default Dashboard;

// import { useState, useEffect, useCallback } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Banner,
//   Frame,
//   Toast,
//   Select,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css"; // Ensure your Tailwind or custom CSS is imported
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
// import { sendEmail } from "./sendEmail";

// // React-ChartJS-2 imports
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";

// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title
// );

// const prisma = new PrismaClient();

// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;

//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   currentPage: number;
//   totalPages: number;

//   allOrders: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
// };

// // ---------------- LOADER with pageSize param ----------------
// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const pageParam = url.searchParams.get("page") || "1";
//   const filterType = url.searchParams.get("filterType") || "All";
//   // read pageSize from the query, default 20
//   const pageSizeParam = url.searchParams.get("pageSize") || "20";
//   const pageSize = parseInt(pageSizeParam, 10);

//   const page = parseInt(pageParam, 10);
//   const startDate = startDateParam ? new Date(startDateParam) : undefined;
//   const endDate = endDateParam ? new Date(endDateParam) : undefined;

//   let refundedFilter: any = {};
//   if (filterType === "Refunded") {
//     refundedFilter = { refunds: { some: {} } };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = { refunds: { none: {} } };
//   } else if (filterType === "Shipped") {
//     refundedFilter = { fulfillmentStatus: "SUCCESS" };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [{ fulfillmentStatus: { not: "SUCCESS" } }, { fulfillmentStatus: null }],
//     };
//   }

//   const skip = (page - 1) * pageSize;

//   // Aggregates
//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//     },
//   });

//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: {
//       order: {
//         shop,
//         createdAt: {
//           gte: startDate,
//           lte: endDate,
//         },
//       },
//     },
//   });

//   // Fetch all orders for searching
//   const allOrdersRaw = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   // Paginated
//   const pagedOrders = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//     skip,
//     take: pageSize,
//   });

//   // Build table data for current page
//   const ordersTableData = pagedOrders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Build table data for all orders
//   const allOrdersTableData = allOrdersRaw.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Calculations
//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;

//   // Additional stats
//   const totalOrdersCount = allOrdersRaw.length;
//   const totalShippedOrdersCount = allOrdersRaw.filter(
//     (o) => o.fulfillmentStatus === "SUCCESS"
//   ).length;
//   const totalRefundedOrdersCount = allOrdersRaw.filter(
//     (o) => o.refunds.length > 0
//   ).length;
//   const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
//     (o) => o.fulfillmentStatus !== "SUCCESS"
//   ).length;

//   // total pages depends on pageSize
//   const totalPages = Math.ceil(totalOrdersCount / pageSize);

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: pagedOrders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages,
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   });
// };

// export default function Dashboard() {
//   // Loader data
//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   } = useLoaderData<LoaderData>();

//   const fetcher = useFetcher();
//   const submit = useSubmit();

//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd")
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [loading, setLoading] = useState(false);
//   const [filterType, setFilterType] = useState("All");
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//   const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

//   // Email modals
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
//   const [confirmationData, setConfirmationData] = useState<any[]>([]);

//   // Chart data
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState<any[]>([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
//   const [topReasons, setTopReasons] = useState<any[]>([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   // For user to select pageSize from a dropdown
//   const [pageSize, setPageSize] = useState("20");

//   // On mount, read pageSize from the URL if present
//   useEffect(() => {
//     const url = new URL(window.location.href);
//     const ps = url.searchParams.get("pageSize") || "20";
//     setPageSize(ps);
//   }, []);

//   // Chart fetch logic
//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount,
//         totalProfit,
//         chartData,
//         topReasons,
//         topRefundedProducts,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(totalRefundAmount);
//       setChartProfit(totalProfit);
//       setChartMainData(chartData);
//       setTopReasons(topReasons);
//       setTopRefundedProducts(topRefundedProducts);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   // ----- Date range submit -----
//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     setLoading(true);
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Filter & search
//   const filteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//       if (filterType === "Non-Shipped")
//         return order.shippingStatus !== "SUCCESS" || order.shippingStatus === "N/A";
//       return true;
//     })
//     .filter((order) => {
//       if (!searchQuery) return true;
//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter(Boolean);
//       if (queries.length > 1) {
//         return queries.some((q) => order.orderNumber.toLowerCase().includes(q));
//       }
//       const query = queries[0] || "";
//       return (
//         order.orderNumber.toLowerCase().includes(query) ||
//         order.customerName.toLowerCase().includes(query) ||
//         order.customerEmail.toLowerCase().includes(query) ||
//         order.orderedProducts.toLowerCase().includes(query)
//       );
//     });

//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [orderNumber]: !prev[orderNumber],
//     }));
//   };

//   // Email checkboxes
//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prev) =>
//       prev.includes(orderNumber)
//         ? prev.filter((id) => id !== orderNumber)
//         : [...prev, orderNumber]
//     );
//   };

//   const handleSelectAllChange = (event: any) => {
//     if (event.target.checked) {
//       const allNums = filteredOrders.map((ord) => ord.orderNumber);
//       setSelectedOrders(allNums);
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   const getFormattedRows = () => {
//     const rows: (string | JSX.Element)[][] = [];
//     filteredOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ");
//       const hasMultipleProducts = productTitles.length > 1;

//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus || "N/A",
//         order.shippingLastUpdated || "N/A",
//         order.customerName,
//         order.customerEmail,
//         hasMultipleProducts ? (
//           <div
//             style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0] || "N/A"
//         ),
//         order.isRefunded,
//         order.orderAmount,
//       ]);

//       if (expandedRows[order.orderNumber] && hasMultipleProducts) {
//         productTitles.slice(1).forEach((title) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: "20px" }}>{title}</div>,
//             "",
//             "",
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === filteredOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     "Is Refunded",
//     "Order Amount",
//   ];

//   // Filter buttons
//   const changeFilter = (fType: string) => {
//     // trigger loading animation
//     setLoading(true);
//     setFilterType(fType);
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Pagination
//   const goToPage = (p: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", p.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   // PageSize change
//   const changePageSize = (value: string) => {
//     // trigger loading animation
//     setLoading(true);
//     setPageSize(value);
//     const url = new URL(window.location.href);
//     url.searchParams.set("pageSize", value);
//     url.searchParams.set("page", "1"); // reset page to 1
//     submit(url.searchParams, { method: "get" });
//   };

//   // Email sending
//   const handleSendEmail = () => {
//     const enriched = selectedOrders.map((num) =>
//       allOrders.find((o) => o.orderNumber === num)
//     );
//     const valid = enriched.filter((o) => o && o.customerEmail);
//     if (!valid.length) {
//       setNoUserEmail("No valid emails found in the selected orders.");
//       return;
//     }
//     setSelectedOrders(valid as any);
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   const sendEmailsToCustomers = async (templateData: any) => {
//     const { subject, bodyHtml, bodyText } = templateData;
//     const results: any[] = [];

//     for (let i = 0; i < (selectedOrders as any[]).length; i++) {
//       const order = (selectedOrders as any[])[i];
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;

//       try {
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });

//         if (!response.ok) {
//           const errData = await response.json();
//           setToastMessage(errData.error || "Error sending email.");
//           setActiveToast(true);
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Error",
//           });
//         } else {
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Delivered",
//           });
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage("An unexpected error occurred while sending the email.");
//         setActiveToast(true);
//         results.push({
//           sNo: i + 1,
//           dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//           customerName,
//           customerEmail: toAddress,
//           orderNumber: orderId,
//           status: "Error",
//         });
//       }
//     }

//     setIsModalOpen(false);
//     setConfirmationData(results);
//     setIsConfirmationModalOpen(true);
//   };

//   // Chart data
//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [
//           totalShippedOrdersCount,
//           totalRefundedOrdersCount,
//           totalUnfulfilledOrdersCount,
//         ],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4,
//       },
//     ],
//   };

//   const barData = {
//     labels: ["Total Sales", "Refunded"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount],
//       },
//     ],
//   };

//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" as const },
//       title: { display: true, text: "Sales vs. Refund" },
//     },
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner" />
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}

//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         {noUserEmail && (
//           <Banner status="critical" title="Error">
//             <p>{noUserEmail}</p>
//           </Banner>
//         )}

//         <Layout>
//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Left Panel: date filters & charts */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                   }}
//                 >
//                   {/* Date Filter Card */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(val) => setStartDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(val) => setEndDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px",
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>

//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
//                     <Button onClick={() => setDateRange(30)}>Last 30 Days</Button>
//                     <Button onClick={() => setDateRange(60)}>Last 60 Days</Button>
//                   </div>

//                   {/* Summary + Charts */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px",
//                     }}
//                   >
//                     {/* Summary */}
//                     <Card
//                       sectioned
//                       style={{ padding: "16px", borderRadius: "12px" }}
//                     >
//                       <div style={{ marginBottom: "20px" }}>
//                         <Text variant="headingLg">Summary</Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>
//                             💰
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)} {currencyCode}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>
//                             📦
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>
//                             🚚
//                           </span>
//                           <Text variant="bodyMd">
//                             Shipped: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>
//                             🔄
//                           </span>
//                           <Text variant="bodyMd">
//                             Refunded: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>
//                             ❗
//                           </span>
//                           <Text variant="bodyMd">
//                             Unfulfilled: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>

//                     {/* Charts */}
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns:
//                           "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px",
//                       }}
//                     >
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Doughnut
//                             data={{
//                               labels: ["Shipped", "Refunded", "Unfulfilled"],
//                               datasets: [
//                                 {
//                                   label: "Order Distribution",
//                                   data: [
//                                     totalShippedOrdersCount,
//                                     totalRefundedOrdersCount,
//                                     totalUnfulfilledOrdersCount,
//                                   ],
//                                   backgroundColor: [
//                                     "#36A2EB",
//                                     "#FF6384",
//                                     "#FFCE56",
//                                   ],
//                                   hoverOffset: 4,
//                                 },
//                               ],
//                             }}
//                           />
//                         </div>
//                       </Card>
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar
//                             data={{
//                               labels: ["Total Sales", "Refunded"],
//                               datasets: [
//                                 {
//                                   label: "Amount",
//                                   backgroundColor: ["#4CAF50", "#F44336"],
//                                   data: [totalSalesAmount, totalRefundAmount],
//                                 },
//                               ],
//                             }}
//                             options={{
//                               responsive: true,
//                               plugins: {
//                                 legend: { position: "top" as const },
//                                 title: { display: true, text: "Sales vs. Refund" },
//                               },
//                             }}
//                           />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>

//               {/* Right Panel: Orders Table */}
//               <Layout.Section>
//                 {selectedOrders.length > 0 && (
//                   <div
//                     onClick={handleSendEmail}
//                     style={{
//                       cursor: "pointer",
//                       backgroundColor: "#28a745",
//                       color: "white",
//                       borderRadius: "15px",
//                       margin: "20px 50px",
//                     }}
//                   >
//                     <p style={{ textAlign: "center", fontSize: "30px", padding: "10px" }}>
//                       Send Email
//                     </p>
//                   </div>
//                 )}

//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />
//                 <EmailConfirmationModal
//                   isOpen={isConfirmationModalOpen}
//                   onClose={() => setIsConfirmationModalOpen(false)}
//                   data={confirmationData}
//                 />

//                 <div style={{ width: "100%" }}>
//                   {/* Filter Buttons */}
//                   <Card sectioned>
//                     <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
//                       <Button
//                         primary={filterType === "All"}
//                         onClick={() => changeFilter("All")}
//                         disabled={loading}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         primary={filterType === "Refunded"}
//                         onClick={() => changeFilter("Refunded")}
//                         disabled={loading}
//                       >
//                         Refunded
//                       </Button>
//                       <Button
//                         primary={filterType === "Non-Refunded"}
//                         onClick={() => changeFilter("Non-Refunded")}
//                         disabled={loading}
//                       >
//                         Non-Refunded
//                       </Button>
//                       <Button
//                         primary={filterType === "Shipped"}
//                         onClick={() => changeFilter("Shipped")}
//                         disabled={loading}
//                       >
//                         Shipped
//                       </Button>
//                       <Button
//                         primary={filterType === "Non-Shipped"}
//                         onClick={() => changeFilter("Non-Shipped")}
//                         disabled={loading}
//                       >
//                         Non-Shipped
//                       </Button>
//                     </div>
//                   </Card>

//                   {/* Search bar */}
//                   <Card sectioned>
//                     <TextField
//                       label="Search Orders"
//                       value={searchQuery}
//                       onChange={(val) => setSearchQuery(val)}
//                       autoComplete="off"
//                       placeholder="Search by order #, name, or product"
//                     />
//                   </Card>

//                   {/* Orders Table */}
//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         defaultSortDirection="descending"
//                         footerContent={`Total Orders: ${filteredOrders.length}`}
//                       />
//                     </div>

//                     {/* ---------- "Records per page" dropdown (below table) ---------- */}
//                     <div
//                       style={{
//                         width: "15%",
//                         justifySelf: "end",
//                         margin: "10px",
//                       }}
//                     >
//                       <Card sectioned>
//                         <Text variant="headingMd">Records per page:</Text>
//                         <Select
//                           options={[
//                             { label: "20", value: "20" },
//                             { label: "50", value: "50" },
//                             { label: "70", value: "70" },
//                             { label: "100", value: "100" },
//                           ]}
//                           value={pageSize}
//                           onChange={(value) => changePageSize(value)}
//                           disabled={loading}
//                         />
//                       </Card>
//                     </div>

//                     {/* Pagination */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px",
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>
//                           Last
//                         </Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>

//         {activeToast && <Toast content={toastMessage} error onDismiss={toggleToast} />}
//       </Page>
//     </Frame>
//   );
// }

// import { useState, useEffect, useCallback } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Banner,
//   Frame,
//   Toast,
//   Select,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css";
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
// import { sendEmail } from "./sendEmail";

// // React-ChartJS-2
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";

// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title
// );

// const prisma = new PrismaClient();

// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;

//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   currentPage: number;
//   totalPages: number;

//   allOrders: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
// };

// // ---------- LOADER -------------
// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const pageParam = url.searchParams.get("page") || "1";
//   const filterType = url.searchParams.get("filterType") || "All";
//   const pageSizeParam = url.searchParams.get("pageSize") || "20";
//   const pageSize = parseInt(pageSizeParam, 10);

//   const page = parseInt(pageParam, 10);
//   const startDate = startDateParam ? new Date(startDateParam) : undefined;
//   const endDate = endDateParam ? new Date(endDateParam) : undefined;

//   let refundedFilter: any = {};
//   if (filterType === "Refunded") {
//     refundedFilter = { refunds: { some: {} } };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = { refunds: { none: {} } };
//   } else if (filterType === "Shipped") {
//     refundedFilter = { fulfillmentStatus: "SUCCESS" };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [{ fulfillmentStatus: { not: "SUCCESS" } }, { fulfillmentStatus: null }],
//     };
//   }

//   const skip = (page - 1) * pageSize;

//   // Aggregates
//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//     },
//   });

//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: {
//       order: {
//         shop,
//         createdAt: {
//           gte: startDate,
//           lte: endDate,
//         },
//       },
//     },
//   });

//   // Fetch all orders
//   const allOrdersRaw = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   // Paginated
//   const pagedOrders = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//     skip,
//     take: pageSize,
//   });

//   // Build "paged" table data
//   const ordersTableData = pagedOrders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Build "all" table data
//   const allOrdersTableData = allOrdersRaw.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Calculations
//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;

//   const totalOrdersCount = allOrdersRaw.length;
//   const totalShippedOrdersCount = allOrdersRaw.filter(
//     (o) => o.fulfillmentStatus === "SUCCESS"
//   ).length;
//   const totalRefundedOrdersCount = allOrdersRaw.filter(
//     (o) => o.refunds.length > 0
//   ).length;
//   const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
//     (o) => o.fulfillmentStatus !== "SUCCESS"
//   ).length;

//   const totalPages = Math.ceil(allOrdersRaw.length / pageSize);

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: pagedOrders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages,
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   });
// };

// export default function Dashboard() {
//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   } = useLoaderData<LoaderData>();

//   const fetcher = useFetcher();
//   const submit = useSubmit();

//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd")
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [loading, setLoading] = useState(false);
//   const [filterType, setFilterType] = useState("All");
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//   const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

//   // Email modals
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
//   const [confirmationData, setConfirmationData] = useState<any[]>([]);

//   // Chart data
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState<any[]>([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
//   const [topReasons, setTopReasons] = useState<any[]>([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   // Page size
//   const [pageSize, setPageSize] = useState("20");

//   // For sorting the "Is Refunded" column
//   const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(undefined);
//   const [sortDirection, setSortDirection] = useState<"ascending" | "descending" | undefined>(
//     undefined
//   );

//   // On mount, read pageSize from the URL if present
//   useEffect(() => {
//     const url = new URL(window.location.href);
//     const ps = url.searchParams.get("pageSize") || "20";
//     setPageSize(ps);
//   }, []);

//   // Chart fetch logic
//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount,
//         totalProfit,
//         chartData,
//         topReasons,
//         topRefundedProducts,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(totalRefundAmount);
//       setChartProfit(totalProfit);
//       setChartMainData(chartData);
//       setTopReasons(topReasons);
//       setTopRefundedProducts(topRefundedProducts);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   // Submit date filters
//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     setLoading(true);
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Build base filtered data
//   let baseFilteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       if (filterType === "Shipped") return order.shippingStatus === "SUCCESS";
//       if (filterType === "Non-Shipped")
//         return order.shippingStatus !== "SUCCESS" || order.shippingStatus === "N/A";
//       return true; // All
//     })
//     .filter((order) => {
//       if (!searchQuery) return true;
//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter(Boolean);
//       if (queries.length > 1) {
//         return queries.some((q) => order.orderNumber.toLowerCase().includes(q));
//       }
//       const query = queries[0] || "";
//       return (
//         order.orderNumber.toLowerCase().includes(query) ||
//         order.customerName.toLowerCase().includes(query) ||
//         order.customerEmail.toLowerCase().includes(query) ||
//         order.orderedProducts.toLowerCase().includes(query)
//       );
//     });

//   // If user is on All/Shipped/Non-Shipped, let them sort Is Refunded
//   let finalOrders = [...baseFilteredOrders];
//   const canSortRefunded =
//     filterType === "All" || filterType === "Shipped" || filterType === "Non-Shipped";

//   if (canSortRefunded && sortColumnIndex === 8 && sortDirection) {
//     finalOrders.sort((a, b) => {
//       const aVal = a.isRefunded === "Yes" ? 1 : 0;
//       const bVal = b.isRefunded === "Yes" ? 1 : 0;
//       if (sortDirection === "ascending") {
//         // "Yes" => 1 => put "Yes" on top => aVal-bVal => negative if aVal < bVal
//         return aVal - bVal;
//       } else {
//         // descending => "No" on top => bigger => bVal-aVal
//         return bVal - aVal;
//       }
//     });
//   }

//   // Expand/collapse for multiple products
//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [orderNumber]: !prev[orderNumber],
//     }));
//   };

//   // Checkboxes
//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prev) =>
//       prev.includes(orderNumber)
//         ? prev.filter((id) => id !== orderNumber)
//         : [...prev, orderNumber]
//     );
//   };

//   const handleSelectAllChange = (event: any) => {
//     if (event.target.checked) {
//       const allNums = finalOrders.map((ord) => ord.orderNumber);
//       setSelectedOrders(allNums);
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   // Prepare rows for the DataTable
//   const getFormattedRows = () => {
//     const rows: (string | JSX.Element)[][] = [];
//     finalOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ");
//       const hasMultipleProducts = productTitles.length > 1;

//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus || "N/A",
//         order.shippingLastUpdated || "N/A",
//         order.customerName,
//         order.customerEmail,
//         hasMultipleProducts ? (
//           <div
//             style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0] || "N/A"
//         ),
//         order.isRefunded,
//         order.orderAmount,
//       ]);

//       // Additional rows for expanded products
//       if (expandedRows[order.orderNumber] && hasMultipleProducts) {
//         productTitles.slice(1).forEach((title) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: "20px" }}>{title}</div>,
//             "",
//             "",
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   // We'll define a custom heading element for "Is Refunded" so it always uses the same style
//   const isRefundedHeading = (
//     <Text as="span" variant="bodyMd" fontWeight="semibold">
//       Is Refunded
//     </Text>
//   );

//   // The DataTable headings
//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === finalOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     isRefundedHeading, // same style whether sortable or not
//     "Order Amount",
//   ];

//   // Filter button
//   const changeFilter = (fType: string) => {
//     setLoading(true);
//     setFilterType(fType);
//     // If user goes to "Refunded" or "Non-Refunded," we reset sorting
//     if (fType === "Refunded" || fType === "Non-Refunded") {
//       setSortColumnIndex(undefined);
//       setSortDirection(undefined);
//     }
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Pagination
//   const goToPage = (p: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", p.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   // PageSize
//   const changePageSize = (value: string) => {
//     setLoading(true);
//     setPageSize(value);
//     const url = new URL(window.location.href);
//     url.searchParams.set("pageSize", value);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Email
//   const handleSendEmail = () => {
//     const enriched = selectedOrders.map((num) =>
//       allOrders.find((o) => o.orderNumber === num)
//     );
//     const valid = enriched.filter((o) => o && o.customerEmail);
//     if (!valid.length) {
//       setNoUserEmail("No valid emails found in the selected orders.");
//       return;
//     }
//     setSelectedOrders(valid as any);
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   const sendEmailsToCustomers = async (templateData: any) => {
//     const { subject, bodyHtml, bodyText } = templateData;
//     const results: any[] = [];

//     for (let i = 0; i < (selectedOrders as any[]).length; i++) {
//       const order = (selectedOrders as any[])[i];
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;

//       try {
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });

//         if (!response.ok) {
//           const errData = await response.json();
//           setToastMessage(errData.error || "Error sending email.");
//           setActiveToast(true);
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Error",
//           });
//         } else {
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Delivered",
//           });
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage("An unexpected error occurred while sending the email.");
//         setActiveToast(true);
//         results.push({
//           sNo: i + 1,
//           dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//           customerName,
//           customerEmail: toAddress,
//           orderNumber: orderId,
//           status: "Error",
//         });
//       }
//     }

//     setIsModalOpen(false);
//     setConfirmationData(results);
//     setIsConfirmationModalOpen(true);
//   };

//   // Chart data
//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [
//           totalShippedOrdersCount,
//           totalRefundedOrdersCount,
//           totalUnfulfilledOrdersCount,
//         ],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4,
//       },
//     ],
//   };

//   const barData = {
//     labels: ["Total Sales", "Refunded"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount],
//       },
//     ],
//   };

//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" as const },
//       title: { display: true, text: "Sales vs. Refund" },
//     },
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner" />
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}

//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         {noUserEmail && (
//           <Banner status="critical" title="Error">
//             <p>{noUserEmail}</p>
//           </Banner>
//         )}

//         <Layout>
//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Left side: date filters & charts */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                   }}
//                 >
//                   {/* Date Filter Card */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(val) => setStartDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(val) => setEndDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px",
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>

//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
//                     <Button onClick={() => setDateRange(30)}>Last 30 Days</Button>
//                     <Button onClick={() => setDateRange(60)}>Last 60 Days</Button>
//                   </div>

//                   {/* Summary + Charts */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px",
//                     }}
//                   >
//                     {/* Summary */}
//                     <Card
//                       sectioned
//                       style={{ padding: "16px", borderRadius: "12px" }}
//                     >
//                       <div style={{ marginBottom: "20px" }}>
//                         <Text variant="headingLg">Summary</Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>
//                             💰
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)} {currencyCode}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>
//                             📦
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>
//                             🚚
//                           </span>
//                           <Text variant="bodyMd">
//                             Shipped: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>
//                             🔄
//                           </span>
//                           <Text variant="bodyMd">
//                             Refunded: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>
//                             ❗
//                           </span>
//                           <Text variant="bodyMd">
//                             Unfulfilled: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>

//                     {/* Charts */}
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns:
//                           "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px",
//                       }}
//                     >
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Doughnut
//                             data={{
//                               labels: ["Shipped", "Refunded", "Unfulfilled"],
//                               datasets: [
//                                 {
//                                   label: "Order Distribution",
//                                   data: [
//                                     totalShippedOrdersCount,
//                                     totalRefundedOrdersCount,
//                                     totalUnfulfilledOrdersCount,
//                                   ],
//                                   backgroundColor: [
//                                     "#36A2EB",
//                                     "#FF6384",
//                                     "#FFCE56",
//                                   ],
//                                   hoverOffset: 4,
//                                 },
//                               ],
//                             }}
//                           />
//                         </div>
//                       </Card>
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar
//                             data={{
//                               labels: ["Total Sales", "Refunded"],
//                               datasets: [
//                                 {
//                                   label: "Amount",
//                                   backgroundColor: ["#4CAF50", "#F44336"],
//                                   data: [totalSalesAmount, totalRefundAmount],
//                                 },
//                               ],
//                             }}
//                             options={{
//                               responsive: true,
//                               plugins: {
//                                 legend: { position: "top" as const },
//                                 title: { display: true, text: "Sales vs. Refund" },
//                               },
//                             }}
//                           />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>

//               {/* Right Panel: Orders Table */}
//               <Layout.Section>
//                 {selectedOrders.length > 0 && (
//                   <div
//                     onClick={handleSendEmail}
//                     style={{
//                       cursor: "pointer",
//                       backgroundColor: "#28a745",
//                       color: "white",
//                       borderRadius: "15px",
//                       margin: "20px 50px",
//                     }}
//                   >
//                     <p style={{ textAlign: "center", fontSize: "30px", padding: "10px" }}>
//                       Send Email
//                     </p>
//                   </div>
//                 )}

//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />
//                 <EmailConfirmationModal
//                   isOpen={isConfirmationModalOpen}
//                   onClose={() => setIsConfirmationModalOpen(false)}
//                   data={confirmationData}
//                 />

//                 <div style={{ width: "100%" }}>
//                   {/* Filter Buttons */}
//                   <Card sectioned>
//                     <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
//                       <Button
//                         onClick={() => changeFilter("All")}
//                         primary={filterType === "All"}
//                         disabled={loading}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Refunded")}
//                         primary={filterType === "Refunded"}
//                         disabled={loading}
//                       >
//                         Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Refunded")}
//                         primary={filterType === "Non-Refunded"}
//                         disabled={loading}
//                       >
//                         Non-Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Shipped")}
//                         primary={filterType === "Shipped"}
//                         disabled={loading}
//                       >
//                         Shipped
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Shipped")}
//                         primary={filterType === "Non-Shipped"}
//                         disabled={loading}
//                       >
//                         Non-Shipped
//                       </Button>
//                     </div>
//                   </Card>

//                   {/* Search bar */}
//                   <Card sectioned>
//                     <TextField
//                       label="Search Orders"
//                       value={searchQuery}
//                       onChange={(val) => setSearchQuery(val)}
//                       autoComplete="off"
//                       placeholder="Search by order #, name, or product"
//                     />
//                   </Card>

//                   {/* Orders Table */}
//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         // "Is Refunded" => index=8 => possibly sortable
//                         sortable={[
//                           false, // col 0
//                           false, // col 1
//                           false, // col 2
//                           false, // col 3
//                           false, // col 4
//                           false, // col 5
//                           false, // col 6
//                           false, // col 7
//                           filterType === "All" ||
//                             filterType === "Shipped" ||
//                             filterType === "Non-Shipped", // col 8 => "Is Refunded"
//                           false, // col 9
//                         ]}
//                         onSort={(columnIndex, direction) => {
//                           // Only if user is in All/Shipped/Non-Shipped, let them sort col 8
//                           if (
//                             (filterType === "All" ||
//                               filterType === "Shipped" ||
//                               filterType === "Non-Shipped") &&
//                             columnIndex === 8
//                           ) {
//                             setSortColumnIndex(8);
//                             setSortDirection(direction);
//                           }
//                         }}
//                         sortColumnIndex={sortColumnIndex}
//                         sortDirection={sortDirection}
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         footerContent={`Total Orders: ${finalOrders.length}`}
//                       />
//                     </div>

//                     {/* "Records per page" dropdown */}
//                     <div
//                       style={{
//                         width: "15%",
//                         justifySelf: "end",
//                         margin: "10px",
//                       }}
//                     >
//                       <Card sectioned>
//                         <Text variant="headingMd">Records per page:</Text>
//                         <Select
//                           options={[
//                             { label: "20", value: "20" },
//                             { label: "50", value: "50" },
//                             { label: "70", value: "70" },
//                             { label: "100", value: "100" },
//                           ]}
//                           value={pageSize}
//                           onChange={(value) => changePageSize(value)}
//                           disabled={loading}
//                         />
//                       </Card>
//                     </div>

//                     {/* Pagination */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px",
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>
//                           Last
//                         </Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>

//         {activeToast && <Toast content={toastMessage} error onDismiss={toggleToast} />}
//       </Page>
//     </Frame>
//   );
// }

// // Jan-30-2025
// // Updated Trackinng staus under Shipped Filter Button
// import { useState, useEffect, useCallback } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Banner,
//   Frame,
//   Toast,
//   Select,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css";
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
// import { sendEmail } from "./sendEmail";

// // React-ChartJS-2
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";

// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// );

// const prisma = new PrismaClient();

// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;

//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   currentPage: number;
//   totalPages: number;

//   allOrders: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
// };

// // ---------- LOADER -------------
// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const pageParam = url.searchParams.get("page") || "1";
//   const filterType = url.searchParams.get("filterType") || "All";
//   const pageSizeParam = url.searchParams.get("pageSize") || "20";
//   const pageSize = parseInt(pageSizeParam, 10);

//   const page = parseInt(pageParam, 10);
//   const startDate = startDateParam ? new Date(startDateParam) : undefined;
//   const endDate = endDateParam ? new Date(endDateParam) : undefined;

//   // "Shipped" now means fulfillmentStatus in ["In Transit", "Out Of Delivery", "Delivered"]
//   // "Non-Shipped" means not in that set (plus possibly null)
//   let refundedFilter: any = {};
//   if (filterType === "Refunded") {
//     refundedFilter = { refunds: { some: {} } };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = { refunds: { none: {} } };
//   } else if (filterType === "Shipped") {
//     // The new array of statuses to treat as "Shipped"
//     refundedFilter = {
//       fulfillmentStatus: {
//         in: ["In Transit", "Out Of Delivery", "Delivered"],
//       },
//     };
//   } else if (filterType === "Non-Shipped") {
//     // Orders not in those statuses or null
//     refundedFilter = {
//       OR: [
//         {
//           fulfillmentStatus: {
//             notIn: ["In Transit", "Out Of Delivery", "Delivered"],
//           },
//         },
//         { fulfillmentStatus: null },
//       ],
//     };
//   }

//   const skip = (page - 1) * pageSize;

//   // Aggregates
//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//     },
//   });

//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: {
//       order: {
//         shop,
//         createdAt: {
//           gte: startDate,
//           lte: endDate,
//         },
//       },
//     },
//   });

//   // Fetch all orders
//   const allOrdersRaw = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   // Paginated
//   const pagedOrders = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//     skip,
//     take: pageSize,
//   });

//   // Build "paged" table data
//   const ordersTableData = pagedOrders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     // Display the actual shipping status
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Build "all" table data
//   const allOrdersTableData = allOrdersRaw.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Calculations
//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;

//   const totalOrdersCount = allOrdersRaw.length;
//   // For the doughnut "Shipped" slice, count how many have status in the "shipped" array
//   const shippedStatuses = ["In Transit", "Out Of Delivery", "Delivered"];
//   const totalShippedOrdersCount = allOrdersRaw.filter((o) =>
//     shippedStatuses.includes(o.fulfillmentStatus ?? ""),
//   ).length;

//   const totalRefundedOrdersCount = allOrdersRaw.filter(
//     (o) => o.refunds.length > 0,
//   ).length;

//   const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
//     (o) => !shippedStatuses.includes(o.fulfillmentStatus ?? ""),
//   ).length; // everything that's not in the shipped statuses

//   const totalPages = Math.ceil(allOrdersRaw.length / pageSize);

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: pagedOrders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages,
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   });
// };

// export default function Dashboard() {
//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   } = useLoaderData<LoaderData>();

//   const fetcher = useFetcher();
//   const submit = useSubmit();

//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd"),
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [loading, setLoading] = useState(false);
//   const [filterType, setFilterType] = useState("All");
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//   const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

//   // Email modals
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
//   const [confirmationData, setConfirmationData] = useState<any[]>([]);

//   // Chart data
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState<any[]>([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
//   const [topReasons, setTopReasons] = useState<any[]>([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   // Page size
//   const [pageSize, setPageSize] = useState("20");

//   // For sorting "Is Refunded"
//   const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(
//     undefined,
//   );
//   const [sortDirection, setSortDirection] = useState<
//     "ascending" | "descending" | undefined
//   >(undefined);

//   // On mount, read pageSize from the URL if present
//   useEffect(() => {
//     const url = new URL(window.location.href);
//     const ps = url.searchParams.get("pageSize") || "20";
//     setPageSize(ps);
//   }, []);

//   // Chart fetch logic
//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount,
//         totalProfit,
//         chartData,
//         topReasons,
//         topRefundedProducts,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(totalRefundAmount);
//       setChartProfit(totalProfit);
//       setChartMainData(chartData);
//       setTopReasons(topReasons);
//       setTopRefundedProducts(topRefundedProducts);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   // Submit date filters
//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     setLoading(true);
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Build base filtered data
//   let baseFilteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       // Shipped => statuses in ["In Transit","Out Of Delivery","Delivered"]
//       if (filterType === "Shipped") {
//         return (
//           order.shippingStatus === "In Transit" ||
//           order.shippingStatus === "Out Of Delivery" ||
//           order.shippingStatus === "Delivered" ||
//           order.shippingStatus === "Confimed" ||
//           order.shippingStatus === "success"
//         );
//       }
//       // Non-Shipped => anything else, including "N/A", "Confirm", or blank
//       if (filterType === "Non-Shipped") {
//         return !(
//           order.shippingStatus === "In Transit" ||
//           order.shippingStatus === "Out Of Delivery" ||
//           order.shippingStatus === "Delivered" ||
//           order.shippingStatus === "Confimed" ||
//           order.shippingStatus === "success"
//         );
//       }
//       return true; // All
//     })
//     .filter((order) => {
//       if (!searchQuery) return true;
//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter(Boolean);
//       if (queries.length > 1) {
//         return queries.some((q) => order.orderNumber.toLowerCase().includes(q));
//       }
//       const query = queries[0] || "";
//       return (
//         order.orderNumber.toLowerCase().includes(query) ||
//         order.customerName.toLowerCase().includes(query) ||
//         order.customerEmail.toLowerCase().includes(query) ||
//         order.orderedProducts.toLowerCase().includes(query)
//       );
//     });

//   // If user is on All/Shipped/Non-Shipped, let them sort Is Refunded
//   let finalOrders = [...baseFilteredOrders];
//   const canSortRefunded =
//     filterType === "All" ||
//     filterType === "Shipped" ||
//     filterType === "Non-Shipped";

//   if (canSortRefunded && sortColumnIndex === 8 && sortDirection) {
//     finalOrders.sort((a, b) => {
//       const aVal = a.isRefunded === "Yes" ? 1 : 0;
//       const bVal = b.isRefunded === "Yes" ? 1 : 0;
//       if (sortDirection === "ascending") {
//         // ascending => "Yes" top => aVal - bVal
//         return aVal - bVal;
//       } else {
//         // descending => "No" top => bVal - aVal
//         return bVal - aVal;
//       }
//     });
//   }

//   // Expand/collapse for multiple products
//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [orderNumber]: !prev[orderNumber],
//     }));
//   };

//   // Checkboxes
//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prev) =>
//       prev.includes(orderNumber)
//         ? prev.filter((id) => id !== orderNumber)
//         : [...prev, orderNumber],
//     );
//   };

//   const handleSelectAllChange = (event: any) => {
//     if (event.target.checked) {
//       const allNums = finalOrders.map((ord) => ord.orderNumber);
//       setSelectedOrders(allNums);
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   // Prepare rows for DataTable
//   const getFormattedRows = () => {
//     const rows: (string | JSX.Element)[][] = [];
//     finalOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ");
//       const hasMultipleProducts = productTitles.length > 1;

//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus || "N/A",
//         order.shippingLastUpdated || "N/A",
//         order.customerName,
//         order.customerEmail,
//         hasMultipleProducts ? (
//           <div
//             style={{
//               cursor: "pointer",
//               color: "blue",
//               textDecoration: "underline",
//             }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0] || "N/A"
//         ),
//         order.isRefunded,
//         order.orderAmount,
//       ]);

//       if (expandedRows[order.orderNumber] && hasMultipleProducts) {
//         productTitles.slice(1).forEach((title) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: "20px" }}>{title}</div>,
//             "",
//             "",
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   // We'll define a custom heading element for "Is Refunded" so it always uses the same style
//   const isRefundedHeading = (
//     <Text as="span" variant="bodyMd" fontWeight="semibold">
//       Is Refunded
//     </Text>
//   );

//   // The DataTable headings
//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === finalOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     isRefundedHeading, // same style
//     "Order Amount",
//   ];

//   // Filter button
//   const changeFilter = (fType: string) => {
//     setLoading(true);
//     setFilterType(fType);
//     if (fType === "Refunded" || fType === "Non-Refunded") {
//       setSortColumnIndex(undefined);
//       setSortDirection(undefined);
//     }
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Pagination
//   const goToPage = (p: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", p.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   // PageSize
//   const changePageSize = (value: string) => {
//     setLoading(true);
//     setPageSize(value);
//     const url = new URL(window.location.href);
//     url.searchParams.set("pageSize", value);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Email
//   const handleSendEmail = () => {
//     const enriched = selectedOrders.map((num) =>
//       allOrders.find((o) => o.orderNumber === num),
//     );
//     const valid = enriched.filter((o) => o && o.customerEmail);
//     if (!valid.length) {
//       setNoUserEmail("No valid emails found in the selected orders.");
//       return;
//     }
//     setSelectedOrders(valid as any);
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   const sendEmailsToCustomers = async (templateData: any) => {
//     const { subject, bodyHtml, bodyText } = templateData;
//     const results: any[] = [];

//     for (let i = 0; i < (selectedOrders as any[]).length; i++) {
//       const order = (selectedOrders as any[])[i];
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;

//       try {
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });

//         if (!response.ok) {
//           const errData = await response.json();
//           setToastMessage(errData.error || "Error sending email.");
//           setActiveToast(true);
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Error",
//           });
//         } else {
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Delivered",
//           });
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage(
//           "An unexpected error occurred while sending the email.",
//         );
//         setActiveToast(true);
//         results.push({
//           sNo: i + 1,
//           dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//           customerName,
//           customerEmail: toAddress,
//           orderNumber: orderId,
//           status: "Error",
//         });
//       }
//     }

//     setIsModalOpen(false);
//     setConfirmationData(results);
//     setIsConfirmationModalOpen(true);
//   };

//   // Chart data
//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [
//           totalShippedOrdersCount,
//           totalRefundedOrdersCount,
//           totalUnfulfilledOrdersCount,
//         ],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4,
//       },
//     ],
//   };

//   const barData = {
//     labels: ["Total Sales", "Refunded"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount],
//       },
//     ],
//   };

//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" as const },
//       title: { display: true, text: "Sales vs. Refund" },
//     },
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner" />
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}

//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         {noUserEmail && (
//           <Banner status="critical" title="Error">
//             <p>{noUserEmail}</p>
//           </Banner>
//         )}

//         <Layout>
//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Left side: date filters & charts */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                   }}
//                 >
//                   {/* Date Filter Card */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(val) => setStartDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(val) => setEndDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px",
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>

//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
//                     <Button onClick={() => setDateRange(30)}>
//                       Last 30 Days
//                     </Button>
//                     <Button onClick={() => setDateRange(60)}>
//                       Last 60 Days
//                     </Button>
//                   </div>

//                   {/* Summary + Charts */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px",
//                     }}
//                   >
//                     {/* Summary */}
//                     <Card
//                       sectioned
//                       style={{ padding: "16px", borderRadius: "12px" }}
//                     >
//                       <div style={{ marginBottom: "20px" }}>
//                         <Text variant="headingLg">Summary</Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>
//                             💰
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)}{" "}
//                             {currencyCode}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>
//                             📦
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>
//                             🚚
//                           </span>
//                           <Text variant="bodyMd">
//                             Shipped: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>
//                             🔄
//                           </span>
//                           <Text variant="bodyMd">
//                             Refunded: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>
//                             ❗
//                           </span>
//                           <Text variant="bodyMd">
//                             Unfulfilled: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>

//                     {/* Charts */}
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns:
//                           "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px",
//                       }}
//                     >
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Doughnut
//                             data={{
//                               labels: ["Shipped", "Refunded", "Unfulfilled"],
//                               datasets: [
//                                 {
//                                   label: "Order Distribution",
//                                   data: [
//                                     totalShippedOrdersCount,
//                                     totalRefundedOrdersCount,
//                                     totalUnfulfilledOrdersCount,
//                                   ],
//                                   backgroundColor: [
//                                     "#36A2EB",
//                                     "#FF6384",
//                                     "#FFCE56",
//                                   ],
//                                   hoverOffset: 4,
//                                 },
//                               ],
//                             }}
//                           />
//                         </div>
//                       </Card>
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar
//                             data={{
//                               labels: ["Total Sales", "Refunded"],
//                               datasets: [
//                                 {
//                                   label: "Amount",
//                                   backgroundColor: ["#4CAF50", "#F44336"],
//                                   data: [totalSalesAmount, totalRefundAmount],
//                                 },
//                               ],
//                             }}
//                             options={{
//                               responsive: true,
//                               plugins: {
//                                 legend: { position: "top" as const },
//                                 title: {
//                                   display: true,
//                                   text: "Sales vs. Refund",
//                                 },
//                               },
//                             }}
//                           />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>

//               {/* Right Panel: Orders Table */}
//               <Layout.Section>
//                 {selectedOrders.length > 0 && (
//                   <div
//                     onClick={handleSendEmail}
//                     style={{
//                       cursor: "pointer",
//                       backgroundColor: "#28a745",
//                       color: "white",
//                       borderRadius: "15px",
//                       margin: "20px 50px",
//                     }}
//                   >
//                     <p
//                       style={{
//                         textAlign: "center",
//                         fontSize: "30px",
//                         padding: "10px",
//                       }}
//                     >
//                       Send Email
//                     </p>
//                   </div>
//                 )}

//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />
//                 <EmailConfirmationModal
//                   isOpen={isConfirmationModalOpen}
//                   onClose={() => setIsConfirmationModalOpen(false)}
//                   data={confirmationData}
//                 />

//                 <div style={{ width: "100%" }}>
//                   {/* Filter Buttons */}
//                   <Card sectioned>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "center",
//                         gap: "30px",
//                       }}
//                     >
//                       <Button
//                         onClick={() => changeFilter("All")}
//                         primary={filterType === "All"}
//                         disabled={loading}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Refunded")}
//                         primary={filterType === "Refunded"}
//                         disabled={loading}
//                       >
//                         Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Refunded")}
//                         primary={filterType === "Non-Refunded"}
//                         disabled={loading}
//                       >
//                         Non-Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Shipped")}
//                         primary={filterType === "Shipped"}
//                         disabled={loading}
//                       >
//                         Shipped
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Shipped")}
//                         primary={filterType === "Non-Shipped"}
//                         disabled={loading}
//                       >
//                         Non-Shipped
//                       </Button>
//                     </div>
//                   </Card>

//                   {/* Search bar */}
//                   <Card sectioned>
//                     <TextField
//                       label="Search Orders"
//                       value={searchQuery}
//                       onChange={(val) => setSearchQuery(val)}
//                       autoComplete="off"
//                       placeholder="Search by order #, name, or product"
//                     />
//                   </Card>

//                   {/* Orders Table */}
//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         // "Is Refunded" => index=8 => possibly sortable
//                         sortable={[
//                           false, // col 0
//                           false, // col 1
//                           false, // col 2
//                           false, // col 3
//                           false, // col 4
//                           false, // col 5
//                           false, // col 6
//                           false, // col 7
//                           filterType === "All" ||
//                             filterType === "Shipped" ||
//                             filterType === "Non-Shipped", // col 8 => "Is Refunded"
//                           false, // col 9
//                         ]}
//                         onSort={(columnIndex, direction) => {
//                           if (
//                             (filterType === "All" ||
//                               filterType === "Shipped" ||
//                               filterType === "Non-Shipped") &&
//                             columnIndex === 8
//                           ) {
//                             setSortColumnIndex(8);
//                             setSortDirection(direction);
//                           }
//                         }}
//                         sortColumnIndex={sortColumnIndex}
//                         sortDirection={sortDirection}
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         footerContent={`Total Orders: ${finalOrders.length}`}
//                       />
//                     </div>

//                     {/* "Records per page" dropdown */}
//                     <div
//                       style={{
//                         width: "15%",
//                         justifySelf: "end",
//                         margin: "10px",
//                       }}
//                     >
//                       <Card sectioned>
//                         <Text variant="headingMd">Records per page:</Text>
//                         <Select
//                           options={[
//                             { label: "20", value: "20" },
//                             { label: "50", value: "50" },
//                             { label: "70", value: "70" },
//                             { label: "100", value: "100" },
//                           ]}
//                           value={pageSize}
//                           onChange={(value) => changePageSize(value)}
//                           disabled={loading}
//                         />
//                       </Card>
//                     </div>

//                     {/* Pagination */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px",
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>
//                           Last
//                         </Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>

//         {activeToast && (
//           <Toast content={toastMessage} error onDismiss={toggleToast} />
//         )}
//       </Page>
//     </Frame>
//   );
// }

// Jan-30-2025
// Updated Tracking status under Shipped Filter Button + Advanced Product Filtering + Toggle for advanced filters

// import { useState, useEffect, useCallback } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Banner,
//   Frame,
//   Toast,
//   Select,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css";
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
// import { sendEmail } from "./sendEmail";

// // React-ChartJS-2
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";

// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title
// );

// const prisma = new PrismaClient();

// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;

//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   currentPage: number;
//   totalPages: number;

//   allOrders: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];

//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
// };

// // ---------- LOADER -------------
// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const pageParam = url.searchParams.get("page") || "1";
//   const filterType = url.searchParams.get("filterType") || "All";
//   const pageSizeParam = url.searchParams.get("pageSize") || "20";
//   const pageSize = parseInt(pageSizeParam, 10);

//   const page = parseInt(pageParam, 10);
//   const startDate = startDateParam ? new Date(startDateParam) : undefined;
//   const endDate = endDateParam ? new Date(endDateParam) : undefined;

//   // "Shipped" now means fulfillmentStatus in ["In Transit", "Out Of Delivery", "Delivered"]
//   // "Non-Shipped" means not in that set (plus possibly null)
//   let refundedFilter: any = {};
//   if (filterType === "Refunded") {
//     refundedFilter = { refunds: { some: {} } };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = { refunds: { none: {} } };
//   } else if (filterType === "Shipped") {
//     refundedFilter = {
//       fulfillmentStatus: {
//         in: ["In Transit", "Out Of Delivery", "Delivered"],
//       },
//     };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [
//         {
//           fulfillmentStatus: {
//             notIn: ["In Transit", "Out Of Delivery", "Delivered"],
//           },
//         },
//         { fulfillmentStatus: null },
//       ],
//     };
//   }

//   const skip = (page - 1) * pageSize;

//   // Aggregates
//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//     },
//   });

//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: {
//       order: {
//         shop,
//         createdAt: {
//           gte: startDate,
//           lte: endDate,
//         },
//       },
//     },
//   });

//   // Fetch all orders
//   const allOrdersRaw = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   // Paginated
//   const pagedOrders = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//       ...refundedFilter,
//     },
//     include: {
//       lineItems: true,
//       refunds: true,
//     },
//     orderBy: { createdAt: "asc" },
//     skip,
//     take: pageSize,
//   });

//   // Build "paged" table data
//   const ordersTableData = pagedOrders.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Build "all" table data
//   const allOrdersTableData = allOrdersRaw.map((order) => {
//     const products = order.lineItems.map((item) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";

//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${
//         order.customerLastName || "N/A"
//       }`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   });

//   // Calculations
//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;

//   const totalOrdersCount = allOrdersRaw.length;
//   const shippedStatuses = ["In Transit", "Out Of Delivery", "Delivered"];
//   const totalShippedOrdersCount = allOrdersRaw.filter((o) =>
//     shippedStatuses.includes(o.fulfillmentStatus ?? "")
//   ).length;

//   const totalRefundedOrdersCount = allOrdersRaw.filter(
//     (o) => o.refunds.length > 0
//   ).length;

//   const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
//     (o) => !shippedStatuses.includes(o.fulfillmentStatus ?? "")
//   ).length;

//   const totalPages = Math.ceil(allOrdersRaw.length / pageSize);

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: pagedOrders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages,
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   });
// };

// export default function Dashboard() {
//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   } = useLoaderData<LoaderData>();

//   const fetcher = useFetcher();
//   const submit = useSubmit();

//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd")
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [loading, setLoading] = useState(false);
//   const [filterType, setFilterType] = useState("All");
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//   const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

//   // Email modals
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
//   const [confirmationData, setConfirmationData] = useState<any[]>([]);

//   // Chart data
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState<any[]>([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
//   const [topReasons, setTopReasons] = useState<any[]>([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   // Page size
//   const [pageSize, setPageSize] = useState("20");

//   // For sorting "Is Refunded"
//   const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(
//     undefined
//   );
//   const [sortDirection, setSortDirection] = useState<
//     "ascending" | "descending" | undefined
//   >(undefined);

//   // NEW: Advanced product filtering fields
//   // (A OR B OR C)
//   const [includeProductsOR, setIncludeProductsOR] = useState("");
//   // NOT (X OR Y)
//   const [excludeProductsOR, setExcludeProductsOR] = useState("");

//   // NEW: Toggle for advanced product filters
//   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

//   // On mount, read pageSize from the URL if present
//   useEffect(() => {
//     const url = new URL(window.location.href);
//     const ps = url.searchParams.get("pageSize") || "20";
//     setPageSize(ps);
//   }, []);

//   // Chart fetch logic
//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount,
//         totalProfit,
//         chartData,
//         topReasons,
//         topRefundedProducts,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(totalRefundAmount);
//       setChartProfit(totalProfit);
//       setChartMainData(chartData);
//       setTopReasons(topReasons);
//       setTopRefundedProducts(topRefundedProducts);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   // Submit date filters
//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     setLoading(true);
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Build base filtered data
//   let baseFilteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       // Shipped => statuses in ["In Transit","Out Of Delivery","Delivered"]
//       if (filterType === "Shipped") {
//         return (
//           order.shippingStatus === "In Transit" ||
//           order.shippingStatus === "Out Of Delivery" ||
//           order.shippingStatus === "Delivered" ||
//           order.shippingStatus === "Confimed" ||
//           order.shippingStatus === "success"
//         );
//       }
//       // Non-Shipped => anything else, including "N/A", "Confirm", or blank
//       if (filterType === "Non-Shipped") {
//         return !(
//           order.shippingStatus === "In Transit" ||
//           order.shippingStatus === "Out Of Delivery" ||
//           order.shippingStatus === "Delivered" ||
//           order.shippingStatus === "Confimed" ||
//           order.shippingStatus === "success"
//         );
//       }
//       return true; // All
//     })
//     .filter((order) => {
//       if (!searchQuery) return true;
//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter(Boolean);
//       if (queries.length > 1) {
//         return queries.some((q) => order.orderNumber.toLowerCase().includes(q));
//       }
//       const query = queries[0] || "";
//       return (
//         order.orderNumber.toLowerCase().includes(query) ||
//         order.customerName.toLowerCase().includes(query) ||
//         order.customerEmail.toLowerCase().includes(query) ||
//         order.orderedProducts.toLowerCase().includes(query)
//       );
//     });

//   // Next, apply the advanced product filters (only if they're shown)
//   if (showAdvancedFilters) {
//     // (A OR B OR C) => if at least one "A/B/C" is found in the products => included
//     if (includeProductsOR.trim()) {
//       const includesArr = includeProductsOR
//         .split(",")
//         .map((p) => p.trim().toLowerCase())
//         .filter(Boolean);

//       baseFilteredOrders = baseFilteredOrders.filter((order) => {
//         const lineStr = order.orderedProducts.toLowerCase();
//         return includesArr.some((inc) => lineStr.includes(inc));
//       });
//     }

//     // EXCLUDE if product matches any in exclude arr => "NOT (X OR Y OR Z)"
//     if (excludeProductsOR.trim()) {
//       const excludesArr = excludeProductsOR
//         .split(",")
//         .map((p) => p.trim().toLowerCase())
//         .filter(Boolean);

//       baseFilteredOrders = baseFilteredOrders.filter((order) => {
//         const lineStr = order.orderedProducts.toLowerCase();
//         return !excludesArr.some((exc) => lineStr.includes(exc));
//       });
//     }
//   }

//   // If user is on All/Shipped/Non-Shipped, let them sort "Is Refunded"
//   let finalOrders = [...baseFilteredOrders];
//   const canSortRefunded =
//     filterType === "All" ||
//     filterType === "Shipped" ||
//     filterType === "Non-Shipped";

//   if (canSortRefunded && sortColumnIndex === 8 && sortDirection) {
//     finalOrders.sort((a, b) => {
//       const aVal = a.isRefunded === "Yes" ? 1 : 0;
//       const bVal = b.isRefunded === "Yes" ? 1 : 0;
//       if (sortDirection === "ascending") {
//         return aVal - bVal;
//       } else {
//         return bVal - aVal;
//       }
//     });
//   }

//   // Expand/collapse for multiple products
//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [orderNumber]: !prev[orderNumber],
//     }));
//   };

//   // Checkboxes
//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prev) =>
//       prev.includes(orderNumber)
//         ? prev.filter((id) => id !== orderNumber)
//         : [...prev, orderNumber]
//     );
//   };

//   const handleSelectAllChange = (event: any) => {
//     if (event.target.checked) {
//       const allNums = finalOrders.map((ord) => ord.orderNumber);
//       setSelectedOrders(allNums);
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   // Prepare rows for DataTable
//   const getFormattedRows = () => {
//     const rows: (string | JSX.Element)[][] = [];
//     finalOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ");
//       const hasMultipleProducts = productTitles.length > 1;

//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus || "N/A",
//         order.shippingLastUpdated || "N/A",
//         order.customerName,
//         order.customerEmail,
//         hasMultipleProducts ? (
//           <div
//             style={{
//               cursor: "pointer",
//               color: "blue",
//               textDecoration: "underline",
//             }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0] || "N/A"
//         ),
//         order.isRefunded,
//         order.orderAmount
//       ]);

//       if (expandedRows[order.orderNumber] && hasMultipleProducts) {
//         productTitles.slice(1).forEach((title) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: "20px" }}>{title}</div>,
//             "",
//             ""
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   // We'll define a custom heading element for "Is Refunded" so it always uses the same style
//   const isRefundedHeading = (
//     <Text as="span" variant="bodyMd" fontWeight="semibold">
//       Is Refunded
//     </Text>
//   );

//   // The DataTable headings
//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === finalOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     isRefundedHeading, // same style
//     "Order Amount"
//   ];

//   // Filter button
//   const changeFilter = (fType: string) => {
//     setLoading(true);
//     setFilterType(fType);
//     if (fType === "Refunded" || fType === "Non-Refunded") {
//       setSortColumnIndex(undefined);
//       setSortDirection(undefined);
//     }
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Pagination
//   const goToPage = (p: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", p.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   // PageSize
//   const changePageSize = (value: string) => {
//     setLoading(true);
//     setPageSize(value);
//     const url = new URL(window.location.href);
//     url.searchParams.set("pageSize", value);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Email
//   const handleSendEmail = () => {
//     const enriched = selectedOrders.map((num) =>
//       allOrders.find((o) => o.orderNumber === num)
//     );
//     const valid = enriched.filter((o) => o && o.customerEmail);
//     if (!valid.length) {
//       setNoUserEmail("No valid emails found in the selected orders.");
//       return;
//     }
//     setSelectedOrders(valid as any);
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   const sendEmailsToCustomers = async (templateData: any) => {
//     const { subject, bodyHtml, bodyText } = templateData;
//     const results: any[] = [];

//     for (let i = 0; i < (selectedOrders as any[]).length; i++) {
//       const order = (selectedOrders as any[])[i];
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;

//       try {
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName
//           })
//         });

//         if (!response.ok) {
//           const errData = await response.json();
//           setToastMessage(errData.error || "Error sending email.");
//           setActiveToast(true);
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Error"
//           });
//         } else {
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Delivered"
//           });
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage("An unexpected error occurred while sending the email.");
//         setActiveToast(true);
//         results.push({
//           sNo: i + 1,
//           dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//           customerName,
//           customerEmail: toAddress,
//           orderNumber: orderId,
//           status: "Error"
//         });
//       }
//     }

//     setIsModalOpen(false);
//     setConfirmationData(results);
//     setIsConfirmationModalOpen(true);
//   };

//   // Chart data
//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [
//           totalShippedOrdersCount,
//           totalRefundedOrdersCount,
//           totalUnfulfilledOrdersCount
//         ],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4
//       }
//     ]
//   };

//   const barData = {
//     labels: ["Total Sales", "Refunded"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount]
//       }
//     ]
//   };

//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" as const },
//       title: { display: true, text: "Sales vs. Refund" }
//     }
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner" />
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}

//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         {noUserEmail && (
//           <Banner status="critical" title="Error">
//             <p>{noUserEmail}</p>
//           </Banner>
//         )}

//         <Layout>
//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Left side: date filters & charts */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
//                   }}
//                 >
//                   {/* Date Filter Card */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(val) => setStartDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(val) => setEndDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px"
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>

//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px"
//                     }}
//                   >
//                     <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
//                     <Button onClick={() => setDateRange(30)}>
//                       Last 30 Days
//                     </Button>
//                     <Button onClick={() => setDateRange(60)}>
//                       Last 60 Days
//                     </Button>
//                   </div>

//                   {/* Summary + Charts */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px"
//                     }}
//                   >
//                     {/* Summary */}
//                     <Card
//                       sectioned
//                       style={{ padding: "16px", borderRadius: "12px" }}
//                     >
//                       <div style={{ marginBottom: "20px" }}>
//                         <Text variant="headingLg">Summary</Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px"
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px"
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>
//                             💰
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)}{" "}
//                             {currencyCode}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px"
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>
//                             📦
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px"
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>
//                             🚚
//                           </span>
//                           <Text variant="bodyMd">
//                             Shipped: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px"
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>
//                             🔄
//                           </span>
//                           <Text variant="bodyMd">
//                             Refunded: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px"
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>
//                             ❗
//                           </span>
//                           <Text variant="bodyMd">
//                             Unfulfilled: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>

//                     {/* Charts */}
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns:
//                           "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px"
//                       }}
//                     >
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Doughnut
//                             data={{
//                               labels: ["Shipped", "Refunded", "Unfulfilled"],
//                               datasets: [
//                                 {
//                                   label: "Order Distribution",
//                                   data: [
//                                     totalShippedOrdersCount,
//                                     totalRefundedOrdersCount,
//                                     totalUnfulfilledOrdersCount
//                                   ],
//                                   backgroundColor: [
//                                     "#36A2EB",
//                                     "#FF6384",
//                                     "#FFCE56"
//                                   ],
//                                   hoverOffset: 4
//                                 }
//                               ]
//                             }}
//                           />
//                         </div>
//                       </Card>
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar
//                             data={{
//                               labels: ["Total Sales", "Refunded"],
//                               datasets: [
//                                 {
//                                   label: "Amount",
//                                   backgroundColor: ["#4CAF50", "#F44336"],
//                                   data: [totalSalesAmount, totalRefundAmount]
//                                 }
//                               ]
//                             }}
//                             options={{
//                               responsive: true,
//                               plugins: {
//                                 legend: { position: "top" as const },
//                                 title: {
//                                   display: true,
//                                   text: "Sales vs. Refund"
//                                 }
//                               }
//                             }}
//                           />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>

//               {/* Right Panel: Orders Table */}
//               <Layout.Section>
//                 {selectedOrders.length > 0 && (
//                   <div
//                     onClick={handleSendEmail}
//                     style={{
//                       cursor: "pointer",
//                       backgroundColor: "#28a745",
//                       color: "white",
//                       borderRadius: "15px",
//                       margin: "20px 50px"
//                     }}
//                   >
//                     <p
//                       style={{
//                         textAlign: "center",
//                         fontSize: "30px",
//                         padding: "10px"
//                       }}
//                     >
//                       Send Email
//                     </p>
//                   </div>
//                 )}

//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />
//                 <EmailConfirmationModal
//                   isOpen={isConfirmationModalOpen}
//                   onClose={() => setIsConfirmationModalOpen(false)}
//                   data={confirmationData}
//                 />

//                 <div
//                   style={{
//                     width: "100%",
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "10px"
//                   }}
//                 >
//                   {/* Filter Buttons */}
//                   <Card sectioned>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "center",
//                         gap: "30px"
//                       }}
//                     >
//                       <Button
//                         onClick={() => changeFilter("All")}
//                         primary={filterType === "All"}
//                         disabled={loading}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Refunded")}
//                         primary={filterType === "Refunded"}
//                         disabled={loading}
//                       >
//                         Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Refunded")}
//                         primary={filterType === "Non-Refunded"}
//                         disabled={loading}
//                       >
//                         Non-Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Shipped")}
//                         primary={filterType === "Shipped"}
//                         disabled={loading}
//                       >
//                         Shipped
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Shipped")}
//                         primary={filterType === "Non-Shipped"}
//                         disabled={loading}
//                       >
//                         Non-Shipped
//                       </Button>
//                     </div>
//                   </Card>

//                   {/* Basic search bar */}
//                   <Card sectioned>
//                     <TextField
//                       label="Search Orders"
//                       value={searchQuery}
//                       onChange={(val) => setSearchQuery(val)}
//                       autoComplete="off"
//                       placeholder="Search by order #, name, or product"
//                     />
//                   </Card>

//                   {/* Toggle to show/hide advanced filters */}
//                   <Card sectioned>
//                     <Button
//                       onClick={() =>
//                         setShowAdvancedFilters((prev) => !prev)
//                       }
//                       fullWidth
//                       primary
//                     >
//                       {showAdvancedFilters
//                         ? "Hide Advanced Filters"
//                         : "Show Advanced Filters"}
//                     </Button>
//                   </Card>

//                   {/* ADVANCED PRODUCT FILTERS (AND/OR logic) - Conditionally rendered */}
//                   {showAdvancedFilters && (
//                     <Card>
//                       <div
//                         style={{
//                           display: "flex",
//                           gap: "20px",
//                           width: "100%",
//                           marginTop: "10px"
//                         }}
//                       >
//                         <div style={{ width: "50%" }}>
//                           <Card sectioned>
//                             <TextField
//                               label="Include any of these products (OR)"
//                               value={includeProductsOR}
//                               onChange={(val) => setIncludeProductsOR(val)}
//                               helpText="If an order contains at least one of these items, it is included"
//                               autoComplete="off"
//                             />
//                           </Card>
//                         </div>
//                         <div style={{ width: "50%" }}>
//                           <Card sectioned>
//                             <TextField
//                               label="Exclude any of these products (OR)"
//                               value={excludeProductsOR}
//                               onChange={(val) => setExcludeProductsOR(val)}
//                               helpText="If an order contains any of these items, it is excluded"
//                               autoComplete="off"
//                             />
//                           </Card>
//                         </div>
//                       </div>
//                     </Card>
//                   )}

//                   {/* Orders Table */}
//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         // "Is Refunded" => index=8 => possibly sortable
//                         sortable={[
//                           false, // col 0
//                           false, // col 1
//                           false, // col 2
//                           false, // col 3
//                           false, // col 4
//                           false, // col 5
//                           false, // col 6
//                           false, // col 7
//                           filterType === "All" ||
//                             filterType === "Shipped" ||
//                             filterType === "Non-Shipped", // col 8 => "Is Refunded"
//                           false // col 9
//                         ]}
//                         onSort={(columnIndex, direction) => {
//                           if (
//                             (filterType === "All" ||
//                               filterType === "Shipped" ||
//                               filterType === "Non-Shipped") &&
//                             columnIndex === 8
//                           ) {
//                             setSortColumnIndex(8);
//                             setSortDirection(direction);
//                           }
//                         }}
//                         sortColumnIndex={sortColumnIndex}
//                         sortDirection={sortDirection}
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text"
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         footerContent={`Total Orders: ${finalOrders.length}`}
//                       />
//                     </div>

//                     {/* "Records per page" dropdown */}
//                     <div
//                       style={{
//                         width: "15%",
//                         justifySelf: "end",
//                         margin: "10px"
//                       }}
//                     >
//                       <Card sectioned>
//                         <Text variant="headingMd">Records per page:</Text>
//                         <Select
//                           options={[
//                             { label: "20", value: "20" },
//                             { label: "50", value: "50" },
//                             { label: "70", value: "70" },
//                             { label: "100", value: "100" }
//                           ]}
//                           value={pageSize}
//                           onChange={(value) => changePageSize(value)}
//                           disabled={loading}
//                         />
//                       </Card>
//                     </div>

//                     {/* Pagination */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px"
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>
//                           Last
//                         </Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>

//         {activeToast && (
//           <Toast content={toastMessage} error onDismiss={toggleToast} />
//         )}
//       </Page>
//     </Frame>
//   );
// }

// Feb-2-2025
// Update in the Advanced Filter

// import { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Banner,
//   Frame,
//   Toast,
//   Select,
//   Modal,
//   Checkbox,
//   Icon,
// } from "@shopify/polaris";
// import { format, subDays, subMonths } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css";
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
// import { sendEmail } from "./sendEmail";
// import { MdToggleOn, MdToggleOff } from "react-icons/md";
// import { FiRefreshCcw } from "react-icons/fi";

// // React-ChartJS-2 imports
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";
// import EmailPreviewModal from "app/componenets/EmailPreviewModal";

// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// );

// const prisma = new PrismaClient();

// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;
//   ordersTableData: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];
//   currentPage: number;
//   totalPages: number;
//   allOrders: {
//     orderNumber: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//   }[];
//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
// };

// // ---------- LOADER -------------
// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const pageParam = url.searchParams.get("page") || "1";
//   const filterType = url.searchParams.get("filterType") || "All";
//   const pageSizeParam = url.searchParams.get("pageSize") || "20";
//   const pageSize = parseInt(pageSizeParam, 10);

//   const page = parseInt(pageParam, 10);
//   const startDate = startDateParam ? new Date(startDateParam) : undefined;
//   const endDate = endDateParam ? new Date(endDateParam) : undefined;

//   let refundedFilter: any = {};
//   if (filterType === "Refunded") {
//     refundedFilter = { refunds: { some: {} } };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = { refunds: { none: {} } };
//   } else if (filterType === "Shipped") {
//     refundedFilter = {
//       fulfillmentStatus: {
//         in: [
//           "Confirmed",
//           "In Transit",
//           "Out Of Delivery",
//           "Out for Delivery",
//           "Delivered",
//           "Shipped-Unknown Status",
//           "sucess",
//         ],
//       },
//     };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [
//         {
//           fulfillmentStatus: {
//             notIn: [
//               "Confirmed",
//               "In Transit",
//               "Out Of Delivery",
//               "Out for Delivery",
//               "Delivered",
//               "Shipped-Unknown Status",
//               "suncess",
//             ],
//           },
//         },
//         { fulfillmentStatus: null },
//       ],
//     };
//   }

//   const skip = (page - 1) * pageSize;

//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: { shop, createdAt: { gte: startDate, lte: endDate } },
//   });

//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: { order: { shop, createdAt: { gte: startDate, lte: endDate } } },
//   });

//   const allOrdersRaw = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: { gte: startDate, lte: endDate },
//       ...refundedFilter,
//     },
//     include: { lineItems: true, refunds: true },
//     orderBy: { createdAt: "asc" },
//   });

//   const pagedOrders = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: { gte: startDate, lte: endDate },
//       ...refundedFilter,
//     },
//     include: { lineItems: true, refunds: true },
//     orderBy: { createdAt: "asc" },
//     skip,
//     take: pageSize,
//   });

//   const mapOrder = (order: any) => {
//     const products = order.lineItems.map((item: any) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     console.log("Shipping Status", shippingStatus);
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";
//     return {
//       orderNumber: order.name,
//       customerName: `${order.customerFirstName || "N/A"} ${order.customerLastName || "N/A"}`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//     };
//   };

//   const ordersTableData = pagedOrders.map(mapOrder);
//   const allOrdersTableData = allOrdersRaw.map(mapOrder);

//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;
//   const totalOrdersCount = allOrdersRaw.length;
//   const shippedStatuses = [
//     "Confirmed",
//     "In Transit",
//     "Out Of Delivery",
//     "Out for Delivery",
//     "Delivered",
//   ];
//   const totalShippedOrdersCount = allOrdersRaw.filter((o: any) =>
//     shippedStatuses.includes(o.fulfillmentStatus ?? ""),
//   ).length;
//   const totalRefundedOrdersCount = allOrdersRaw.filter(
//     (o: any) => o.refunds.length > 0,
//   ).length;
//   const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
//     (o: any) => !shippedStatuses.includes(o.fulfillmentStatus ?? ""),
//   ).length;
//   const totalPages = Math.ceil(allOrdersRaw.length / pageSize);

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: pagedOrders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages,
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   });
// };

// //
// // Custom Checkbox Dropdown Component with Search and Auto-Close
// //
// type CheckboxDropdownProps = {
//   label: string;
//   options: { value: string; label: string }[];
//   selected: string[];
//   onChange: (selected: string[]) => void;
//   helpText?: string;
// };

// function CheckboxDropdown({
//   label,
//   options,
//   selected,
//   onChange,
//   helpText,
// }: CheckboxDropdownProps) {
//   const [open, setOpen] = useState(false);
//   const [searchText, setSearchText] = useState("");
//   const containerRef = useRef<HTMLDivElement>(null);

//   const toggleOpen = () => setOpen((prev) => !prev);

//   const filteredOptions = useMemo(() => {
//     if (!searchText) return options;
//     return options.filter((opt) =>
//       opt.label.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [searchText, options]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         open &&
//         containerRef.current &&
//         !containerRef.current.contains(event.target as Node)
//       ) {
//         setOpen(false);
//       }
//     };
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (open && event.key === "Escape") {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     document.addEventListener("keydown", handleKeyDown);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [open]);

//   return (
//     <div
//       ref={containerRef}
//       style={{ position: "relative", width: "100%", overflow: "visible" }}
//     >
//       <label
//         style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}
//       >
//         {label}
//       </label>
//       <button
//         type="button"
//         onClick={toggleOpen}
//         style={{
//           width: "100%",
//           padding: "8px",
//           textAlign: "left",
//           border: "1px solid #ccc",
//           borderRadius: "4px",
//           backgroundColor: "#fff",
//         }}
//       >
//         {selected.length > 0 ? selected.join(", ") : "Select options"}
//       </button>
//       {open && (
//         <div
//           style={{
//             position: "absolute",
//             top: "100%",
//             left: 0,
//             right: 0,
//             border: "1px solid #ccc",
//             borderRadius: "4px",
//             backgroundColor: "#fff",
//             zIndex: 1000,
//             maxHeight: "200px",
//             overflowY: "auto",
//             marginTop: "2px",
//           }}
//         >
//           <div style={{ padding: "4px 8px" }}>
//             <input
//               type="text"
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               placeholder="Search products..."
//               style={{
//                 width: "100%",
//                 padding: "4px",
//                 boxSizing: "border-box",
//                 border: "1px solid #ccc",
//                 borderRadius: "4px",
//               }}
//             />
//           </div>
//           {filteredOptions.length > 0 ? (
//             filteredOptions.map((opt) => (
//               <div key={opt.value} style={{ padding: "4px 8px" }}>
//                 <label style={{ display: "flex", alignItems: "center" }}>
//                   <input
//                     type="checkbox"
//                     checked={selected.includes(opt.value)}
//                     onChange={() => {
//                       if (selected.includes(opt.value)) {
//                         onChange(selected.filter((x) => x !== opt.value));
//                       } else {
//                         onChange([...selected, opt.value]);
//                       }
//                     }}
//                     style={{ marginRight: "8px" }}
//                   />
//                   {opt.label}
//                 </label>
//               </div>
//             ))
//           ) : (
//             <div style={{ padding: "4px 8px" }}>No options found</div>
//           )}
//         </div>
//       )}
//       {helpText && (
//         <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "4px" }}>
//           {helpText}
//         </div>
//       )}
//     </div>
//   );
// }

// //
// // Custom Round Toggle Switch Component
// //
// type RoundToggleProps = {
//   checked: boolean;
//   onChange: (value: boolean) => void;
//   label?: string;
// };

// function RoundToggle({ checked, onChange, label }: RoundToggleProps) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//       {label && <span style={{ fontWeight: "bold" }}>{label}</span>}
//       <button
//         type="button"
//         onClick={() => onChange(!checked)}
//         style={{
//           width: "40px",
//           height: "20px",
//           borderRadius: "10px",
//           border: "none",
//           backgroundColor: checked ? "#22c55e" : "#ccc",
//           position: "relative",
//           cursor: "pointer",
//           outline: "none",
//           transition: "background-color 0.2s ease",
//         }}
//       >
//         <div
//           style={{
//             width: "18px",
//             height: "18px",
//             borderRadius: "50%",
//             backgroundColor: "#fff",
//             position: "absolute",
//             top: "1px",
//             left: checked ? "20px" : "1px",
//             transition: "left 0.2s ease",
//           }}
//         />
//       </button>
//     </div>
//   );
// }

// //
// // Dashboard Component
// //
// export default function Dashboard() {
//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//   } = useLoaderData<LoaderData>();

//   const fetcher = useFetcher();
//   const submit = useSubmit();

//   // Basic states
//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd"),
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [loading, setLoading] = useState(false);
//   const [filterType, setFilterType] = useState("All");
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//   const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

//   // Email modals
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
//   const [confirmationData, setConfirmationData] = useState<any[]>([]);
//   const [previewModalOpen, setPreviewModalOpen] = useState(false);

//   // Chart data
//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState<any[]>([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
//   const [topReasons, setTopReasons] = useState<any[]>([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   // Page size
//   const [pageSize, setPageSize] = useState("20");

//   // Sorting "Is Refunded"
//   const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(
//     undefined,
//   );
//   const [sortDirection, setSortDirection] = useState<
//     "ascending" | "descending" | undefined
//   >(undefined);

//   // Advanced product filtering using custom checkbox dropdowns.
//   const [includeProducts, setIncludeProducts] = useState<string[]>([]);
//   const [excludeProducts, setExcludeProducts] = useState<string[]>([]);

//   // Toggle for advanced product filters.
//   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

//   const handleToggle = () => {
//     setShowAdvancedFilters((prev) => !prev);
//   };

//   // Clear Filter button handler.
//   const handleClearFilters = () => {
//     setIncludeProducts([]);
//     setExcludeProducts([]);
//   };

//   // Compute dynamic product options from allOrders data.
//   const dynamicProductOptions = useMemo(() => {
//     const prodSet = new Set<string>();
//     allOrders.forEach((order) => {
//       order.orderedProducts.split(",").forEach((prod) => {
//         const trimmed = prod.trim();
//         if (trimmed) prodSet.add(trimmed);
//       });
//     });
//     return Array.from(prodSet).map((product) => ({
//       value: product,
//       label: product,
//     }));
//   }, [allOrders]);

//   // On mount, read pageSize from URL if present.
//   useEffect(() => {
//     const url = new URL(window.location.href);
//     const ps = url.searchParams.get("pageSize") || "20";
//     setPageSize(ps);
//   }, []);

//   // Chart fetch logic.
//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount: newRefundAmt,
//         totalProfit: newProfit,
//         chartData,
//         topReasons: reasons,
//         topRefundedProducts: refundedProds,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(newRefundAmt);
//       setChartProfit(newProfit);
//       setChartMainData(chartData);
//       setTopReasons(reasons);
//       setTopRefundedProducts(refundedProds);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   // Date filter submission.
//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     setLoading(true);
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Step 1: Build base filtered orders from filterType and searchQuery.
//   let baseFilteredOrders = (searchQuery ? allOrders : ordersTableData)
//     .filter((order) => {
//       if (filterType === "Refunded") return order.isRefunded === "Yes";
//       if (filterType === "Non-Refunded") return order.isRefunded === "No";
//       if (filterType === "Shipped") {
//         return (
//           order.shippingStatus === "Confirmed" ||
//           order.shippingStatus === "In Transit" ||
//           order.shippingStatus === "Out Of Delivery" ||
//           order.shippingStatus === "Out for Delivery" ||
//           order.shippingStatus === "Delivered" ||
//           order.shippingStatus === "Shipped-Unknown Status" ||
//           order.shippingStatus === "success"
//         );
//       }
//       if (filterType === "Non-Shipped") {
//         return !(
//           order.shippingStatus === "Confirmed" ||
//           order.shippingStatus === "In Transit" ||
//           order.shippingStatus === "Out Of Delivery" ||
//           order.shippingStatus === "Out for Delivery" ||
//           order.shippingStatus === "Delivered" ||
//           order.shippingStatus === "Shipped-Unknown Status" ||
//           order.shippingStatus === "success"
//         );
//       }
//       return true;
//     })
//     .filter((order) => {
//       if (!searchQuery) return true;
//       const queries = searchQuery
//         .split(",")
//         .map((q) => q.trim().toLowerCase())
//         .filter(Boolean);
//       if (!queries.length) return true;
//       return queries.some((q) => order.orderNumber.toLowerCase().includes(q));
//     });

//   // Step 2: Apply advanced product filters (using custom dropdown values) if toggled.
//   if (showAdvancedFilters) {
//     if (includeProducts.length > 0) {
//       baseFilteredOrders = baseFilteredOrders.filter((ord) => {
//         const lineStr = ord.orderedProducts.toLowerCase();
//         return includeProducts.some((inc) =>
//           lineStr.includes(inc.toLowerCase()),
//         );
//       });
//     }
//     if (excludeProducts.length > 0) {
//       baseFilteredOrders = baseFilteredOrders.filter((ord) => {
//         const lineStr = ord.orderedProducts.toLowerCase();
//         return !excludeProducts.some((exc) =>
//           lineStr.includes(exc.toLowerCase()),
//         );
//       });
//     }
//   }

//   // Step 3: Sorting for "Is Refunded" if allowed.
//   const canSortRefunded =
//     filterType === "All" ||
//     filterType === "Shipped" ||
//     filterType === "Non-Shipped";
//   let finalOrders = [...baseFilteredOrders];
//   if (canSortRefunded && sortColumnIndex === 8 && sortDirection) {
//     finalOrders.sort((a, b) => {
//       const aVal = a.isRefunded === "Yes" ? 1 : 0;
//       const bVal = b.isRefunded === "Yes" ? 1 : 0;
//       return sortDirection === "ascending" ? aVal - bVal : bVal - aVal;
//     });
//   }

//   // Expand/collapse.
//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({ ...prev, [orderNumber]: !prev[orderNumber] }));
//   };

//   // Checkbox handlers.
//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prev) =>
//       prev.includes(orderNumber)
//         ? prev.filter((id) => id !== orderNumber)
//         : [...prev, orderNumber],
//     );
//   };

//   const handleSelectAllChange = (evt: any) => {
//     if (evt.target.checked) {
//       const allNums = finalOrders.map((ord) => ord.orderNumber);
//       setSelectedOrders(allNums);
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   // Prepare table rows.
//   const getFormattedRows = () => {
//     const rows: (string | JSX.Element)[][] = [];
//     finalOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ").filter(Boolean);
//       const multi = productTitles.length > 1;
//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         order.orderNumber,
//         order.orderDate,
//         order.shippingStatus || "N/A",
//         order.shippingLastUpdated || "N/A",
//         order.customerName,
//         order.customerEmail,
//         multi ? (
//           <div
//             style={{
//               cursor: "pointer",
//               color: "blue",
//               textDecoration: "underline",
//             }}
//             onClick={() => toggleRowExpansion(order.orderNumber)}
//           >
//             {productTitles[0]} (+{productTitles.length - 1} more)
//           </div>
//         ) : (
//           productTitles[0] || "N/A"
//         ),
//         order.isRefunded,
//         order.orderAmount,
//       ]);
//       if (expandedRows[order.orderNumber] && multi) {
//         productTitles.slice(1).forEach((t) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: 20 }}>{t}</div>,
//             "",
//             "",
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   // Table column headings.
//   const isRefundedHeading = (
//     <Text as="span" variant="bodyMd" fontWeight="semibold">
//       Is Refunded
//     </Text>
//   );
//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === finalOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     isRefundedHeading,
//     "Order Amount",
//   ];

//   // Filter button handler.
//   const changeFilter = (fType: string) => {
//     setLoading(true);
//     setFilterType(fType);
//     if (fType === "Refunded" || fType === "Non-Refunded") {
//       setSortColumnIndex(undefined);
//       setSortDirection(undefined);
//     }
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Pagination handlers.
//   const goToPage = (p: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", p.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   const changePageSize = (value: string) => {
//     setLoading(true);
//     setPageSize(value);
//     const url = new URL(window.location.href);
//     url.searchParams.set("pageSize", value);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   // Prepare orders for preview modal.
//   const previewOrders: OrderPreview[] = useMemo(() => {
//     return selectedOrders
//       .map((num) => allOrders.find((o) => o.orderNumber === num))
//       .filter(Boolean) as OrderPreview[];
//   }, [selectedOrders, allOrders]);

//   // When the user clicks "Send Email", show the preview modal.
//   const handleSendEmail = () => {
//     const enriched = selectedOrders
//       .map((num) => allOrders.find((o) => o.orderNumber === num))
//       .filter(Boolean);
//     if (!enriched.length) {
//       setNoUserEmail("No valid emails found in the selected orders.");
//       return;
//     }
//     setPreviewModalOpen(true);
//   };

//   // When the user confirms in the preview modal, close it and open the EmailModal.
//   const handleConfirmFinalSend = () => {
//     setPreviewModalOpen(false);
//     // If preventing duplicate emails, filter out duplicates.
//     let ordersToSend = previewOrders;
//     if (preventDuplicates) {
//       const seen = new Set();
//       ordersToSend = ordersToSend.filter((order) => {
//         if (seen.has(order.customerEmail)) return false;
//         seen.add(order.customerEmail);
//         return true;
//       });
//     }
//     setSelectedOrders(ordersToSend.map((o) => o.orderNumber));
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   const sendEmailsToCustomers = async (templateData: any) => {
//     const { subject, bodyHtml, bodyText } = templateData;
//     let ordersToSend = previewOrders;
//     if (preventDuplicates) {
//       const seen = new Set();
//       ordersToSend = ordersToSend.filter((order) => {
//         if (seen.has(order.customerEmail)) return false;
//         seen.add(order.customerEmail);
//         return true;
//       });
//     }
//     const results: any[] = [];
//     for (let i = 0; i < ordersToSend.length; i++) {
//       const order = ordersToSend[i];
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;
//       try {
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });
//         if (!response.ok) {
//           const errData = await response.json();
//           setToastMessage(errData.error || "Error sending email.");
//           setActiveToast(true);
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Error",
//           });
//         } else {
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Delivered",
//           });
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage(
//           "An unexpected error occurred while sending the email.",
//         );
//         setActiveToast(true);
//         results.push({
//           sNo: i + 1,
//           dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//           customerName,
//           customerEmail: toAddress,
//           orderNumber: orderId,
//           status: "Error",
//         });
//       }
//     }
//     setIsModalOpen(false);
//     setConfirmationData(results);
//     setIsConfirmationModalOpen(true);
//   };

//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [
//           totalShippedOrdersCount,
//           totalRefundedOrdersCount,
//           totalUnfulfilledOrdersCount,
//         ],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4,
//       },
//     ],
//   };
//   const barData = {
//     labels: ["Total Sales", "Refunded"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount],
//       },
//     ],
//   };
//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" as const },
//       title: { display: true, text: "Sales vs. Refund" },
//     },
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner" />
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}
//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         {noUserEmail && (
//           <Banner status="critical" title="Error">
//             <p>{noUserEmail}</p>
//           </Banner>
//         )}
//         <Layout>
//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Left side: date filters & charts */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
//                   }}
//                 >
//                   {/* Date Filter Card */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(val) => setStartDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(val) => setEndDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px",
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
//                     <Button onClick={() => setDateRange(30)}>
//                       Last 30 Days
//                     </Button>
//                     <Button onClick={() => setDateRange(60)}>
//                       Last 60 Days
//                     </Button>
//                   </div>
//                   {/* Summary + Charts */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px",
//                     }}
//                   >
//                     <Card
//                       sectioned
//                       style={{ padding: "16px", borderRadius: "12px" }}
//                     >
//                       <div style={{ marginBottom: "20px" }}>
//                         <Text variant="headingLg">Summary</Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>
//                             💰
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)}{" "}
//                             {currencyCode}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>
//                             📦
//                           </span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>
//                             🚚
//                           </span>
//                           <Text variant="bodyMd">
//                             Shipped: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>
//                             🔄
//                           </span>
//                           <Text variant="bodyMd">
//                             Refunded: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "12px",
//                           }}
//                         >
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>
//                             ❗
//                           </span>
//                           <Text variant="bodyMd">
//                             Unfulfilled: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns:
//                           "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px",
//                       }}
//                     >
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Doughnut data={doughnutData} />
//                         </div>
//                       </Card>
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text
//                           variant="headingMd"
//                           style={{ marginBottom: "8px" }}
//                         >
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar data={barData} options={barOptions} />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>
//               {/* Right Panel: Orders Table */}
//               <Layout.Section>
//                 {selectedOrders.length > 0 && (
//                   <div
//                     onClick={handleSendEmail}
//                     style={{
//                       cursor: "pointer",
//                       backgroundColor: "#28a745",
//                       color: "white",
//                       borderRadius: "15px",
//                       margin: "20px 50px",
//                     }}
//                   >
//                     <p
//                       style={{
//                         textAlign: "center",
//                         fontSize: "30px",
//                         padding: "10px",
//                       }}
//                     >
//                       Send Email
//                     </p>
//                   </div>
//                 )}
//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />
//                 <EmailConfirmationModal
//                   isOpen={isConfirmationModalOpen}
//                   onClose={() => setIsConfirmationModalOpen(false)}
//                   data={confirmationData}
//                 />
//                 <EmailPreviewModal
//                   isOpen={previewModalOpen}
//                   orders={previewOrders}
//                   onClose={() => setPreviewModalOpen(false)}
//                   onConfirm={handleConfirmFinalSend}
//                 />
//                 <div
//                   style={{
//                     width: "100%",
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "10px",
//                   }}
//                 >
//                   {/* Filter Buttons */}
//                   <Card sectioned>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "center",
//                         gap: "30px",
//                       }}
//                     >
//                       <Button
//                         onClick={() => changeFilter("All")}
//                         primary={filterType === "All"}
//                         disabled={loading}
//                       >
//                         All Orders
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Refunded")}
//                         primary={filterType === "Refunded"}
//                         disabled={loading}
//                       >
//                         Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Refunded")}
//                         primary={filterType === "Non-Refunded"}
//                         disabled={loading}
//                       >
//                         Non-Refunded
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Shipped")}
//                         primary={filterType === "Shipped"}
//                         disabled={loading}
//                       >
//                         Shipped
//                       </Button>
//                       <Button
//                         onClick={() => changeFilter("Non-Shipped")}
//                         primary={filterType === "Non-Shipped"}
//                         disabled={loading}
//                       >
//                         Non-Shipped
//                       </Button>
//                     </div>
//                   </Card>
//                   {/* Basic search bar */}
//                   <div
//                     style={{
//                       display: "flex",
//                       width: "100%",
//                       justifyContent: "center",
//                       padding: "16px",
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: "100%",
//                         backgroundColor: "#ffffff",
//                         borderRadius: "12px",
//                         boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
//                         padding: "20px",
//                       }}
//                     >
//                       <label
//                         style={{
//                           display: "block",
//                           fontSize: "14px",
//                           fontWeight: "600",
//                           marginBottom: "6px",
//                           color: "#333",
//                         }}
//                       >
//                         Search Orders
//                       </label>
//                       <input
//                         type="text"
//                         value={searchQuery}
//                         onChange={(e) => {
//                           // If the input does not contain a comma but does contain "#", insert commas.
//                           let input = e.target.value;
//                           if (
//                             input.indexOf(",") === -1 &&
//                             input.indexOf("#") !== -1
//                           ) {
//                             // Preserve the first '#' and add a comma before every subsequent '#'
//                             if (input.charAt(0) === "#") {
//                               input =
//                                 "#" + input.substring(1).replace(/#/g, ",#");
//                             } else {
//                               input = input.replace(/#/g, ",#");
//                               if (input.startsWith(",")) {
//                                 input = input.substring(1);
//                               }
//                             }
//                             // Remove trailing comma if present
//                             if (input.endsWith(",")) {
//                               input = input.slice(0, -1);
//                             }
//                           }
//                           setSearchQuery(input);
//                         }}
//                         placeholder="Search by order #, name, or product"
//                         style={{
//                           width: "100%",
//                           padding: "12px",
//                           border: "1px solid #ccc",
//                           borderRadius: "8px",
//                           fontSize: "16px",
//                           outline: "none",
//                           transition: "border-color 0.2s ease-in-out",
//                         }}
//                         onFocus={(e) =>
//                           (e.target.style.borderColor = "#2563EB")
//                         }
//                         onBlur={(e) => (e.target.style.borderColor = "#ccc")}
//                       />

//                       {/* Advanced Filter Toggle with Clear Filter Button */}
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           margin: "30px 10px 10px 10px",
//                           gap: "20px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: "8px",
//                           }}
//                         >
//                           <label
//                             style={{
//                               display: "block",
//                               fontSize: "14px",
//                               fontWeight: "600",
//                               color: "#333",
//                             }}
//                           >
//                             Advanced Filter
//                           </label>
//                           <div
//                             onClick={() => handleToggle()}
//                             style={{
//                               width: "70px",
//                               height: "35px",
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               borderRadius: "35px",
//                               cursor: "pointer",
//                               transition: "all 0.3s ease-in-out",
//                             }}
//                           >
//                             <div
//                               style={{
//                                 fontSize: "50px",
//                                 fontWeight: "bold",
//                                 width: "30px",
//                               }}
//                             >
//                               {showAdvancedFilters ? (
//                                 <div style={{ color: "green" }}>
//                                   <MdToggleOn />
//                                 </div>
//                               ) : (
//                                 <div style={{ color: "black" }}>
//                                   <MdToggleOff />
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                         <div
//                           style={{
//                             fontSize: "20px",
//                             cursor: "pointer", // Make the icon appear clickable
//                             display: "flex",
//                             alignItems: "center",
//                           }}
//                           onClick={handleClearFilters}
//                           title="Clear Products" // Hover text
//                         >
//                           <FiRefreshCcw />
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* ADVANCED PRODUCT FILTERS: Using custom checkbox dropdowns with search */}
//                   {showAdvancedFilters && (
//                     <div
//                       style={{
//                         width: "100%",
//                         padding: "16px",
//                         marginTop: "16px",
//                         backgroundColor: "#ffffff",
//                         borderRadius: "12px",
//                         boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                       }}
//                     >
//                       {/* Product Filtering Section */}
//                       <div
//                         style={{
//                           display: "flex",
//                           flexWrap: "wrap",
//                           gap: "24px",
//                           width: "100%",
//                         }}
//                       >
//                         {/* Include Products */}
//                         <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
//                           <CheckboxDropdown
//                             label="Include Products"
//                             options={dynamicProductOptions}
//                             selected={includeProducts}
//                             onChange={setIncludeProducts}
//                             helpText="If an order contains at least one of these items, it is included."
//                           />
//                         </div>
//                         {/* Exclude Products */}
//                         <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
//                           <CheckboxDropdown
//                             label="Exclude Products"
//                             options={dynamicProductOptions}
//                             selected={excludeProducts}
//                             onChange={setExcludeProducts}
//                             helpText="If an order contains any of these items, it is excluded."
//                           />
//                         </div>
//                       </div>
//                       {/* Show filtering summary on separate lines */}
//                       {includeProducts.length > 0 && (
//                         <p
//                           style={{
//                             marginTop: "12px",
//                             fontSize: "14px",
//                             color: "#4A4A4A",
//                             fontWeight: "500",
//                           }}
//                         >
//                           Include:{" "}
//                           <span style={{ color: "#15803D", fontWeight: "600" }}>
//                             {includeProducts.join(", ")}
//                           </span>
//                         </p>
//                       )}
//                       {excludeProducts.length > 0 && (
//                         <p
//                           style={{
//                             marginTop: "4px",
//                             fontSize: "14px",
//                             color: "#4A4A4A",
//                             fontWeight: "500",
//                           }}
//                         >
//                           Exclude:{" "}
//                           <span style={{ color: "#DC2626", fontWeight: "600" }}>
//                             {excludeProducts.join(", ")}
//                           </span>
//                         </p>
//                       )}
//                     </div>
//                   )}
//                   {/* Orders Table */}
//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         sortable={[
//                           false,
//                           false,
//                           false,
//                           false,
//                           false,
//                           false,
//                           false,
//                           false,
//                           filterType === "All" ||
//                             filterType === "Shipped" ||
//                             filterType === "Non-Shipped",
//                           false,
//                         ]}
//                         onSort={(columnIndex, direction) => {
//                           if (
//                             (filterType === "All" ||
//                               filterType === "Shipped" ||
//                               filterType === "Non-Shipped") &&
//                             columnIndex === 8
//                           ) {
//                             setSortColumnIndex(8);
//                             setSortDirection(direction);
//                           }
//                         }}
//                         sortColumnIndex={sortColumnIndex}
//                         sortDirection={sortDirection}
//                         columnContentTypes={[
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                           "text",
//                         ]}
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         footerContent={`Total Orders: ${finalOrders.length}`}
//                       />
//                     </div>
//                     <div
//                       style={{
//                         width: "15%",
//                         justifySelf: "end",
//                         margin: "10px",
//                       }}
//                     >
//                       <Card sectioned>
//                         <Text variant="headingMd">Records per page:</Text>
//                         <Select
//                           options={[
//                             { label: "20", value: "20" },
//                             { label: "50", value: "50" },
//                             { label: "70", value: "70" },
//                             { label: "100", value: "100" },
//                           ]}
//                           value={pageSize}
//                           onChange={(value) => changePageSize(value)}
//                           disabled={loading}
//                         />
//                       </Card>
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         marginTop: "20px",
//                       }}
//                     >
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(1)}>First</Button>
//                       )}
//                       {currentPage > 1 && (
//                         <Button onClick={() => goToPage(currentPage - 1)}>
//                           Previous
//                         </Button>
//                       )}
//                       <Text variant="bodyMd">
//                         Page {currentPage} of {totalPages}
//                       </Text>
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(currentPage + 1)}>
//                           Next
//                         </Button>
//                       )}
//                       {currentPage < totalPages && (
//                         <Button onClick={() => goToPage(totalPages)}>
//                           Last
//                         </Button>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>
//         {activeToast && (
//           <Toast content={toastMessage} error onDismiss={toggleToast} />
//         )}
//       </Page>
//     </Frame>
//   );
// }


// Feb -7-2025
// Advanced Shipping filter, order# link

// import { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   TextField,
//   Button,
//   Text,
//   DataTable,
//   Banner,
//   Frame,
//   Toast,
//   Select,
//   Modal,
//   Checkbox,
//   Icon,
// } from "@shopify/polaris";
// import { format, subDays, subMonths, differenceInDays } from "date-fns";
// import type { LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { PrismaClient } from "@prisma/client";
// import "../componenets/style.css";
// import { authenticate } from "app/shopify.server";
// import EmailModal from "app/componenets/EmailModal";
// import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
// import { sendEmail } from "./sendEmail";
// import { MdToggleOn, MdToggleOff } from "react-icons/md";
// import { FiRefreshCcw } from "react-icons/fi";

// // React-ChartJS-2 imports
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";
// import EmailPreviewModal from "app/componenets/EmailPreviewModal";

// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title
// );

// const prisma = new PrismaClient();

// type LoaderData = {
//   totalSalesAmount: number;
//   currencyCode: string;
//   totalRefundAmount: number;
//   totalProfit: number;
//   totalRefundedAmount: number;
//   ordersTableData: {
//     orderNumber: string;
//     orderGID: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//     shippingCarrier?: string;
//     trackingNumber?: string;
//     trackingUrl?: string;
//   }[];
//   currentPage: number;
//   totalPages: number;
//   allOrders: {
//     orderNumber: string;
//     orderGID: string;
//     customerName: string;
//     customerEmail: string;
//     orderDate: string;
//     orderedProducts: string;
//     isRefunded: string;
//     orderAmount: string;
//     refundNote: string;
//     shippingStatus?: string;
//     shippingLastUpdated?: string;
//     shippingCarrier?: string;
//     trackingNumber?: string;
//     trackingUrl?: string;
//   }[];
//   totalOrdersCount: number;
//   totalShippedOrdersCount: number;
//   totalRefundedOrdersCount: number;
//   totalUnfulfilledOrdersCount: number;
//   shop: string;
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const startDateParam = url.searchParams.get("startDate");
//   const endDateParam = url.searchParams.get("endDate");
//   const pageParam = url.searchParams.get("page") || "1";
//   const filterType = url.searchParams.get("filterType") || "All";
//   const pageSizeParam = url.searchParams.get("pageSize") || "20";
//   const pageSize = parseInt(pageSizeParam, 10);

//   const page = parseInt(pageParam, 10);
//   const startDate = startDateParam ? new Date(startDateParam) : undefined;
//   const endDate = endDateParam ? new Date(endDateParam) : undefined;

//   let refundedFilter: any = {};
//   if (filterType === "Refunded") {
//     refundedFilter = { refunds: { some: {} } };
//   } else if (filterType === "Non-Refunded") {
//     refundedFilter = { refunds: { none: {} } };
//   } else if (filterType === "Shipped") {
//     refundedFilter = {
//       fulfillmentStatus: {
//         in: [
//           "Confirmed",
//           "In Transit",
//           "Out for Delivery",
//           "Delivered",
//           "Shipped-Unknown Status",
//           "sucess",
//         ],
//       },
//     };
//   } else if (filterType === "Non-Shipped") {
//     refundedFilter = {
//       OR: [
//         {
//           fulfillmentStatus: {
//             notIn: [
//               "Confirmed",
//               "In Transit",
//               "Out for Delivery",
//               "Delivered",
//               "Shipped-Unknown Status",
//               "sucess",
//             ],
//           },
//         },
//         { fulfillmentStatus: null },
//       ],
//     };
//   }

//   const skip = (page - 1) * pageSize;

//   const salesAggregate = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: { shop, createdAt: { gte: startDate, lte: endDate } },
//   });

//   const refundsAggregate = await prisma.refund.aggregate({
//     _sum: { amount: true },
//     where: { order: { shop, createdAt: { gte: startDate, lte: endDate } } },
//   });

//   const allOrdersRaw = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: { gte: startDate, lte: endDate },
//       ...refundedFilter,
//     },
//     include: { lineItems: true, refunds: true },
//     orderBy: { createdAt: "asc" },
//   });

//   const pagedOrders = await prisma.order.findMany({
//     where: {
//       shop,
//       createdAt: { gte: startDate, lte: endDate },
//       ...refundedFilter,
//     },
//     include: { lineItems: true, refunds: true },
//     orderBy: { createdAt: "asc" },
//     skip,
//     take: pageSize,
//   });

//   const mapOrder = (order: any) => {
//     const products = order.lineItems.map((item: any) => item.title).join(", ");
//     const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
//     const refundNote =
//       order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
//     const shippingStatus = order.fulfillmentStatus || "N/A";
//     const shippingLastUpdated = order.fulfillmentLastUpdatedDate
//       ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
//       : "N/A";
//     const shippingCarrier = order.trackingCompany || "N/A";
//     const trackingNumber = order.fulfillmentTrackingNumber || "N/A";
//     const trackingUrl = order.fulfillmentTrackingUrl || "N/A";
//     return {
//       orderNumber: order.name,
//       orderGID: order.id.split("/").pop() || order.id,
//       customerName: `${order.customerFirstName || "N/A"} ${order.customerLastName || "N/A"}`,
//       customerEmail: order.email || "",
//       orderDate: format(order.createdAt, "yyyy-MM-dd"),
//       orderedProducts: products,
//       isRefunded,
//       orderAmount: order.totalPrice.toFixed(2),
//       refundNote,
//       shippingStatus,
//       shippingLastUpdated,
//       shippingCarrier,
//       trackingNumber,
//       trackingUrl,
//     };
//   };

//   const ordersTableData = pagedOrders.map(mapOrder);
//   const allOrdersTableData = allOrdersRaw.map(mapOrder);

//   const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
//   const totalRefundAmount = refundsAggregate._sum.amount || 0;
//   const totalProfit = totalSalesAmount - totalRefundAmount;
//   const totalOrdersCount = allOrdersRaw.length;
//   const shippedStatuses = [
//     "Confirmed",
//     "In Transit",
//     "Out for Delivery",
//     "Delivered",
//   ];
//   const totalShippedOrdersCount = allOrdersRaw.filter((o: any) =>
//     shippedStatuses.includes(o.fulfillmentStatus ?? "")
//   ).length;
//   const totalRefundedOrdersCount = allOrdersRaw.filter(
//     (o: any) => o.refunds.length > 0
//   ).length;
//   const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
//     (o: any) => !shippedStatuses.includes(o.fulfillmentStatus ?? "")
//   ).length;
//   const totalPages = Math.ceil(allOrdersRaw.length / pageSize);

//   return json<LoaderData>({
//     totalSalesAmount,
//     currencyCode: pagedOrders[0]?.currencyCode || "USD",
//     totalRefundAmount,
//     totalProfit,
//     totalRefundedAmount: totalRefundAmount,
//     ordersTableData,
//     currentPage: page,
//     totalPages,
//     allOrders: allOrdersTableData,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//     shop,
//   });
// };

// type CheckboxDropdownProps = {
//   label: string;
//   options: { value: string; label: string }[];
//   selected: string[];
//   onChange: (selected: string[]) => void;
//   helpText?: string;
// };

// function CheckboxDropdown({
//   label,
//   options,
//   selected,
//   onChange,
//   helpText,
// }: CheckboxDropdownProps) {
//   const [open, setOpen] = useState(false);
//   const [searchText, setSearchText] = useState("");
//   const containerRef = useRef<HTMLDivElement>(null);

//   const toggleOpen = () => setOpen((prev) => !prev);

//   const filteredOptions = useMemo(() => {
//     if (!searchText) return options;
//     return options.filter((opt) =>
//       opt.label.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [searchText, options]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         open &&
//         containerRef.current &&
//         !containerRef.current.contains(event.target as Node)
//       ) {
//         setOpen(false);
//       }
//     };
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (open && event.key === "Escape") {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     document.addEventListener("keydown", handleKeyDown);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [open]);

//   return (
//     <div
//       ref={containerRef}
//       style={{ position: "relative", width: "100%", overflow: "visible" }}
//     >
//       <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
//         {label}
//       </label>
//       <button
//         type="button"
//         onClick={toggleOpen}
//         style={{
//           width: "100%",
//           padding: "8px",
//           textAlign: "left",
//           border: "1px solid #ccc",
//           borderRadius: "4px",
//           backgroundColor: "#fff",
//         }}
//       >
//         {selected.length > 0 ? selected.join(", ") : "Select options"}
//       </button>
//       {open && (
//         <div
//           style={{
//             position: "absolute",
//             top: "100%",
//             left: 0,
//             right: 0,
//             border: "1px solid #ccc",
//             borderRadius: "4px",
//             backgroundColor: "#fff",
//             zIndex: 1000,
//             maxHeight: "200px",
//             overflowY: "auto",
//             marginTop: "2px",
//           }}
//         >
//           <div style={{ padding: "4px 8px" }}>
//             <input
//               type="text"
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               placeholder="Search products..."
//               style={{
//                 width: "100%",
//                 padding: "4px",
//                 boxSizing: "border-box",
//                 border: "1px solid #ccc",
//                 borderRadius: "4px",
//               }}
//             />
//           </div>
//           {filteredOptions.length > 0 ? (
//             filteredOptions.map((opt) => (
//               <div key={opt.value} style={{ padding: "4px 8px" }}>
//                 <label style={{ display: "flex", alignItems: "center" }}>
//                   <input
//                     type="checkbox"
//                     checked={selected.includes(opt.value)}
//                     onChange={() => {
//                       if (selected.includes(opt.value)) {
//                         onChange(selected.filter((x) => x !== opt.value));
//                       } else {
//                         onChange([...selected, opt.value]);
//                       }
//                     }}
//                     style={{ marginRight: "8px" }}
//                   />
//                   {opt.label}
//                 </label>
//               </div>
//             ))
//           ) : (
//             <div style={{ padding: "4px 8px" }}>No options found</div>
//           )}
//         </div>
//       )}
//       {helpText && (
//         <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "4px" }}>
//           {helpText}
//         </div>
//       )}
//     </div>
//   );
// }

// type RoundToggleProps = {
//   checked: boolean;
//   onChange: (value: boolean) => void;
//   label?: string;
// };

// function RoundToggle({ checked, onChange, label }: RoundToggleProps) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//       {label && <span style={{ fontWeight: "bold" }}>{label}</span>}
//       <button
//         type="button"
//         onClick={() => onChange(!checked)}
//         style={{
//           width: "40px",
//           height: "20px",
//           borderRadius: "10px",
//           border: "none",
//           backgroundColor: checked ? "#22c55e" : "#ccc",
//           position: "relative",
//           cursor: "pointer",
//           outline: "none",
//           transition: "background-color 0.2s ease",
//         }}
//       >
//         <div
//           style={{
//             width: "18px",
//             height: "18px",
//             borderRadius: "50%",
//             backgroundColor: "#fff",
//             position: "absolute",
//             top: "1px",
//             left: checked ? "20px" : "1px",
//             transition: "left 0.2s ease",
//           }}
//         />
//       </button>
//     </div>
//   );
// }

// export default function Dashboard() {
//   const {
//     currencyCode,
//     totalRefundedAmount,
//     ordersTableData,
//     currentPage,
//     totalPages,
//     totalSalesAmount,
//     totalProfit,
//     totalRefundAmount,
//     allOrders,
//     totalOrdersCount,
//     totalShippedOrdersCount,
//     totalRefundedOrdersCount,
//     totalUnfulfilledOrdersCount,
//     shop,
//   } = useLoaderData<LoaderData>();

//   const fetcher = useFetcher();
//   const submit = useSubmit();
//   const preventDuplicates = false;

//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState(
//     format(subMonths(new Date(), 2), "yyyy-MM-dd")
//   );
//   const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
//   const [loading, setLoading] = useState(false);
//   const [filterType, setFilterType] = useState("All");
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//   const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [noUserEmail, setNoUserEmail] = useState("");
//   const [activeToast, setActiveToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
//   const [confirmationData, setConfirmationData] = useState<any[]>([]);
//   const [previewModalOpen, setPreviewModalOpen] = useState(false);

//   const [chartRefundAmount, setChartRefundAmount] = useState(0);
//   const [chartProfit, setChartProfit] = useState(0);
//   const [chartMainData, setChartMainData] = useState<any[]>([]);
//   const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
//   const [topReasons, setTopReasons] = useState<any[]>([]);
//   const [topRefundedAmount, setTopRefundedAmount] = useState(0);

//   const [pageSize, setPageSize] = useState("20");
//   const [clientPage, setClientPage] = useState(1);

//   const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(undefined);
//   const [sortDirection, setSortDirection] = useState<"ascending" | "descending" | undefined>(undefined);

//   const [includeProducts, setIncludeProducts] = useState<string[]>([]);
//   const [excludeProducts, setExcludeProducts] = useState<string[]>([]);

//   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

//   // Advanced Shipped Filter states (only applicable when filterType is "Shipped")
//   const [advancedShippedStatus, setAdvancedShippedStatus] = useState("");
//   const [inTransitDaysOperator, setInTransitDaysOperator] = useState("=");
//   const [inTransitDays, setInTransitDays] = useState("");

//   const handleToggle = () => {
//     setShowAdvancedFilters((prev) => !prev);
//   };

//   const handleClearFilters = () => {
//     setIncludeProducts([]);
//     setExcludeProducts([]);
//   };

//   const dynamicProductOptions = useMemo(() => {
//     const prodSet = new Set<string>();
//     allOrders.forEach((order) => {
//       order.orderedProducts.split(",").forEach((prod) => {
//         const trimmed = prod.trim();
//         if (trimmed) prodSet.add(trimmed);
//       });
//     });
//     return Array.from(prodSet).map((product) => ({
//       value: product,
//       label: product,
//     }));
//   }, [allOrders]);

//   useEffect(() => {
//     const url = new URL(window.location.href);
//     const ps = url.searchParams.get("pageSize") || "20";
//     setPageSize(ps);
//   }, []);

//   const fetchChartData = () => {
//     setLoading(true);
//     const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
//     fetcher.load(fullUrl);
//   };

//   useEffect(() => {
//     fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (fetcher.data) {
//       const {
//         totalRefundAmount: newRefundAmt,
//         totalProfit: newProfit,
//         chartData,
//         topReasons: reasons,
//         topRefundedProducts: refundedProds,
//         totalRefundAmountFromTopReasons,
//       } = fetcher.data;
//       setChartRefundAmount(newRefundAmt);
//       setChartProfit(newProfit);
//       setChartMainData(chartData);
//       setTopReasons(reasons);
//       setTopRefundedProducts(refundedProds);
//       setTopRefundedAmount(totalRefundAmountFromTopReasons);
//       setLoading(false);
//     }
//   }, [fetcher.data]);

//   useEffect(() => {
//     setLoading(false);
//   }, [allOrders]);

//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();
//     setLoading(true);
//     const formData = new FormData();
//     formData.set("startDate", startDate);
//     formData.set("endDate", endDate);
//     submit(formData, { method: "get" });
//   };

//   const setDateRange = (days: number) => {
//     setLoading(true);
//     const end = new Date();
//     const start = subDays(end, days);
//     setStartDate(format(start, "yyyy-MM-dd"));
//     setEndDate(format(end, "yyyy-MM-dd"));
//     const formData = new FormData();
//     formData.set("startDate", format(start, "yyyy-MM-dd"));
//     formData.set("endDate", format(end, "yyyy-MM-dd"));
//     submit(formData, { method: "get" });
//   };

//   // Determine if filtering (search or advanced filters) is active.
//   const isFilteringActive = Boolean(searchQuery || showAdvancedFilters);

//   // If filtering is active, use the complete orders list (allOrders), otherwise use the paginated orders from the loader.
//   let baseFilteredOrders = isFilteringActive ? allOrders : ordersTableData;

//   // Apply search filter
//   baseFilteredOrders = baseFilteredOrders.filter((order) => {
//     if (!searchQuery) return true;
//     const queries = searchQuery
//       .split(",")
//       .map((q) => q.trim().toLowerCase())
//       .filter(Boolean);
//     if (!queries.length) return true;
//     return queries.some(
//       (q) =>
//         order.orderNumber.toLowerCase().includes(q) ||
//         order.customerName.toLowerCase().includes(q) ||
//         order.orderedProducts.toLowerCase().includes(q)
//     );
//   });

//   // Apply advanced product filters
//   if (showAdvancedFilters) {
//     if (includeProducts.length > 0) {
//       baseFilteredOrders = baseFilteredOrders.filter((ord) => {
//         const lineStr = ord.orderedProducts.toLowerCase();
//         return includeProducts.some((inc) =>
//           lineStr.includes(inc.toLowerCase())
//         );
//       });
//     }
//     if (excludeProducts.length > 0) {
//       baseFilteredOrders = baseFilteredOrders.filter((ord) => {
//         const lineStr = ord.orderedProducts.toLowerCase();
//         return !excludeProducts.some((exc) =>
//           lineStr.includes(exc.toLowerCase())
//         );
//       });
//     }
//   }

//   // Apply advanced shipped filter if active
//   if (filterType === "Shipped" && advancedShippedStatus) {
//     baseFilteredOrders = baseFilteredOrders.filter(
//       (order) => order.shippingStatus === advancedShippedStatus
//     );
//     if (advancedShippedStatus === "In Transit" && inTransitDays) {
//       baseFilteredOrders = baseFilteredOrders.filter((order) => {
//         if (order.shippingLastUpdated === "N/A") return false;
//         const diffDays = differenceInDays(new Date(), new Date(order.shippingLastUpdated));
//         const numDays = parseInt(inTransitDays, 10);
//         if (inTransitDaysOperator === "=") return diffDays === numDays;
//         if (inTransitDaysOperator === ">") return diffDays > numDays;
//         if (inTransitDaysOperator === "<") return diffDays < numDays;
//         return true;
//       });
//     }
//   }

//   // Apply sorting if needed
//   const canSortRefunded =
//     filterType === "All" ||
//     filterType === "Shipped" ||
//     filterType === "Non-Shipped";
//   let sortedOrders = [...baseFilteredOrders];
//   if (canSortRefunded && sortColumnIndex === 8 && sortDirection) {
//     sortedOrders.sort((a, b) => {
//       const aVal = a.isRefunded === "Yes" ? 1 : 0;
//       const bVal = b.isRefunded === "Yes" ? 1 : 0;
//       return sortDirection === "ascending" ? aVal - bVal : bVal - aVal;
//     });
//   }

//   let finalOrders: typeof sortedOrders;
//   const pSize = parseInt(pageSize, 10);
//   const totalFilteredPages = isFilteringActive
//     ? Math.ceil(sortedOrders.length / pSize)
//     : 0;

//   if (isFilteringActive) {
//     const effectivePage = clientPage > totalFilteredPages ? totalFilteredPages || 1 : clientPage;
//     finalOrders = sortedOrders.slice((effectivePage - 1) * pSize, effectivePage * pSize);
//   } else {
//     finalOrders = sortedOrders;
//   }

//   const toggleRowExpansion = (orderNumber: string) => {
//     setExpandedRows((prev) => ({ ...prev, [orderNumber]: !prev[orderNumber] }));
//   };

//   const handleCheckboxChange = (orderNumber: string) => {
//     setSelectedOrders((prev) =>
//       prev.includes(orderNumber)
//         ? prev.filter((id) => id !== orderNumber)
//         : [...prev, orderNumber]
//     );
//   };

//   const handleSelectAllChange = (evt: any) => {
//     if (evt.target.checked) {
//       const allNums = finalOrders.map((ord) => ord.orderNumber);
//       setSelectedOrders(allNums);
//     } else {
//       setSelectedOrders([]);
//     }
//   };

//   const getFormattedRows = () => {
//     const rows: (string | JSX.Element)[][] = [];
//     finalOrders.forEach((order) => {
//       const productTitles = order.orderedProducts.split(", ").filter(Boolean);
//       const multi = productTitles.length > 1;
//       const productCell = multi ? (
//         <div
//           style={{
//             cursor: "pointer",
//             color: "blue",
//             textDecoration: "underline",
//           }}
//           onClick={() => toggleRowExpansion(order.orderNumber)}
//         >
//           {productTitles[0]} (+{productTitles.length - 1} more)
//         </div>
//       ) : (
//         productTitles[0] || "N/A"
//       );
//       rows.push([
//         <input
//           type="checkbox"
//           checked={selectedOrders.includes(order.orderNumber)}
//           onChange={() => handleCheckboxChange(order.orderNumber)}
//         />,
//         <a
//           href={`https://${shop}/admin/orders/${order.orderGID}`}
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           {order.orderNumber}
//         </a>,
//         order.orderDate,
//         order.shippingStatus || "N/A",
//         order.shippingLastUpdated || "N/A",
//         order.customerName,
//         order.customerEmail,
//         productCell,
//         order.isRefunded,
//         order.orderAmount,
//       ]);
//       if (expandedRows[order.orderNumber] && multi) {
//         productTitles.slice(1).forEach((t) => {
//           rows.push([
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             "",
//             <div style={{ paddingLeft: 20 }}>{t}</div>,
//             "",
//             "",
//           ]);
//         });
//       }
//     });
//     return rows;
//   };

//   const isRefundedHeading = (
//     <Text as="span" variant="bodyMd" fontWeight="semibold">
//       Is Refunded
//     </Text>
//   );
//   const columnHeaders = [
//     <input
//       type="checkbox"
//       checked={
//         selectedOrders.length > 0 &&
//         selectedOrders.length === finalOrders.length
//       }
//       onChange={handleSelectAllChange}
//     />,
//     "Order #",
//     "Order Date",
//     "Shipping Status",
//     "Shipping Last Updated",
//     "Customer Name",
//     "Email",
//     "Ordered Products",
//     isRefundedHeading,
//     "Order Amount",
//   ];

//   const displayFilterLabel = () => {
//     if (filterType === "All") return "All Orders";
//     if (filterType === "Refunded") return "Refunded Orders";
//     if (filterType === "Non-Refunded") return "Non-Refunded Orders";
//     if (filterType === "Shipped") {
//       return advancedShippedStatus
//         ? `Shipped Orders - ${advancedShippedStatus} (${finalOrders.filter(
//             (order) => order.shippingStatus === advancedShippedStatus
//           ).length} orders)`
//         : "Shipped Orders";
//     }
//     if (filterType === "Non-Shipped") return "Non-Shipped Orders";
//     return "";
//   };

//   const changeFilter = (fType: string) => {
//     setLoading(true);
//     setFilterType(fType);
//     if (fType === "Refunded" || fType === "Non-Shipped") {
//       setSortColumnIndex(undefined);
//       setSortDirection(undefined);
//     }
//     if (fType !== "Shipped") {
//       setAdvancedShippedStatus("");
//       setInTransitDays("");
//     }
//     const url = new URL(window.location.href);
//     url.searchParams.set("filterType", fType);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   const goToPage = (p: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", p.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   const changePageSize = (value: string) => {
//     setLoading(true);
//     setPageSize(value);
//     const url = new URL(window.location.href);
//     url.searchParams.set("pageSize", value);
//     url.searchParams.set("page", "1");
//     submit(url.searchParams, { method: "get" });
//   };

//   const previewOrders: OrderPreview[] = useMemo(() => {
//     return selectedOrders
//       .map((num) => allOrders.find((o) => o.orderNumber === num))
//       .filter(Boolean) as OrderPreview[];
//   }, [selectedOrders, allOrders]);

//   const handleSendEmail = () => {
//     const enriched = selectedOrders
//       .map((num) => allOrders.find((o) => o.orderNumber === num))
//       .filter(Boolean);
//     if (!enriched.length) {
//       setNoUserEmail("No valid emails found in the selected orders.");
//       return;
//     }
//     setPreviewModalOpen(true);
//   };

//   const handleConfirmFinalSend = () => {
//     setPreviewModalOpen(false);
//     let ordersToSend = previewOrders;
//     if (preventDuplicates) {
//       const seen = new Set();
//       ordersToSend = ordersToSend.filter((order) => {
//         if (seen.has(order.customerEmail)) return false;
//         seen.add(order.customerEmail);
//         return true;
//       });
//     }
//     setSelectedOrders(ordersToSend.map((o) => o.orderNumber));
//     setIsModalOpen(true);
//   };

//   const handleModalClose = () => {
//     setIsModalOpen(false);
//   };

//   const sendEmailsToCustomers = async (templateData: any) => {
//     const { subject, bodyHtml, bodyText } = templateData;
//     let ordersToSend = previewOrders;
//     if (preventDuplicates) {
//       const seen = new Set();
//       ordersToSend = ordersToSend.filter((order) => {
//         if (seen.has(order.customerEmail)) return false;
//         seen.add(order.customerEmail);
//         return true;
//       });
//     }
//     const results: any[] = [];
//     for (let i = 0; i < ordersToSend.length; i++) {
//       const order = ordersToSend[i];
//       const toAddress = order.customerEmail;
//       const orderId = order.orderNumber;
//       const customerName = order.customerName;
//       try {
//         const response = await fetch("/sendEmail", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             toAddresses: [toAddress],
//             subject,
//             bodyHtml,
//             bodyText,
//             orderId,
//             customerName,
//           }),
//         });
//         if (!response.ok) {
//           const errData = await response.json();
//           setToastMessage(errData.error || "Error sending email.");
//           setActiveToast(true);
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Error",
//           });
//         } else {
//           results.push({
//             sNo: i + 1,
//             dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//             customerName,
//             customerEmail: toAddress,
//             orderNumber: orderId,
//             status: "Delivered",
//           });
//         }
//       } catch (error) {
//         console.error("Error sending email:", error);
//         setToastMessage("An unexpected error occurred while sending the email.");
//         setActiveToast(true);
//         results.push({
//           sNo: i + 1,
//           dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
//           customerName,
//           customerEmail: toAddress,
//           orderNumber: orderId,
//           status: "Error",
//         });
//       }
//     }
//     setIsModalOpen(false);
//     setConfirmationData(results);
//     setIsConfirmationModalOpen(true);
//   };

//   const doughnutData = {
//     labels: ["Shipped", "Refunded", "Unfulfilled"],
//     datasets: [
//       {
//         label: "Order Distribution",
//         data: [totalShippedOrdersCount, totalRefundedOrdersCount, totalUnfulfilledOrdersCount],
//         backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
//         hoverOffset: 4,
//       },
//     ],
//   };
//   const barData = {
//     labels: ["Total Sales", "Refunded"],
//     datasets: [
//       {
//         label: "Amount",
//         backgroundColor: ["#4CAF50", "#F44336"],
//         data: [totalSalesAmount, totalRefundAmount],
//       },
//     ],
//   };
//   const barOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" as const },
//       title: { display: true, text: "Sales vs. Refund" },
//     },
//   };

//   return (
//     <Frame>
//       <Page fullWidth title="Notify Rush - Dashboard">
//         {loading && (
//           <div className="loading-overlay">
//             <div className="loading-spinner" />
//             <h1 className="loading-text">Loading...</h1>
//           </div>
//         )}
//         {errorMessage && (
//           <Card sectioned>
//             <Text variant="critical" color="red">
//               {errorMessage}
//             </Text>
//           </Card>
//         )}
//         {noUserEmail && (
//           <Banner status="critical" title="Error">
//             <p>{noUserEmail}</p>
//           </Banner>
//         )}
//         <Layout>
//           <div className="responsive-layout">
//             <div className="flex flex-row">
//               {/* Left side: date filters & charts */}
//               <Layout.Section>
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "32px",
//                     padding: "16px",
//                     backgroundColor: "#f7f9fc",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
//                   }}
//                 >
//                   {/* Date Filter Card */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       padding: "16px",
//                       backgroundColor: "#fff",
//                       borderRadius: "12px",
//                       boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//                     }}
//                   >
//                     <TextField
//                       label="Start Date"
//                       type="date"
//                       value={startDate}
//                       onChange={(val) => setStartDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <TextField
//                       label="End Date"
//                       type="date"
//                       value={endDate}
//                       onChange={(val) => setEndDate(val)}
//                       autoComplete="off"
//                       style={{ flex: "1 1 auto", minWidth: "150px" }}
//                     />
//                     <Button
//                       primary
//                       onClick={handleSubmit}
//                       disabled={loading}
//                       style={{
//                         padding: "12px 20px",
//                         fontWeight: "bold",
//                         fontSize: "16px",
//                       }}
//                     >
//                       Apply
//                     </Button>
//                   </div>
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       justifyContent: "center",
//                       gap: "16px",
//                     }}
//                   >
//                     <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
//                     <Button onClick={() => setDateRange(30)}>Last 30 Days</Button>
//                     <Button onClick={() => setDateRange(60)}>Last 60 Days</Button>
//                   </div>
//                   {/* Summary + Charts */}
//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "1fr",
//                       gap: "32px",
//                     }}
//                   >
//                     <Card
//                       sectioned
//                       style={{ padding: "16px", borderRadius: "12px" }}
//                     >
//                       <div style={{ marginBottom: "20px" }}>
//                         <Text variant="headingLg">Summary</Text>
//                       </div>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns:
//                             "repeat(auto-fit, minmax(150px, 1fr))",
//                           gap: "16px",
//                         }}
//                       >
//                         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                           <span style={{ fontSize: "24px", color: "#2b6cb0" }}>💰</span>
//                           <Text variant="bodyMd">
//                             Total Sales: {totalSalesAmount.toFixed(2)} {currencyCode}
//                           </Text>
//                         </div>
//                         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                           <span style={{ fontSize: "24px", color: "#48bb78" }}>📦</span>
//                           <Text variant="bodyMd">
//                             Total Orders: {totalOrdersCount}
//                           </Text>
//                         </div>
//                         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                           <span style={{ fontSize: "24px", color: "#38a169" }}>🚚</span>
//                           <Text variant="bodyMd">
//                             Shipped: {totalShippedOrdersCount}
//                           </Text>
//                         </div>
//                         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                           <span style={{ fontSize: "24px", color: "#e53e3e" }}>🔄</span>
//                           <Text variant="bodyMd">
//                             Refunded: {totalRefundedOrdersCount}
//                           </Text>
//                         </div>
//                         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                           <span style={{ fontSize: "24px", color: "#dd6b20" }}>❗</span>
//                           <Text variant="bodyMd">
//                             Unfulfilled: {totalUnfulfilledOrdersCount}
//                           </Text>
//                         </div>
//                       </div>
//                     </Card>
//                     <div
//                       style={{
//                         display: "grid",
//                         gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//                         gap: "16px",
//                       }}
//                     >
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text variant="headingMd" style={{ marginBottom: "8px" }}>
//                           Order Distribution
//                         </Text>
//                         <div style={{ height: "300px", width: "100%", display: "flex", justifyContent:"center"  }}>
//                           <Doughnut data={doughnutData} />
//                         </div>
//                       </Card>
//                       <Card
//                         sectioned
//                         style={{ borderRadius: "12px", padding: "16px" }}
//                       >
//                         <Text variant="headingMd" style={{ marginBottom: "8px" }}>
//                           Sales vs. Refund
//                         </Text>
//                         <div style={{ height: "300px", width: "100%" }}>
//                           <Bar data={barData} options={barOptions} />
//                         </div>
//                       </Card>
//                     </div>
//                   </div>
//                 </div>
//               </Layout.Section>
//               {/* Right Panel: Orders Table */}
//               <Layout.Section>
//                 {selectedOrders.length > 0 && (
//                   <div
//                     onClick={handleSendEmail}
//                     style={{
//                       cursor: "pointer",
//                       backgroundColor: "#28a745",
//                       color: "white",
//                       borderRadius: "15px",
//                       margin: "20px 50px",
//                     }}
//                   >
//                     <p style={{ textAlign: "center", fontSize: "30px", padding: "10px" }}>
//                       Send Email
//                     </p>
//                   </div>
//                 )}
//                 <EmailModal
//                   isOpen={isModalOpen}
//                   onClose={handleModalClose}
//                   onSend={(template) => sendEmailsToCustomers(template)}
//                 />
//                 <EmailConfirmationModal
//                   isOpen={isConfirmationModalOpen}
//                   onClose={() => setIsConfirmationModalOpen(false)}
//                   data={confirmationData}
//                 />
//                 <EmailPreviewModal
//                   isOpen={previewModalOpen}
//                   orders={previewOrders}
//                   onClose={() => setPreviewModalOpen(false)}
//                   onConfirm={handleConfirmFinalSend}
//                 />
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "10px",
//                   }}
//                 >
//                   {/* Filter Buttons */}
//                   <Card sectioned>
//                     <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
//                       <Button onClick={() => changeFilter("All")} primary={filterType === "All"} disabled={loading}>
//                         All Orders
//                       </Button>
//                       <Button onClick={() => changeFilter("Refunded")} primary={filterType === "Refunded"} disabled={loading}>
//                         Refunded
//                       </Button>
//                       <Button onClick={() => changeFilter("Non-Refunded")} primary={filterType === "Non-Refunded"} disabled={loading}>
//                         Non-Refunded
//                       </Button>
//                       <Button onClick={() => changeFilter("Shipped")} primary={filterType === "Shipped"} disabled={loading}>
//                         Shipped
//                       </Button>
//                       <Button onClick={() => changeFilter("Non-Shipped")} primary={filterType === "Non-Shipped"} disabled={loading}>
//                         Non-Shipped
//                       </Button>
//                     </div>
//                   </Card>

//                   {/* Display current filter label above table */}
//                   <Card>
//                     <Text as="h1" variant="heading2xl">
//                       {displayFilterLabel()}
//                     </Text>
//                   </Card>

//                   {/* Basic search bar */}
//                   <div
//                     style={{
//                       display: "flex",
//                       width: "100%",
//                       justifyContent: "center",
//                       marginTop: "5px",
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: "100%",
//                         backgroundColor: "#ffffff",
//                         borderRadius: "12px",
//                         boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
//                         padding: "20px",
//                       }}
//                     >
//                       <label
//                         style={{
//                           display: "block",
//                           fontSize: "14px",
//                           fontWeight: "600",
//                           marginBottom: "6px",
//                           color: "#333",
//                         }}
//                       >
//                         Search Orders
//                       </label>
//                       <input
//                         type="text"
//                         value={searchQuery}
//                         onChange={(e) => {
//                           let input = e.target.value;
//                           if (input.indexOf(",") === -1 && input.indexOf("#") !== -1) {
//                             if (input.charAt(0) === "#") {
//                               input = "#" + input.substring(1).replace(/#/g, ",#");
//                             } else {
//                               input = input.replace(/#/g, ",#");
//                               if (input.startsWith(",")) {
//                                 input = input.substring(1);
//                               }
//                             }
//                             if (input.endsWith(",")) {
//                               input = input.slice(0, -1);
//                             }
//                           }
//                           setSearchQuery(input);
//                           setClientPage(1);
//                         }}
//                         placeholder="Search by order #, name, or product"
//                         style={{
//                           width: "100%",
//                           padding: "8px",
//                           border: "1px solid #ccc",
//                           borderRadius: "8px",
//                           fontSize: "16px",
//                           outline: "none",
//                           transition: "border-color 0.2s ease-in-out",
//                         }}
//                         onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
//                         onBlur={(e) => (e.target.style.borderColor = "#ccc")}
//                       />

//                       {/* Advanced Filter Toggle with Clear Filter Button */}
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           margin: "30px 10px 10px 10px",
//                           gap: "20px",
//                         }}
//                       >
//                         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                           <label
//                             style={{
//                               display: "block",
//                               fontSize: "14px",
//                               fontWeight: "600",
//                               color: "#333",
//                             }}
//                           >
//                             Advanced Filter
//                           </label>
//                           <div
//                             onClick={() => handleToggle()}
//                             style={{
//                               width: "70px",
//                               height: "35px",
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               borderRadius: "35px",
//                               cursor: "pointer",
//                               transition: "all 0.3s ease-in-out",
//                             }}
//                           >
//                             <div style={{ fontSize: "50px", fontWeight: "bold", width: "30px" }}>
//                               {showAdvancedFilters ? (
//                                 <div style={{ color: "green" }}>
//                                   <MdToggleOn />
//                                 </div>
//                               ) : (
//                                 <div style={{ color: "black" }}>
//                                   <MdToggleOff />
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                         <div
//                           style={{
//                             fontSize: "20px",
//                             cursor: "pointer",
//                             display: "flex",
//                             alignItems: "center",
//                           }}
//                           onClick={handleClearFilters}
//                           title="Clear Products"
//                         >
//                           <FiRefreshCcw />
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Advanced Filters */}
//                   {showAdvancedFilters && (
//                     <div>
//                       {filterType === "Shipped" && (
//                         <Card>
//                           <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//                             <h2 style={{ fontWeight: "600" }}>Advanced Shipped Filter</h2>
//                             <Select
//                               label="Shipping Status"
//                               options={[
//                                 { label: "Confirmed", value: "Confirmed" },
//                                 { label: "In Transit", value: "In Transit" },
//                                 { label: "Out for Delivery", value: "Out for Delivery" },
//                                 { label: "Delivered", value: "Delivered" },
//                                 { label: "Shipped-Unknown Status", value: "Shipped-Unknown Status" },
//                                 { label: "sucess", value: "sucess" },
//                               ]}
//                               value={advancedShippedStatus}
//                               onChange={setAdvancedShippedStatus}
//                             />
//                             {advancedShippedStatus === "In Transit" && (
//                               <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
//                                 <Select
//                                   label="Condition"
//                                   options={[
//                                     { label: "=", value: "=" },
//                                     { label: ">", value: ">" },
//                                     { label: "<", value: "<" },
//                                   ]}
//                                   value={inTransitDaysOperator}
//                                   onChange={setInTransitDaysOperator}
//                                 />
//                                 <TextField
//                                   label="Days"
//                                   type="number"
//                                   value={inTransitDays}
//                                   onChange={setInTransitDays}
//                                   autoComplete="off"
//                                 />
//                               </div>
//                             )}
//                           </div>
//                         </Card>
//                       )}
//                       <div
//                         style={{
//                           width: "100%",
//                           padding: "16px",
//                           marginTop: "16px",
//                           backgroundColor: "#ffffff",
//                           borderRadius: "12px",
//                           boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             flexWrap: "wrap",
//                             gap: "24px",
//                             width: "100%",
//                           }}
//                         >
//                           <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
//                             <CheckboxDropdown
//                               label="Include Products"
//                               options={dynamicProductOptions}
//                               selected={includeProducts}
//                               onChange={setIncludeProducts}
//                               helpText="If an order contains at least one of these items, it is included."
//                             />
//                           </div>
//                           <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
//                             <CheckboxDropdown
//                               label="Exclude Products"
//                               options={dynamicProductOptions}
//                               selected={excludeProducts}
//                               onChange={setExcludeProducts}
//                               helpText="If an order contains any of these items, it is excluded."
//                             />
//                           </div>
//                         </div>
//                         {includeProducts.length > 0 && (
//                           <p
//                             style={{
//                               marginTop: "12px",
//                               fontSize: "14px",
//                               color: "#4A4A4A",
//                               fontWeight: "500",
//                             }}
//                           >
//                             Include:{" "}
//                             <span style={{ color: "#15803D", fontWeight: "600" }}>
//                               {includeProducts.join(", ")}
//                             </span>
//                           </p>
//                         )}
//                         {excludeProducts.length > 0 && (
//                           <p
//                             style={{
//                               marginTop: "4px",
//                               fontSize: "14px",
//                               color: "#4A4A4A",
//                               fontWeight: "500",
//                             }}
//                           >
//                             Exclude:{" "}
//                             <span style={{ color: "#DC2626", fontWeight: "600" }}>
//                               {excludeProducts.join(", ")}
//                             </span>
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {/* Orders Table */}
//                   <Card title="Order Details">
//                     <div className="custom-data-table">
//                       <DataTable
//                         sortable={[
//                           true,
//                           false,
//                           false,
//                           false,
//                           false,
//                           false,
//                           false,
//                           false,
//                           filterType === "All" ||
//                             filterType === "Shipped" ||
//                             filterType === "Non-Shipped",
//                           false,
//                         ]}
//                         onSort={(columnIndex, direction) => {
//                           if (
//                             (filterType === "All" ||
//                               filterType === "Shipped" ||
//                               filterType === "Non-Shipped") &&
//                             columnIndex === 8
//                           ) {
//                             setSortColumnIndex(8);
//                             setSortDirection(direction);
//                           }
//                         }}
//                         sortColumnIndex={sortColumnIndex}
//                         sortDirection={sortDirection}
//                         columnContentTypes={
//                           filterType === "Shipped"
//                             ? ["text", "text", "text", "text", "text", "text", "text", "text", "text", "text"]
//                             : ["text", "text", "text", "text", "text", "text", "text", "text", "text", "text"]
//                         }
//                         headings={columnHeaders}
//                         rows={getFormattedRows()}
//                         footerContent={`Total Orders: ${isFilteringActive ? sortedOrders.length : finalOrders.length}`}
//                       />
//                     </div>
//                     {/* Pagination and Records per Page at the Bottom */}
//                     {isFilteringActive ? (
//                       <div
//                         style={{
//                           display: "flex",
//                           flexDirection: "column",
//                           gap: "10px",
//                           marginTop: "20px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                           }}
//                         >
//                           {clientPage > 1 && (
//                             <Button onClick={() => setClientPage(1)}>First</Button>
//                           )}
//                           {clientPage > 1 && (
//                             <Button onClick={() => setClientPage(clientPage - 1)}>
//                               Previous
//                             </Button>
//                           )}
//                           <Text variant="bodyMd">
//                             Page {clientPage} of {totalFilteredPages}
//                           </Text>
//                           {clientPage < totalFilteredPages && (
//                             <Button onClick={() => setClientPage(clientPage + 1)}>
//                               Next
//                             </Button>
//                           )}
//                           {clientPage < totalFilteredPages && (
//                             <Button onClick={() => setClientPage(totalFilteredPages)}>
//                               Last
//                             </Button>
//                           )}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "flex-end",
//                             marginTop: "10px",
//                           }}
//                         >
//                           <Card sectioned>
//                             <Text variant="headingMd">Records per page:</Text>
//                             <Select
//                               options={[
//                                 { label: "20", value: "20" },
//                                 { label: "50", value: "50" },
//                                 { label: "70", value: "70" },
//                                 { label: "100", value: "100" },
//                               ]}
//                               value={pageSize}
//                               onChange={(value) => changePageSize(value)}
//                               disabled={loading}
//                             />
//                           </Card>
//                         </div>
//                       </div>
//                     ) : (
//                       <div
//                         style={{
//                           display: "flex",
//                           flexDirection: "column",
//                           gap: "10px",
//                           marginTop: "20px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                           }}
//                         >
//                           {currentPage > 1 && (
//                             <Button onClick={() => goToPage(1)}>First</Button>
//                           )}
//                           {currentPage > 1 && (
//                             <Button onClick={() => goToPage(currentPage - 1)}>
//                               Previous
//                             </Button>
//                           )}
//                           <Text variant="bodyMd">
//                             Page {currentPage} of {totalPages}
//                           </Text>
//                           {currentPage < totalPages && (
//                             <Button onClick={() => goToPage(currentPage + 1)}>
//                               Next
//                             </Button>
//                           )}
//                           {currentPage < totalPages && (
//                             <Button onClick={() => goToPage(totalPages)}>
//                               Last
//                             </Button>
//                           )}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "flex-end",
//                             marginTop: "10px",
//                           }}
//                         >
//                           <Card sectioned>
//                             <Text variant="headingMd">Records per page:</Text>
//                             <Select
//                               options={[
//                                 { label: "20", value: "20" },
//                                 { label: "50", value: "50" },
//                                 { label: "70", value: "70" },
//                                 { label: "100", value: "100" },
//                               ]}
//                               value={pageSize}
//                               onChange={(value) => changePageSize(value)}
//                               disabled={loading}
//                             />
//                           </Card>
//                         </div>
//                       </div>
//                     )}
//                   </Card>
//                 </div>
//               </Layout.Section>
//             </div>
//           </div>
//         </Layout>
//         {activeToast && (
//           <Toast content={toastMessage} error onDismiss={toggleToast} />
//         )}
//       </Page>
//     </Frame>
//   );
// }


// March 26 2025
// Dashboard with order tag filter

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Text,
  DataTable,
  Banner,
  Frame,
  Toast,
  Select,
} from "@shopify/polaris";
import { format, subDays, subMonths, differenceInDays } from "date-fns";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import "../componenets/style.css";
import { authenticate } from "app/shopify.server";
import EmailModal from "app/componenets/EmailModal";
import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
import { sendEmail } from "./sendEmail";
import { MdToggleOn, MdToggleOff } from "react-icons/md";
import { FiRefreshCcw } from "react-icons/fi";

// React-ChartJS-2 imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import EmailPreviewModal from "app/componenets/EmailPreviewModal";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const prisma = new PrismaClient();

type LoaderData = {
  totalSalesAmount: number;
  currencyCode: string;
  totalRefundAmount: number;
  totalProfit: number;
  totalRefundedAmount: number;
  ordersTableData: {
    orderNumber: string;
    orderGID: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    orderedProducts: string;
    isRefunded: string;
    orderAmount: string;
    refundNote: string;
    shippingStatus?: string;
    shippingLastUpdated?: string;
    shippingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    tags?: string; // still in data, but NOT displayed in table
  }[];
  currentPage: number;
  totalPages: number;
  allOrders: {
    orderNumber: string;
    orderGID: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    orderedProducts: string;
    isRefunded: string;
    orderAmount: string;
    refundNote: string;
    shippingStatus?: string;
    shippingLastUpdated?: string;
    shippingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    tags?: string;
  }[];
  totalOrdersCount: number;
  totalShippedOrdersCount: number;
  totalRefundedOrdersCount: number;
  totalUnfulfilledOrdersCount: number;
  shop: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const pageParam = url.searchParams.get("page") || "1";
  const filterType = url.searchParams.get("filterType") || "All";
  const pageSizeParam = url.searchParams.get("pageSize") || "20";
  const pageSize = parseInt(pageSizeParam, 10);

  const page = parseInt(pageParam, 10);
  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDate = endDateParam ? new Date(endDateParam) : undefined;

  let refundedFilter: any = {};
  if (filterType === "Refunded") {
    refundedFilter = { refunds: { some: {} } };
  } else if (filterType === "Non-Refunded") {
    refundedFilter = { refunds: { none: {} } };
  } else if (filterType === "Shipped") {
    refundedFilter = {
      fulfillmentStatus: {
        in: [
          "Confirmed",
          "In Transit",
          "Out for Delivery",
          "Delivered",
          "Shipped-Unknown Status",
          "sucess",
        ],
      },
    };
  } else if (filterType === "Non-Shipped") {
    refundedFilter = {
      OR: [
        {
          fulfillmentStatus: {
            notIn: [
              "Confirmed",
              "In Transit",
              "Out for Delivery",
              "Delivered",
              "Shipped-Unknown Status",
              "sucess",
            ],
          },
        },
        { fulfillmentStatus: null },
      ],
    };
  }

  const skip = (page - 1) * pageSize;

  const salesAggregate = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { shop, createdAt: { gte: startDate, lte: endDate } },
  });

  const refundsAggregate = await prisma.refund.aggregate({
    _sum: { amount: true },
    where: { order: { shop, createdAt: { gte: startDate, lte: endDate } } },
  });

  const allOrdersRaw = await prisma.order.findMany({
    where: {
      shop,
      createdAt: { gte: startDate, lte: endDate },
      ...refundedFilter,
    },
    include: { lineItems: true, refunds: true },
    orderBy: { createdAt: "asc" },
  });

  const pagedOrders = await prisma.order.findMany({
    where: {
      shop,
      createdAt: { gte: startDate, lte: endDate },
      ...refundedFilter,
    },
    include: { lineItems: true, refunds: true },
    orderBy: { createdAt: "asc" },
    skip,
    take: pageSize,
  });

  const mapOrder = (order: any) => {
    const products = order.lineItems.map((item: any) => item.title).join(", ");
    const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
    const refundNote =
      order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
    const shippingStatus = order.fulfillmentStatus || "N/A";
    const shippingLastUpdated = order.fulfillmentLastUpdatedDate
      ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
      : "N/A";
    const shippingCarrier = order.trackingCompany || "N/A";
    const trackingNumber = order.fulfillmentTrackingNumber || "N/A";
    const trackingUrl = order.fulfillmentTrackingUrl || "N/A";

    // Combine array of tags into a comma-separated string or "N/A"
    const tagsStr =
      order.tags && order.tags.length > 0 ? order.tags.join(", ") : "N/A";

    return {
      orderNumber: order.name,
      orderGID: order.id.split("/").pop() || order.id,
      customerName: `${order.customerFirstName || "N/A"} ${
        order.customerLastName || "N/A"
      }`,
      customerEmail: order.email || "",
      orderDate: format(order.createdAt, "yyyy-MM-dd"),
      orderedProducts: products,
      isRefunded,
      orderAmount: order.totalPrice.toFixed(2),
      refundNote,
      shippingStatus,
      shippingLastUpdated,
      shippingCarrier,
      trackingNumber,
      trackingUrl,
      tags: tagsStr,
    };
  };

  const ordersTableData = pagedOrders.map(mapOrder);
  const allOrdersTableData = allOrdersRaw.map(mapOrder);

  const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
  const totalRefundAmount = refundsAggregate._sum.amount || 0;
  const totalProfit = totalSalesAmount - totalRefundAmount;
  const totalOrdersCount = allOrdersRaw.length;
  const shippedStatuses = [
    "Confirmed",
    "In Transit",
    "Out for Delivery",
    "Delivered",
  ];
  const totalShippedOrdersCount = allOrdersRaw.filter((o: any) =>
    shippedStatuses.includes(o.fulfillmentStatus ?? "")
  ).length;
  const totalRefundedOrdersCount = allOrdersRaw.filter(
    (o: any) => o.refunds.length > 0
  ).length;
  const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
    (o: any) => !shippedStatuses.includes(o.fulfillmentStatus ?? "")
  ).length;
  const totalPages = Math.ceil(allOrdersRaw.length / pageSize);

  return json<LoaderData>({
    totalSalesAmount,
    currencyCode: pagedOrders[0]?.currencyCode || "USD",
    totalRefundAmount,
    totalProfit,
    totalRefundedAmount: totalRefundAmount,
    ordersTableData,
    currentPage: page,
    totalPages,
    allOrders: allOrdersTableData,
    totalOrdersCount,
    totalShippedOrdersCount,
    totalRefundedOrdersCount,
    totalUnfulfilledOrdersCount,
    shop,
  });
};

type CheckboxDropdownProps = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  helpText?: string;
};

function CheckboxDropdown({
  label,
  options,
  selected,
  onChange,
  helpText,
}: CheckboxDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setOpen((prev) => !prev);

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (open && event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", overflow: "visible" }}
    >
      <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
        {label}
      </label>
      <button
        type="button"
        onClick={toggleOpen}
        style={{
          width: "100%",
          padding: "8px",
          textAlign: "left",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#fff",
        }}
      >
        {selected.length > 0 ? selected.join(", ") : "Select options"}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#fff",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "2px",
          }}
        >
          <div style={{ padding: "4px 8px" }}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              style={{
                width: "100%",
                padding: "4px",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div key={opt.value} style={{ padding: "4px 8px" }}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => {
                      if (selected.includes(opt.value)) {
                        onChange(selected.filter((x) => x !== opt.value));
                      } else {
                        onChange([...selected, opt.value]);
                      }
                    }}
                    style={{ marginRight: "8px" }}
                  />
                  {opt.label}
                </label>
              </div>
            ))
          ) : (
            <div style={{ padding: "4px 8px" }}>No options found</div>
          )}
        </div>
      )}
      {helpText && (
        <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "4px" }}>
          {helpText}
        </div>
      )}
    </div>
  );
}

type RoundToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

function RoundToggle({ checked, onChange, label }: RoundToggleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {label && <span style={{ fontWeight: "bold" }}>{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: "40px",
          height: "20px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: checked ? "#22c55e" : "#ccc",
          position: "relative",
          cursor: "pointer",
          outline: "none",
          transition: "background-color 0.2s ease",
        }}
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            backgroundColor: "#fff",
            position: "absolute",
            top: "1px",
            left: checked ? "20px" : "1px",
            transition: "left 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const {
    currencyCode,
    totalRefundedAmount,
    ordersTableData,
    currentPage,
    totalPages,
    totalSalesAmount,
    totalProfit,
    totalRefundAmount,
    allOrders,
    totalOrdersCount,
    totalShippedOrdersCount,
    totalRefundedOrdersCount,
    totalUnfulfilledOrdersCount,
    shop,
  } = useLoaderData<LoaderData>();

  const fetcher = useFetcher();
  const submit = useSubmit();
  const preventDuplicates = false;

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 2), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [noUserEmail, setNoUserEmail] = useState("");
  const [activeToast, setActiveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const [chartRefundAmount, setChartRefundAmount] = useState(0);
  const [chartProfit, setChartProfit] = useState(0);
  const [chartMainData, setChartMainData] = useState<any[]>([]);
  const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
  const [topReasons, setTopReasons] = useState<any[]>([]);
  const [topRefundedAmount, setTopRefundedAmount] = useState(0);

  const [pageSize, setPageSize] = useState("20");
  const [clientPage, setClientPage] = useState(1);

  const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(
    undefined
  );
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending" | undefined
  >(undefined);

  const [includeProducts, setIncludeProducts] = useState<string[]>([]);
  const [excludeProducts, setExcludeProducts] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced Shipped Filter states
  const [advancedShippedStatus, setAdvancedShippedStatus] = useState("");
  const [inTransitDaysOperator, setInTransitDaysOperator] = useState("=");
  const [inTransitDays, setInTransitDays] = useState("");

  const handleToggle = () => {
    setShowAdvancedFilters((prev) => !prev);
  };

  const handleClearFilters = () => {
    setIncludeProducts([]);
    setExcludeProducts([]);
    setFilterTags([]);
  };

  // Build dynamic product options
  const dynamicProductOptions = useMemo(() => {
    const prodSet = new Set<string>();
    allOrders.forEach((order) => {
      order.orderedProducts.split(",").forEach((prod) => {
        const trimmed = prod.trim();
        if (trimmed) prodSet.add(trimmed);
      });
    });
    return Array.from(prodSet).map((product) => ({
      value: product,
      label: product,
    }));
  }, [allOrders]);

  // Build dynamic tag options
  const dynamicTagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    allOrders.forEach((order) => {
      if (order.tags && order.tags !== "N/A") {
        const splitted = order.tags.split(",").map((t) => t.trim());
        splitted.forEach((t) => t !== "N/A" && t !== "" && tagSet.add(t));
      }
    });
    return Array.from(tagSet).map((tag) => ({ label: tag, value: tag }));
  }, [allOrders]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const ps = url.searchParams.get("pageSize") || "20";
    setPageSize(ps);
  }, []);

  const fetchChartData = () => {
    setLoading(true);
    const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
    fetcher.load(fullUrl);
  };

  useEffect(() => {
    fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
  }, [startDate, endDate]);

  useEffect(() => {
    if (fetcher.data) {
      const {
        totalRefundAmount: newRefundAmt,
        totalProfit: newProfit,
        chartData,
        topReasons: reasons,
        topRefundedProducts: refundedProds,
        totalRefundAmountFromTopReasons,
      } = fetcher.data;
      setChartRefundAmount(newRefundAmt);
      setChartProfit(newProfit);
      setChartMainData(chartData);
      setTopReasons(reasons);
      setTopRefundedProducts(refundedProds);
      setTopRefundedAmount(totalRefundAmountFromTopReasons);
      setLoading(false);
    }
  }, [fetcher.data]);

  useEffect(() => {
    setLoading(false);
  }, [allOrders]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    submit(formData, { method: "get" });
  };

  const setDateRange = (days: number) => {
    setLoading(true);
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
    const formData = new FormData();
    formData.set("startDate", format(start, "yyyy-MM-dd"));
    formData.set("endDate", format(end, "yyyy-MM-dd"));
    submit(formData, { method: "get" });
  };

  // Determine if we are in a "filtering" state
  const isFilteringActive = Boolean(searchQuery || showAdvancedFilters);

  // If filtering is active, operate on allOrders
  let baseFilteredOrders = isFilteringActive ? allOrders : ordersTableData;

  // Apply search filter
  baseFilteredOrders = baseFilteredOrders.filter((order) => {
    if (!searchQuery) return true;
    const queries = searchQuery
      .split(",")
      .map((q) => q.trim().toLowerCase())
      .filter(Boolean);
    if (!queries.length) return true;
    return queries.some(
      (q) =>
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.orderedProducts.toLowerCase().includes(q)
    );
  });

  // Advanced filters
  if (showAdvancedFilters) {
    // Include products
    if (includeProducts.length > 0) {
      baseFilteredOrders = baseFilteredOrders.filter((ord) => {
        const lineStr = ord.orderedProducts.toLowerCase();
        return includeProducts.some((inc) => lineStr.includes(inc.toLowerCase()));
      });
    }
    // Exclude products
    if (excludeProducts.length > 0) {
      baseFilteredOrders = baseFilteredOrders.filter((ord) => {
        const lineStr = ord.orderedProducts.toLowerCase();
        return !excludeProducts.some((exc) => lineStr.includes(exc.toLowerCase()));
      });
    }
    // Filter by tags
    if (filterTags.length > 0) {
      baseFilteredOrders = baseFilteredOrders.filter((ord) => {
        if (ord.tags === "N/A") return false;
        const splitted = ord.tags.split(",").map((t) => t.trim());
        return splitted.some((t) => filterTags.includes(t));
      });
    }
  }

  // Apply advanced shipped filter
  if (filterType === "Shipped" && advancedShippedStatus) {
    baseFilteredOrders = baseFilteredOrders.filter(
      (order) => order.shippingStatus === advancedShippedStatus
    );
    if (advancedShippedStatus === "In Transit" && inTransitDays) {
      baseFilteredOrders = baseFilteredOrders.filter((order) => {
        if (order.shippingLastUpdated === "N/A") return false;
        const diffDays = differenceInDays(
          new Date(),
          new Date(order.shippingLastUpdated)
        );
        const numDays = parseInt(inTransitDays, 10);
        if (inTransitDaysOperator === "=") return diffDays === numDays;
        if (inTransitDaysOperator === ">") return diffDays > numDays;
        if (inTransitDaysOperator === "<") return diffDays < numDays;
        return true;
      });
    }
  }

  // Sorting by "Is Refunded" is column 8 now
  const canSortRefunded =
    filterType === "All" ||
    filterType === "Shipped" ||
    filterType === "Non-Shipped";

  let sortedOrders = [...baseFilteredOrders];
  if (canSortRefunded && sortColumnIndex === 8 && sortDirection) {
    sortedOrders.sort((a, b) => {
      const aVal = a.isRefunded === "Yes" ? 1 : 0;
      const bVal = b.isRefunded === "Yes" ? 1 : 0;
      return sortDirection === "ascending" ? aVal - bVal : bVal - aVal;
    });
  }

  let finalOrders: typeof sortedOrders;
  const pSize = parseInt(pageSize, 10);
  const totalFilteredPages = isFilteringActive
    ? Math.ceil(sortedOrders.length / pSize)
    : 0;

  if (isFilteringActive) {
    const effectivePage =
      clientPage > totalFilteredPages ? totalFilteredPages || 1 : clientPage;
    finalOrders = sortedOrders.slice(
      (effectivePage - 1) * pSize,
      effectivePage * pSize
    );
  } else {
    finalOrders = sortedOrders;
  }

  const toggleRowExpansion = (orderNumber: string) => {
    setExpandedRows((prev) => ({ ...prev, [orderNumber]: !prev[orderNumber] }));
  };

  const handleCheckboxChange = (orderNumber: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderNumber)
        ? prev.filter((id) => id !== orderNumber)
        : [...prev, orderNumber]
    );
  };

  const handleSelectAllChange = (evt: any) => {
    if (evt.target.checked) {
      const allNums = finalOrders.map((ord) => ord.orderNumber);
      setSelectedOrders(allNums);
    } else {
      setSelectedOrders([]);
    }
  };

  // The table will have 10 columns total (no tags column shown)
  const getFormattedRows = () => {
    const rows: (string | JSX.Element)[][] = [];
    finalOrders.forEach((order) => {
      const productTitles = order.orderedProducts.split(", ").filter(Boolean);
      const multi = productTitles.length > 1;
      const productCell = multi ? (
        <div
          style={{
            cursor: "pointer",
            color: "blue",
            textDecoration: "underline",
          }}
          onClick={() => toggleRowExpansion(order.orderNumber)}
        >
          {productTitles[0]} (+{productTitles.length - 1} more)
        </div>
      ) : (
        productTitles[0] || "N/A"
      );

      rows.push([
        // col 0 - checkbox
        <input
          type="checkbox"
          checked={selectedOrders.includes(order.orderNumber)}
          onChange={() => handleCheckboxChange(order.orderNumber)}
        />,
        // col 1 - Order #
        <a
          href={`https://${shop}/admin/orders/${order.orderGID}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {order.orderNumber}
        </a>,
        // col 2 - Order Date
        order.orderDate,
        // col 3 - Shipping Status
        order.shippingStatus || "N/A",
        // col 4 - Shipping Last Updated
        order.shippingLastUpdated || "N/A",
        // col 5 - Customer Name
        order.customerName,
        // col 6 - Customer Email
        order.customerEmail,
        // col 7 - Ordered Products
        productCell,
        // col 8 - Is Refunded
        order.isRefunded,
        // col 9 - Order Amount
        order.orderAmount,
      ]);

      // Expand row for additional products if needed
      if (expandedRows[order.orderNumber] && multi) {
        productTitles.slice(1).forEach((t) => {
          rows.push([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            <div style={{ paddingLeft: 20 }}>{t}</div>,
            "",
            "",
          ]);
        });
      }
    });
    return rows;
  };

  const isRefundedHeading = (
    <Text as="span" variant="bodyMd" fontWeight="semibold">
      Is Refunded
    </Text>
  );

  // The 10 column headers, no mention of tags
  const columnHeaders = [
    <input
      type="checkbox"
      checked={
        selectedOrders.length > 0 &&
        selectedOrders.length === finalOrders.length
      }
      onChange={handleSelectAllChange}
    />,
    "Order #",
    "Order Date",
    "Shipping Status",
    "Shipping Last Updated",
    "Customer Name",
    "Email",
    "Ordered Products",
    isRefundedHeading,
    "Order Amount",
  ];

  const displayFilterLabel = () => {
    if (filterType === "All") return "All Orders";
    if (filterType === "Refunded") return "Refunded Orders";
    if (filterType === "Non-Refunded") return "Non-Refunded Orders";
    if (filterType === "Shipped") {
      return advancedShippedStatus
        ? `Shipped Orders - ${advancedShippedStatus} (${finalOrders.filter(
            (order) => order.shippingStatus === advancedShippedStatus
          ).length} orders)`
        : "Shipped Orders";
    }
    if (filterType === "Non-Shipped") return "Non-Shipped Orders";
    return "";
  };

  const changeFilter = (fType: string) => {
    setLoading(true);
    setFilterType(fType);
    // If switching to certain filters, reset sorting
    if (fType === "Refunded" || fType === "Non-Shipped") {
      setSortColumnIndex(undefined);
      setSortDirection(undefined);
    }
    if (fType !== "Shipped") {
      setAdvancedShippedStatus("");
      setInTransitDays("");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("filterType", fType);
    url.searchParams.set("page", "1");
    submit(url.searchParams, { method: "get" });
  };

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", p.toString());
    submit(url.searchParams, { method: "get" });
  };

  const changePageSize = (value: string) => {
    setLoading(true);
    setPageSize(value);
    const url = new URL(window.location.href);
    url.searchParams.set("pageSize", value);
    url.searchParams.set("page", "1");
    submit(url.searchParams, { method: "get" });
  };

  interface OrderPreview {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
  }

  const previewOrders: OrderPreview[] = useMemo(() => {
    return selectedOrders
      .map((num) => allOrders.find((o) => o.orderNumber === num))
      .filter(Boolean) as OrderPreview[];
  }, [selectedOrders, allOrders]);

  const handleSendEmail = () => {
    const enriched = selectedOrders
      .map((num) => allOrders.find((o) => o.orderNumber === num))
      .filter(Boolean);
    if (!enriched.length) {
      setNoUserEmail("No valid emails found in the selected orders.");
      return;
    }
    setPreviewModalOpen(true);
  };

  const handleConfirmFinalSend = () => {
    setPreviewModalOpen(false);
    let ordersToSend = previewOrders;
    if (preventDuplicates) {
      const seen = new Set();
      ordersToSend = ordersToSend.filter((order) => {
        if (seen.has(order.customerEmail)) return false;
        seen.add(order.customerEmail);
        return true;
      });
    }
    setSelectedOrders(ordersToSend.map((o) => o.orderNumber));
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const sendEmailsToCustomers = async (templateData: any) => {
    const { subject, bodyHtml, bodyText } = templateData;
    let ordersToSend = previewOrders;
    if (preventDuplicates) {
      const seen = new Set();
      ordersToSend = ordersToSend.filter((order) => {
        if (seen.has(order.customerEmail)) return false;
        seen.add(order.customerEmail);
        return true;
      });
    }
    const results: any[] = [];
    for (let i = 0; i < ordersToSend.length; i++) {
      const order = ordersToSend[i];
      const toAddress = order.customerEmail;
      const orderId = order.orderNumber;
      const customerName = order.customerName;
      try {
        const response = await fetch("/sendEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toAddresses: [toAddress],
            subject,
            bodyHtml,
            bodyText,
            orderId,
            customerName,
          }),
        });
        if (!response.ok) {
          const errData = await response.json();
          setToastMessage(errData.error || "Error sending email.");
          setActiveToast(true);
          results.push({
            sNo: i + 1,
            dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
            customerName,
            customerEmail: toAddress,
            orderNumber: orderId,
            status: "Error",
          });
        } else {
          results.push({
            sNo: i + 1,
            dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
            customerName,
            customerEmail: toAddress,
            orderNumber: orderId,
            status: "Delivered",
          });
        }
      } catch (error) {
        console.error("Error sending email:", error);
        setToastMessage("An unexpected error occurred while sending the email.");
        setActiveToast(true);
        results.push({
          sNo: i + 1,
          dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
          customerName,
          customerEmail: toAddress,
          orderNumber: orderId,
          status: "Error",
        });
      }
    }
    setIsModalOpen(false);
    setConfirmationData(results);
    setIsConfirmationModalOpen(true);
  };

  // Doughnut data
  const doughnutData = {
    labels: ["Shipped", "Refunded", "Unfulfilled"],
    datasets: [
      {
        label: "Order Distribution",
        data: [
          totalShippedOrdersCount,
          totalRefundedOrdersCount,
          totalUnfulfilledOrdersCount,
        ],
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
        hoverOffset: 4,
      },
    ],
  };
  // Bar data
  const barData = {
    labels: ["Total Sales", "Refunded"],
    datasets: [
      {
        label: "Amount",
        backgroundColor: ["#4CAF50", "#F44336"],
        data: [totalSalesAmount, totalRefundAmount],
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Sales vs. Refund" },
    },
  };

  return (
    <Page fullWidth title="Notify Rush - Dashboard">
    <Frame>
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <h1 className="loading-text">Loading...</h1>
          </div>
        )}
        {errorMessage && (
          <Card sectioned>
            <Text variant="critical" color="red">
              {errorMessage}
            </Text>
          </Card>
        )}
        {noUserEmail && (
          <Banner status="critical" title="Error">
            <p>{noUserEmail}</p>
          </Banner>
        )}
        <Layout>
          <div className="responsive-layout">
            <div className="flex flex-row">
              {/* Left side: date filters & charts */}
              <Layout.Section>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                    padding: "16px",
                    backgroundColor: "#f7f9fc",
                    borderRadius: "12px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Date Filter Card */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(val) => setStartDate(val)}
                      autoComplete="off"
                      style={{ flex: "1 1 auto", minWidth: "150px" }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(val) => setEndDate(val)}
                      autoComplete="off"
                      style={{ flex: "1 1 auto", minWidth: "150px" }}
                    />
                    <Button
                      primary
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{
                        padding: "12px 20px",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "16px",
                    }}
                  >
                    <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
                    <Button onClick={() => setDateRange(30)}>Last 30 Days</Button>
                    <Button onClick={() => setDateRange(60)}>Last 60 Days</Button>
                  </div>
                  {/* Summary + Charts */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "32px",
                    }}
                  >
                    <Card
                      sectioned
                      style={{ padding: "16px", borderRadius: "12px" }}
                    >
                      <div style={{ marginBottom: "20px" }}>
                        <Text variant="headingLg">Summary</Text>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "12px" }}
                        >
                          <span style={{ fontSize: "24px", color: "#2b6cb0" }}>
                            💰
                          </span>
                          <Text variant="bodyMd">
                            Total Sales: {totalSalesAmount.toFixed(2)} {currencyCode}
                          </Text>
                        </div>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "12px" }}
                        >
                          <span style={{ fontSize: "24px", color: "#48bb78" }}>
                            📦
                          </span>
                          <Text variant="bodyMd">
                            Total Orders: {totalOrdersCount}
                          </Text>
                        </div>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "12px" }}
                        >
                          <span style={{ fontSize: "24px", color: "#38a169" }}>
                            🚚
                          </span>
                          <Text variant="bodyMd">
                            Shipped: {totalShippedOrdersCount}
                          </Text>
                        </div>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "12px" }}
                        >
                          <span style={{ fontSize: "24px", color: "#e53e3e" }}>
                            🔄
                          </span>
                          <Text variant="bodyMd">
                            Refunded: {totalRefundedOrdersCount}
                          </Text>
                        </div>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "12px" }}
                        >
                          <span style={{ fontSize: "24px", color: "#dd6b20" }}>
                            ❗
                          </span>
                          <Text variant="bodyMd">
                            Unfulfilled: {totalUnfulfilledOrdersCount}
                          </Text>
                        </div>
                      </div>
                    </Card>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <Card
                        sectioned
                        style={{ borderRadius: "12px", padding: "16px" }}
                      >
                        <Text variant="headingMd" style={{ marginBottom: "8px" }}>
                          Order Distribution
                        </Text>
                        <div
                          style={{
                            height: "300px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Doughnut data={doughnutData} />
                        </div>
                      </Card>
                      <Card
                        sectioned
                        style={{ borderRadius: "12px", padding: "16px" }}
                      >
                        <Text variant="headingMd" style={{ marginBottom: "8px" }}>
                          Sales vs. Refund
                        </Text>
                        <div style={{ height: "300px", width: "100%" }}>
                          <Bar data={barData} options={barOptions} />
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </Layout.Section>
              {/* Right Panel: Orders Table */}
              <Layout.Section>
                {selectedOrders.length > 0 && (
                  <div
                    onClick={handleSendEmail}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#28a745",
                      color: "white",
                      borderRadius: "15px",
                      margin: "20px 50px",
                    }}
                  >
                    <p
                      style={{
                        textAlign: "center",
                        fontSize: "30px",
                        padding: "10px",
                      }}
                    >
                      Send Email
                    </p>
                  </div>
                )}
                <EmailModal
                  isOpen={isModalOpen}
                  onClose={handleModalClose}
                  onSend={(template) => sendEmailsToCustomers(template)}
                />
                <EmailConfirmationModal
                  isOpen={isConfirmationModalOpen}
                  onClose={() => setIsConfirmationModalOpen(false)}
                  data={confirmationData}
                />
                <EmailPreviewModal
                  isOpen={previewModalOpen}
                  orders={previewOrders}
                  onClose={() => setPreviewModalOpen(false)}
                  onConfirm={handleConfirmFinalSend}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Filter Buttons */}
                  <Card sectioned>
                    <div
                      style={{ display: "flex", justifyContent: "center", gap: "30px" }}
                    >
                      <Button
                        onClick={() => changeFilter("All")}
                        primary={filterType === "All"}
                        disabled={loading}
                      >
                        All Orders
                      </Button>
                      <Button
                        onClick={() => changeFilter("Refunded")}
                        primary={filterType === "Refunded"}
                        disabled={loading}
                      >
                        Refunded
                      </Button>
                      <Button
                        onClick={() => changeFilter("Non-Refunded")}
                        primary={filterType === "Non-Refunded"}
                        disabled={loading}
                      >
                        Non-Refunded
                      </Button>
                      <Button
                        onClick={() => changeFilter("Shipped")}
                        primary={filterType === "Shipped"}
                        disabled={loading}
                      >
                        Shipped
                      </Button>
                      <Button
                        onClick={() => changeFilter("Non-Shipped")}
                        primary={filterType === "Non-Shipped"}
                        disabled={loading}
                      >
                        Non-Shipped
                      </Button>
                    </div>
                  </Card>

                  {/* Display current filter label above table */}
                  <Card>
                    <Text as="h1" variant="heading2xl">
                      {displayFilterLabel()}
                    </Text>
                  </Card>

                  {/* Basic search bar */}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      marginTop: "5px",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                        padding: "20px",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "6px",
                          color: "#333",
                        }}
                      >
                        Search Orders
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          let input = e.target.value;
                          if (
                            input.indexOf(",") === -1 &&
                            input.indexOf("#") !== -1
                          ) {
                            if (input.charAt(0) === "#") {
                              input =
                                "#" + input.substring(1).replace(/#/g, ",#");
                            } else {
                              input = input.replace(/#/g, ",#");
                              if (input.startsWith(",")) {
                                input = input.substring(1);
                              }
                            }
                            if (input.endsWith(",")) {
                              input = input.slice(0, -1);
                            }
                          }
                          setSearchQuery(input);
                          setClientPage(1);
                        }}
                        placeholder="Search by order #, name, or product"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          fontSize: "16px",
                          outline: "none",
                          transition: "border-color 0.2s ease-in-out",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                        onBlur={(e) => (e.target.style.borderColor = "#ccc")}
                      />

                      {/* Advanced Filter Toggle with Clear Filter Button */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          margin: "30px 10px 10px 10px",
                          gap: "20px",
                        }}
                      >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <label
                              style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#333",
                              }}
                            >
                              Advanced Filter
                            </label>
                            <div
                              onClick={() => handleToggle()}
                              style={{
                                width: "70px",
                                height: "35px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "35px",
                                cursor: "pointer",
                                transition: "all 0.3s ease-in-out",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "50px",
                                  fontWeight: "bold",
                                  width: "30px",
                                }}
                              >
                                {showAdvancedFilters ? (
                                  <div style={{ color: "green" }}>
                                    <MdToggleOn />
                                  </div>
                                ) : (
                                  <div style={{ color: "black" }}>
                                    <MdToggleOff />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "20px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                            onClick={handleClearFilters}
                            title="Clear Filters"
                          >
                            <FiRefreshCcw />
                          </div>
                        </div>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div>
                      {filterType === "Shipped" && (
                        <Card>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "20px",
                            }}
                          >
                            <h2 style={{ fontWeight: "600" }}>
                              Advanced Shipped Filter
                            </h2>
                            <Select
                              label="Shipping Status"
                              options={[
                                { label: "Confirmed", value: "Confirmed" },
                                { label: "In Transit", value: "In Transit" },
                                { label: "Out for Delivery", value: "Out for Delivery" },
                                { label: "Delivered", value: "Delivered" },
                                {
                                  label: "Shipped-Unknown Status",
                                  value: "Shipped-Unknown Status",
                                },
                                { label: "sucess", value: "sucess" },
                              ]}
                              value={advancedShippedStatus}
                              onChange={setAdvancedShippedStatus}
                            />
                            {advancedShippedStatus === "In Transit" && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  alignItems: "center",
                                }}
                              >
                                <Select
                                  label="Condition"
                                  options={[
                                    { label: "=", value: "=" },
                                    { label: ">", value: ">" },
                                    { label: "<", value: "<" },
                                  ]}
                                  value={inTransitDaysOperator}
                                  onChange={setInTransitDaysOperator}
                                />
                                <TextField
                                  label="Days"
                                  type="number"
                                  value={inTransitDays}
                                  onChange={setInTransitDays}
                                  autoComplete="off"
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                      <div
                        style={{
                          width: "100%",
                          padding: "16px",
                          marginTop: "16px",
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "24px",
                            width: "100%",
                          }}
                        >
                          <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
                            <CheckboxDropdown
                              label="Include Products"
                              options={dynamicProductOptions}
                              selected={includeProducts}
                              onChange={setIncludeProducts}
                              helpText="If an order contains at least one of these items, it is included."
                            />
                          </div>
                          <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
                            <CheckboxDropdown
                              label="Exclude Products"
                              options={dynamicProductOptions}
                              selected={excludeProducts}
                              onChange={setExcludeProducts}
                              helpText="If an order contains any of these items, it is excluded."
                            />
                          </div>
                          <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
                            <CheckboxDropdown
                              label="Tags"
                              options={dynamicTagOptions}
                              selected={filterTags}
                              onChange={setFilterTags}
                              helpText="If an order has at least one of these tags, it is included."
                            />
                          </div>
                        </div>
                        {includeProducts.length > 0 && (
                          <p
                            style={{
                              marginTop: "12px",
                              fontSize: "14px",
                              color: "#4A4A4A",
                              fontWeight: "500",
                            }}
                          >
                            Include:{" "}
                            <span style={{ color: "#15803D", fontWeight: "600" }}>
                              {includeProducts.join(", ")}
                            </span>
                          </p>
                        )}
                        {excludeProducts.length > 0 && (
                          <p
                            style={{
                              marginTop: "4px",
                              fontSize: "14px",
                              color: "#4A4A4A",
                              fontWeight: "500",
                            }}
                          >
                            Exclude:{" "}
                            <span style={{ color: "#DC2626", fontWeight: "600" }}>
                              {excludeProducts.join(", ")}
                            </span>
                          </p>
                        )}
                        {filterTags.length > 0 && (
                          <p
                            style={{
                              marginTop: "4px",
                              fontSize: "14px",
                              color: "#4A4A4A",
                              fontWeight: "500",
                            }}
                          >
                            Tags:{" "}
                            <span style={{ color: "#1E3A8A", fontWeight: "600" }}>
                              {filterTags.join(", ")}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Orders Table */}
                  <Card title="Order Details">
                    <div className="custom-data-table">
                      <DataTable
                        sortable={[
                          true, // col 0 (checkbox) won't be sorted, but we keep it consistent
                          false,
                          false,
                          false,
                          false,
                          false,
                          false,
                          false,
                          // Only 'Is Refunded' (col 8) can be sorted
                          filterType === "All" ||
                            filterType === "Shipped" ||
                            filterType === "Non-Shipped",
                          false,
                        ]}
                        onSort={(columnIndex, direction) => {
                          if (
                            (filterType === "All" ||
                              filterType === "Shipped" ||
                              filterType === "Non-Shipped") &&
                            columnIndex === 8
                          ) {
                            setSortColumnIndex(8);
                            setSortDirection(direction);
                          }
                        }}
                        sortColumnIndex={sortColumnIndex}
                        sortDirection={sortDirection}
                        columnContentTypes={[
                          "text", // checkbox
                          "text", // Order #
                          "text", // Order Date
                          "text", // Shipping Status
                          "text", // Shipping Last Updated
                          "text", // Customer Name
                          "text", // Email
                          "text", // Ordered Products
                          "text", // Is Refunded
                          "text", // Order Amount
                        ]}
                        headings={columnHeaders}
                        rows={getFormattedRows()}
                        footerContent={`Total Orders: ${
                          isFilteringActive ? sortedOrders.length : finalOrders.length
                        }`}
                      />
                    </div>
                    {/* Pagination controls */}
                    {isFilteringActive ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          marginTop: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          {clientPage > 1 && (
                            <Button onClick={() => setClientPage(1)}>First</Button>
                          )}
                          {clientPage > 1 && (
                            <Button onClick={() => setClientPage(clientPage - 1)}>
                              Previous
                            </Button>
                          )}
                          <Text variant="bodyMd">
                            Page {clientPage} of {totalFilteredPages}
                          </Text>
                          {clientPage < totalFilteredPages && (
                            <Button onClick={() => setClientPage(clientPage + 1)}>
                              Next
                            </Button>
                          )}
                          {clientPage < totalFilteredPages && (
                            <Button
                              onClick={() => setClientPage(totalFilteredPages)}
                            >
                              Last
                            </Button>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "10px",
                          }}
                        >
                          <Card sectioned>
                            <Text variant="headingMd">Records per page:</Text>
                            <Select
                              options={[
                                { label: "20", value: "20" },
                                { label: "50", value: "50" },
                                { label: "70", value: "70" },
                                { label: "100", value: "100" },
                              ]}
                              value={pageSize}
                              onChange={(value) => changePageSize(value)}
                              disabled={loading}
                            />
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          marginTop: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          {currentPage > 1 && (
                            <Button onClick={() => goToPage(1)}>First</Button>
                          )}
                          {currentPage > 1 && (
                            <Button onClick={() => goToPage(currentPage - 1)}>
                              Previous
                            </Button>
                          )}
                          <Text variant="bodyMd">
                            Page {currentPage} of {totalPages}
                          </Text>
                          {currentPage < totalPages && (
                            <Button onClick={() => goToPage(currentPage + 1)}>
                              Next
                            </Button>
                          )}
                          {currentPage < totalPages && (
                            <Button onClick={() => goToPage(totalPages)}>
                              Last
                            </Button>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "10px",
                          }}
                        >
                          <Card sectioned>
                            <Text variant="headingMd">Records per page:</Text>
                            <Select
                              options={[
                                { label: "20", value: "20" },
                                { label: "50", value: "50" },
                                { label: "70", value: "70" },
                                { label: "100", value: "100" },
                              ]}
                              value={pageSize}
                              onChange={(value) => changePageSize(value)}
                              disabled={loading}
                            />
                          </Card>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </Layout.Section>
            </div>
          </div>
        </Layout>
        {activeToast && (
          <Toast content={toastMessage} error onDismiss={toggleToast} />
        )}
      
    </Frame>
    </Page>
  );
}
