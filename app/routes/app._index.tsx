
// import { json, LoaderFunction, redirect } from "@remix-run/node";
// import { useLoaderData, useNavigate } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   List,
//   Button,
//   BlockStack,
//   Banner,
// } from "@shopify/polaris";
// import { authenticate } from "app/shopify.server";
// import { useEffect } from "react";

// type LoaderData = {
//   hasActivePayment: boolean;
//   store: string;
//   appSubscriptions: {
//     name: string;
//   }[]; // Specify that this is an array
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { billing, session } = await authenticate.admin(request);
//   const store = session.shop;

//   try {
//     const { hasActivePayment, appSubscriptions } = await billing.check({
//       session,
//       isTest: true,
//     });

//     return json<LoaderData>({
//       hasActivePayment,
//       store,
//       appSubscriptions: appSubscriptions.map((sub) => ({
//         name: sub.name,
//       })),
//     });


//   } catch (error) {
//     // If the shop does not have an active plan, return an empty plan object
//     if (error === "No active plan") {
//       console.log("Error in the pricing plans.");
//     }
//     // If there is another error, rethrow it
//     throw error;
//   }
//   return null;
// };

// export default function IndexPage() {
//   const { hasActivePayment, store } = useLoaderData<LoaderData>();

//   const url = store;

//   // Remove '.myshopify.com' using replace method
//   const storeName = url.replace(".myshopify.com", "");

//   if (!hasActivePayment) {
//     useEffect(() => {
//       window.parent.location.href = `https://admin.shopify.com/store/${storeName}/charges/notifyrush/pricing_plans`;
//     }, []);
//   }

//   const navigate = useNavigate();

//   // Handler for navigating to other pages
//   const handleNavigate = (path) => {
//     navigate(path);
//   };

//   return (
//     <Page title="Welcome to Notify Rush - Your Seamless Customer Communication Solution">
//   <Layout>
//     {/* Emphasized Sync Data Section */}
//     <Layout.Section>
//       <Card sectioned>
//         <Text as="h2" variant="headingLg">
//           Step 1: Sync Your Data
//         </Text>
//         <br />
//         <Text variant="bodyMd">
//           Before using Notify Rush, you must sync your order data from your Shopify store. This is essential for enabling all app functionalities.
//         </Text>
//         <br />
//         <Banner
//           title="Start by syncing your order data now!"
//           status="warning"
      
//         >
           
//           <Text variant="bodyMd">
//             Click the **Sync Data** button below to start the synchronization process. Once complete, the app will automatically keep your data updated through webhooks.
//           </Text>
//         </Banner>
//         <br />
//         <Button variant="primary" fullWidth onClick={() => handleNavigate("/app/syncData")} >
//             Sync Data
//           </Button> 
//       </Card>
//     </Layout.Section>

//     {/* Next Steps Section */}
//     <Layout.Section>
//       <Card title="Next Steps to Set Up Notify Rush" sectioned>
//         <BlockStack vertical spacing="extraLoose">
//           <Text size="large" variant="headingMd">Step 2: Configure Your Sender Email</Text>
//           <Text variant="bodyMd">
//             Go to the <b>Email Configuration </b>  menu and add the email address you want to use for sending messages. Verify this email to ensure that your communications are trusted and delivered successfully.
//           </Text>
//           <br />
//           <Text size="large" variant="headingMd">Step 3: Add Email Templates</Text>
//           <Text variant="bodyMd">
//             Navigate to the <b>Email Templates</b> menu to create and save your custom email templates. These templates can be reused for different notifications, saving you time and maintaining consistency.
//           </Text>
//           <br />
//           <Text size="large" variant="headingMd">Step 4: Send Emails from the Dashboard</Text>
//           <Text variant="bodyMd">
//             Visit the <b>Dashboard</b> to view all your synced orders. Select the orders you need to notify your customers about, choose an appropriate email template, and send emails in bulk with just a few clicks.
//           </Text>
//         </BlockStack>
//       </Card>
//     </Layout.Section>

//     {/* Key Features Section */}
//     <Layout.Section>
//       <Card title="Why Choose Notify Rush?" sectioned>
//         <List type="bullet">
//           <List.Item>
//             <strong>Seamless Data Sync:</strong> Sync your order data with a single click for efficient communication.
//           </List.Item>
//           <List.Item>
//             <strong>Customizable Email Templates:</strong> Create and manage templates for various types of notifications.
//           </List.Item>
//           <List.Item>
//             <strong>Bulk Email Sending:</strong> Send updates to multiple customers at once, saving you time and effort.
//           </List.Item>
//           <List.Item>
//             <strong>Intuitive Dashboard:</strong> Easily manage orders and communication in one place.
//           </List.Item>
//         </List>
//       </Card>
//     </Layout.Section>

//     {/* Support Section */}
//     <Layout.Section>
//       <Card title="Need Assistance?" sectioned>
//         <Text variant="bodyMd">
//           If you have questions or need help, visit our **Contact Us** page or check out our documentation. We’re here to support you.
//         </Text>
//         <br/>
//           <Button onClick={() => handleNavigate("/app/contactUs")} >
//             Contact Support
//           </Button>
        
//       </Card>
//     </Layout.Section>

//     {/* Final Call to Action */}
//     <Layout.Section>
//       <Banner
//         title="Get Started Now!"
//         action={{
//           content: "Sync Data",
//           onAction: () => handleNavigate("/app/syncData"),
//         }}
//         status="info"
//       >
//         <Text variant="bodyMd">
//           Begin by syncing your data to access your order details and start sending updates to your customers.
//         </Text>
//       </Banner>
//     </Layout.Section>
//   </Layout>
// </Page>

//   );
// }

// import { json, LoaderFunction } from "@remix-run/node";
// import { useLoaderData, useNavigate } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   Button,
//   BlockStack,
//   InlineGrid,
//   Box,
//   Icon,
//   List,
//   Divider,
// } from "@shopify/polaris";
// import {
//   ImportIcon,
//   OrderIcon,
//   EmailIcon,
//   NoteIcon,
//   HomeIcon,
//   LightbulbIcon,
//   ChatIcon,
//   BookIcon,
// } from "@shopify/polaris-icons";
// import { authenticate } from "app/shopify.server";
// import db from "../db.server";

// type LoaderData = {
//   store: string;
//   orderCount: number;
//   emailCount: number;
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { session } = await authenticate.admin(request);
//   const { shop } = session;

//   const orderCount = await db.order.count({ where: { shop } });
//   const emailCount = await db.emailLog.count({ where: { shop } });

//   return json({ store: shop, orderCount, emailCount });
// };

// export default function IndexPage() {
//   const { store, orderCount, emailCount } = useLoaderData<LoaderData>();
//   const navigate = useNavigate();

//   const handleNavigate = (path: string) => {
//     navigate(path);
//   };

//   return (
//     <Page fullWidth>
//       <BlockStack gap="800">
//         {/* Hero Section */}
//         <Card>
//           <BlockStack gap="400">
//             <Text variant="heading2xl" as="h1">
//               Unlock Effortless Customer Communication
//             </Text>
//             <Text as="p" tone="subdued">
//               Notify Rush streamlines your order updates, back-in-stock alerts,
//               and more. Sync your store data to get started in minutes.
//             </Text>
//             <Box>
//               <Button
//                 variant="primary"
//                 size="large"
//                 onClick={() => handleNavigate("/app/syncData")}
//                 icon={ImportIcon}
//               >
//                 Sync Store Data
//               </Button>
//             </Box>
//           </BlockStack>
//         </Card>

//         {/* Main Dashboard Grid */}
//         <Layout>
//           <Layout.Section>
//             <InlineGrid columns={{ xs: 1, md: "1fr 1fr" }} gap="400">
//               <Card>
//                 <BlockStack gap="300" align="start">
//                   <Icon source={OrderIcon} tone="base" />
//                   <Text variant="headingMd" as="h3">
//                     Orders Synced
//                   </Text>
//                   <Text variant="heading2xl" as="p">
//                     {orderCount}
//                   </Text>
//                 </BlockStack>
//               </Card>
//               <Card>
//                 <BlockStack gap="300" align="start">
//                   <Icon source={EmailIcon} tone="base" />
//                   <Text variant="headingMd" as="h3">
//                     Emails Sent
//                   </Text>
//                   <Text variant="heading2xl" as="p">
//                     {emailCount}
//                   </Text>
//                 </BlockStack>
//               </Card>
//               <Card>
//                 <BlockStack gap="400">
//                   <InlineGrid gap="400" columns="auto 1fr">
//                     <Icon source={NoteIcon} tone="base" />
//                     <Text variant="headingMd" as="h3">
//                       Create & Manage Templates
//                     </Text>
//                   </InlineGrid>
//                   <Text as="p" tone="subdued">
//                     Design beautiful, on-brand emails for every scenario.
//                   </Text>
//                   <Box>
//                     <Button onClick={() => handleNavigate("/app/templates")}>
//                       Go to Templates
//                     </Button>
//                   </Box>
//                 </BlockStack>
//               </Card>
//               <Card>
//                 <BlockStack gap="400">
//                   <InlineGrid gap="400" columns="auto 1fr">
//                     <Icon source={HomeIcon} tone="base" />
//                     <Text variant="headingMd" as="h3">
//                       View Your Dashboard
//                     </Text>
//                   </InlineGrid>
//                   <Text as="p" tone="subdued">
//                     Filter orders and send bulk notifications to customers.
//                   </Text>
//                   <Box>
//                     <Button onClick={() => handleNavigate("/app/dashboard-db")}>
//                       Go to Dashboard
//                     </Button>
//                   </Box>
//                 </BlockStack>
//               </Card>
//             </InlineGrid>
//           </Layout.Section>
//         </Layout>

//         {/* Path to Success Section */}
//         <Layout>
//           <Layout.Section>
//             <Card>
//               <BlockStack gap="500">
//                 <Text variant="headingXl" as="h2">
//                   Your Path to Seamless Notifications
//                 </Text>
//                 <InlineGrid
//                   columns={{ xs: 1, md: "1fr 1fr 1fr" }}
//                   gap="400"
//                 >
//                   <BlockStack gap="200" align="center">
//                     <Text variant="headingLg" as="p">
//                       1
//                     </Text>
//                     <Text variant="headingMd" as="h3">
//                       Sync Data
//                     </Text>
//                     <Text as="p" tone="subdued" alignment="center">
//                       Import your orders with a single click.
//                     </Text>
//                   </BlockStack>
//                   <BlockStack gap="200" align="center">
//                     <Text variant="headingLg" as="p">
//                       2
//                     </Text>
//                     <Text variant="headingMd" as="h3">
//                       Create a Template
//                     </Text>
//                     <Text as="p" tone="subdued" alignment="center">
//                       Design your first email in our editor.
//                     </Text>
//                   </BlockStack>
//                   <BlockStack gap="200" align="center">
//                     <Text variant="headingLg" as="p">
//                       3
//                     </Text>
//                     <Text variant="headingMd" as="h3">
//                       Send Notifications
//                     </Text>
//                     <Text as="p" tone="subdued" alignment="center">
//                       Send emails from your dashboard.
//                     </Text>
//                   </BlockStack>
//                 </InlineGrid>
//               </BlockStack>
//             </Card>
//           </Layout.Section>
//         </Layout>

//         {/* Resources Section */}
//         <Layout>
//           <Layout.Section>
//             <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
//               <Card>
//                 <BlockStack gap="400">
//                   <InlineGrid gap="300" columns="auto 1fr">
//                     <Icon source={LightbulbIcon} tone="base" />
//                     <Text variant="headingLg" as="h2">
//                       Pro Tips for Success
//                     </Text>
//                   </InlineGrid>
//                   <List type="bullet">
//                     <List.Item>
//                       <strong>Segment Your Audience:</strong> Use smart filters
//                       for more relevant messaging.
//                     </List.Item>
//                     <List.Item>
//                       <strong>Personalize Heavily:</strong> Use customer and
//                       order data to make emails feel personal.
//                     </List.Item>
//                     <List.Item>
//                       <strong>Keep Templates Fresh:</strong> Regularly update
//                       your templates to reflect your brand.
//                     </List.Item>
//                   </List>
//                 </BlockStack>
//               </Card>
//               <Card>
//                 <BlockStack gap="300">
//                   <Text variant="headingLg" as="h2">
//                     Help & Documentation
//                   </Text>
//                   <Divider />
//                   <Button
//                     icon={BookIcon}
//                     fullWidth
//                     url="https://docs.notifyrush.com/"
//                     target="_blank"
//                   >
//                     View Documentation
//                   </Button>
//                   <Button
//                     icon={ChatIcon}
//                     fullWidth
//                     onClick={() => handleNavigate("/app/contactUs")}
//                   >
//                     Contact Support
//                   </Button>
//                 </BlockStack>
//               </Card>
//             </InlineGrid>
//           </Layout.Section>
//         </Layout>
//       </BlockStack>
//     </Page>
//   );
// }


// import { json, LoaderFunction } from "@remix-run/node";
// import { useLoaderData, useNavigate } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   Button,
//   BlockStack,
//   InlineGrid,
//   Box,
//   Icon,
//   Divider,
//   Badge,
//   ProgressBar,
//   Banner,
// } from "@shopify/polaris";
// import {
//   ImportIcon,
//   OrderIcon,
//   EmailIcon,
//   NoteIcon,
//   HomeIcon,
//   LightbulbIcon,
//   ChatIcon,
//   BookIcon,
//   CheckIcon,
//   SettingsIcon,
//   StarFilledIcon,
//   PlayIcon,
//   ChevronRightIcon,
//   ViewIcon,
// } from "@shopify/polaris-icons";
// import { authenticate } from "app/shopify.server";
// import db from "../db.server";

// type LoaderData = {
//   store: string;
//   orderCount: number;
//   emailCount: number;
//   openedEmailCount: number;
//   openRate: number;
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { session } = await authenticate.admin(request);
//   const { shop } = session;

//   const orderCount = await db.order.count({ where: { shop } });
//   const emailCount = await db.emailLog.count({ where: { shop } });
//   const openedEmailCount = await db.emailLog.count({
//     where: {
//       shop,
//       isOpened: true,
//     },
//   });

//   // Calculate open rate percentage
//   const openRate = emailCount > 0 ? (openedEmailCount / emailCount) * 100 : 0;

//   return json({
//     store: shop,
//     orderCount,
//     emailCount,
//     openedEmailCount,
//     openRate: Math.round(openRate * 10) / 10, // Round to 1 decimal place
//   });
// };

// export default function IndexPage() {
//   const { store, orderCount, emailCount, openedEmailCount, openRate } =
//     useLoaderData<LoaderData>();
//   const navigate = useNavigate();

//   const handleNavigate = (path: string) => {
//     navigate(path);
//   };

//   // Calculate setup progress
//   const setupSteps = [
//     { completed: orderCount > 0, label: "Data Synced" },
//     { completed: emailCount > 0, label: "First Email Sent" },
//   ];
//   const completedSteps = setupSteps.filter((step) => step.completed).length;
//   const progressPercentage = (completedSteps / setupSteps.length) * 100;

//   return (
//     <Page fullWidth>
//       <BlockStack gap="800">
//         {/* Hero Section with Gradient Background */}
//         <Card>
//           <Box
//             padding="800"
//             background="bg-surface-brand-subdued"
//             borderRadius="400"
//           >
//             <BlockStack gap="600" align="center">
//               <div
//                 style={{
//                   background: "linear-gradient(90deg, #3b1f47, #5e3b7c)", // deep royal gradient
//                   color: "#f7e9b7", // soft gold
//                   fontSize: "20px",
//                   fontWeight: 600,
//                   padding: "14px 24px",
//                   borderRadius: "10px",
//                   textAlign: "center",
//                   boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
//                   marginBottom: "20px",
//                   letterSpacing: "0.6px",
//                   fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
//                 }}
//               >
//                 👑 Welcome to Notify Rush
//               </div>

//               <BlockStack gap="400" align="center">
//                 <Text variant="heading3xl" as="h1" alignment="center">
//                   Transform Your Customer Communication
//                 </Text>
//                 <Text as="p" tone="subdued" alignment="center" variant="bodyLg">
//                   Send professional email notifications at scale. Boost customer
//                   satisfaction with timely order updates, shipping
//                   notifications, and personalized messages.
//                 </Text>
//               </BlockStack>

//               <BlockStack gap="300" align="center">
//                 <InlineGrid gap="300" columns="auto auto" alignItems="center">
//                   <Button
//                     variant="primary"
//                     size="large"
//                     onClick={() => handleNavigate("/app/syncData")}
//                     icon={ImportIcon}
//                   >
//                     Get Started Now
//                   </Button>
//                   <Button
//                     icon={BookIcon}
//                     fullWidth
//                     url="https://docs.notifyrush.com/"
//                     target="_blank"
//                     size="medium"
//                   >
//                     Documentation
//                   </Button>
//                 </InlineGrid>

//                 {/* Progress Indicator */}
//                 {completedSteps > 0 && (
//                   <Box paddingBlockStart="400">
//                     <BlockStack gap="200" align="center">
//                       <Text variant="bodyMd" tone="subdued">
//                         Setup Progress: {completedSteps}/{setupSteps.length}{" "}
//                         completed
//                       </Text>
//                       <Box width="200px">
//                         <ProgressBar
//                           progress={progressPercentage}
//                           tone="success"
//                         />
//                       </Box>
//                     </BlockStack>
//                   </Box>
//                 )}
//               </BlockStack>
//             </BlockStack>
//           </Box>
//         </Card>

//         {/* Quick Stats with Enhanced Design */}
//         <Layout>
//           <Layout.Section>
//             <InlineGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="400">
//               {/* Orders Synced */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background="bg-surface-success-subdued"
//                         borderRadius="200"
//                       >
//                         <Icon source={OrderIcon} tone="success" />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           ORDERS SYNCED
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           {orderCount.toLocaleString()}
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       {orderCount > 0
//                         ? "Ready for notifications"
//                         : "Sync your store data to get started"}
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Emails Sent */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background="bg-surface-info-subdued"
//                         borderRadius="200"
//                       >
//                         <Icon source={EmailIcon} tone="info" />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           EMAILS SENT
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           {emailCount.toLocaleString()}
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       {emailCount > 0
//                         ? "Customers notified successfully"
//                         : "Start sending your first emails"}
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Open Rate */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background="bg-surface-warning-subdued"
//                         borderRadius="200"
//                       >
//                         <Icon source={ViewIcon} tone="warning" />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           OPEN RATE
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           {emailCount > 0 ? `${openRate}%` : "0%"}
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       {emailCount > 0
//                         ? `${openedEmailCount} of ${emailCount} emails opened`
//                         : "Send emails to track open rates"}
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Templates Created */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background="bg-surface-secondary"
//                         borderRadius="200"
//                       >
//                         <Icon source={NoteIcon} tone="base" />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           TEMPLATES
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           Ready
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       Create your first template
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>
//             </InlineGrid>
//           </Layout.Section>
//         </Layout>

//         {/* Action Cards with Enhanced CTAs */}
//         <Layout>
//           <Layout.Section>
//             <BlockStack gap="500">
//               <Text variant="headingXl" as="h2" alignment="center">
//                 What would you like to do today?
//               </Text>

//               <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
//                 {/* Primary Actions */}
//                 <Card>
//                   <Box padding="600">
//                     <BlockStack gap="500">
//                       <Box
//                         padding="500"
//                         background="bg-surface-brand-subdued"
//                         borderRadius="300"
//                       >
//                         <InlineGrid
//                           gap="400"
//                           columns="auto 1fr auto"
//                           alignItems="center"
//                         >
//                           <Box
//                             padding="300"
//                             background="bg-surface-brand"
//                             borderRadius="200"
//                           >
//                             <Icon source={NoteIcon} tone="text-inverse" />
//                           </Box>
//                           <BlockStack gap="200">
//                             <Text variant="headingMd" as="h3">
//                               Create Email Templates
//                             </Text>
//                             <Text as="p" tone="subdued" variant="bodySm">
//                               Design professional email templates with our
//                               drag-and-drop editor
//                             </Text>
//                           </BlockStack>
//                           <Icon source={ChevronRightIcon} tone="subdued" />
//                         </InlineGrid>
//                       </Box>

//                       <Button
//                         onClick={() => handleNavigate("/app/templates")}
//                         variant="primary"
//                         size="large"
//                         fullWidth
//                       >
//                         Start Creating Templates
//                       </Button>
//                     </BlockStack>
//                   </Box>
//                 </Card>

//                 <Card>
//                   <Box padding="600">
//                     <BlockStack gap="500">
//                       <Box
//                         padding="500"
//                         background="bg-surface-success-subdued"
//                         borderRadius="300"
//                       >
//                         <InlineGrid
//                           gap="400"
//                           columns="auto 1fr auto"
//                           alignItems="center"
//                         >
//                           <Box
//                             padding="300"
//                             background="bg-surface-success"
//                             borderRadius="200"
//                           >
//                             <Icon source={HomeIcon} tone="text-inverse" />
//                           </Box>
//                           <BlockStack gap="200">
//                             <Text variant="headingMd" as="h3">
//                               Send Bulk Emails
//                             </Text>
//                             <Text as="p" tone="subdued" variant="bodySm">
//                               Select orders and send notifications to multiple
//                               customers at once
//                             </Text>
//                           </BlockStack>
//                           <Icon source={ChevronRightIcon} tone="subdued" />
//                         </InlineGrid>
//                       </Box>

//                       <Button
//                         onClick={() => handleNavigate("/app/dashboard-db")}
//                         variant="primary"
//                         size="large"
//                         fullWidth
//                         tone="success"
//                       >
//                         Go to Dashboard
//                       </Button>
//                     </BlockStack>
//                   </Box>
//                 </Card>
//               </InlineGrid>
//             </BlockStack>
//           </Layout.Section>
//         </Layout>

//         {/* Setup Guide with Visual Steps */}
//         <Layout>
//           <Layout.Section>
//             <Card>
//               <Box padding="800">
//                 <BlockStack gap="800">
//                   <BlockStack gap="400" align="center">
//                     <Badge tone="info" size="large">
//                       Setup Guide
//                     </Badge>
//                     <Text variant="heading2xl" as="h2" alignment="center">
//                       Get Up and Running in Minutes
//                     </Text>
//                     <Text
//                       as="p"
//                       tone="subdued"
//                       alignment="center"
//                       variant="bodyLg"
//                     >
//                       Follow these simple steps to start sending professional
//                       email notifications
//                     </Text>
//                   </BlockStack>

//                   <InlineGrid columns={{ xs: 1, md: 3 }} gap="600">
//                     {[
//                       {
//                         step: "01",
//                         title: "Configure Email Settings",
//                         description:
//                           "Set up and verify your sender email address for reliable delivery",
//                         icon: SettingsIcon,
//                         action: () => handleNavigate("/app/senderEmail"),
//                         buttonText: "Setup Email",
//                         color: "bg-surface-info",
//                         completed: false,
//                       },
//                       {
//                         step: "02",
//                         title: "Create Your Templates",
//                         description:
//                           "Design beautiful email templates with our intuitive editor",
//                         icon: NoteIcon,
//                         action: () => handleNavigate("/app/templates"),
//                         buttonText: "Create Templates",
//                         color: "bg-surface-warning",
//                         completed: false,
//                       },
//                       {
//                         step: "03",
//                         title: "Send Your First Email",
//                         description:
//                           "Select orders and send notifications to your customers",
//                         icon: EmailIcon,
//                         action: () => handleNavigate("/app/dashboard-db"),
//                         buttonText: "Start Sending",
//                         color: "bg-surface-success",
//                         completed: emailCount > 0,
//                       },
//                     ].map((step, index) => (
//                       <Card key={index} background="bg-surface-secondary">
//                         <Box padding="600">
//                           <BlockStack gap="500" align="center">
//                             <Box position="relative">
//                               <Box
//                                 padding="500"
//                                 background={step.color}
//                                 borderRadius="200"
//                               >
//                                 <Icon source={step.icon} tone="text-inverse" />
//                               </Box>
//                               {step.completed && (
//                                 <Box
//                                   position="absolute"
//                                   insetBlockEnd="-8px"
//                                   insetInlineEnd="-8px"
//                                   padding="100"
//                                   background="bg-surface-success"
//                                   borderRadius="100"
//                                 >
//                                   <Icon
//                                     source={CheckIcon}
//                                     tone="text-inverse"
//                                   />
//                                 </Box>
//                               )}
//                             </Box>

//                             <BlockStack gap="300" align="center">
//                               <Badge tone="subdued" size="small">
//                                 STEP {step.step}
//                               </Badge>
//                               <Text
//                                 variant="headingMd"
//                                 as="h3"
//                                 alignment="center"
//                               >
//                                 {step.title}
//                               </Text>
//                               <Text as="p" tone="subdued" alignment="center">
//                                 {step.description}
//                               </Text>
//                             </BlockStack>

//                             <Button
//                               onClick={step.action}
//                               size="medium"
//                               variant={step.completed ? "plain" : "primary"}
//                               fullWidth
//                             >
//                               {step.completed ? "✓ Completed" : step.buttonText}
//                             </Button>
//                           </BlockStack>
//                         </Box>
//                       </Card>
//                     ))}
//                   </InlineGrid>
//                 </BlockStack>
//               </Box>
//             </Card>
//           </Layout.Section>
//         </Layout>

//         {/* Enhanced Tips Section */}
//         <Layout>
//           <Layout.Section>
//             <InlineGrid columns={{ xs: 1, lg: "2fr 1fr" }} gap="600">
//               <Card>
//                 <Box padding="600">
//                   <BlockStack gap="600">
//                     <BlockStack gap="300">
//                       <InlineGrid
//                         gap="300"
//                         columns="auto 1fr"
//                         alignItems="center"
//                       >
//                         <Box
//                           padding="300"
//                           background="bg-surface-warning-subdued"
//                           borderRadius="100"
//                         >
//                           <Icon source={LightbulbIcon} tone="warning" />
//                         </Box>
//                         <Text variant="headingLg" as="h2">
//                           Pro Tips for Maximum Impact
//                         </Text>
//                       </InlineGrid>
//                       <Text as="p" tone="subdued">
//                         Learn from successful merchants who use Notify Rush
//                         effectively
//                       </Text>
//                     </BlockStack>

//                     <BlockStack gap="400">
//                       {[
//                         {
//                           title: "Segment Your Audience",
//                           description:
//                             "Use smart filters to send targeted messages. Customers who receive relevant emails are 3x more likely to engage.",
//                           icon: CheckIcon,
//                         },
//                         {
//                           title: "Professional & Credible  Template Copy",
//                           description:
//                             "A well-crafted email template leads to better open and response rates. Personalize your emails by including the customer's name, write a clear and engaging message body, and add a professional signature. These elements help your emails look more credible and increase the chances of getting noticed.",
//                           icon: CheckIcon,
//                         },
//                         {
//                           title: "Personalize Every Message",
//                           description:
//                             "Include customer names, order details, and purchase history to create meaningful connections.",
//                           icon: CheckIcon,
//                         },
//                         {
//                           title: "Time Your Emails Right",
//                           description:
//                             "Send shipping notifications within 2 hours of dispatch for maximum customer satisfaction.",
//                           icon: CheckIcon,
//                         },
//                       ].map((tip, index) => (
//                         <Box
//                           key={index}
//                           padding="400"
//                           background="bg-surface-secondary"
//                           borderRadius="300"
//                         >
//                           <InlineGrid
//                             gap="300"
//                             columns="auto 1fr"
//                             alignItems="start"
//                           >
//                             <Box
//                               padding="200"
//                               background="bg-surface-success"
//                               borderRadius="100"
//                             >
//                               <Icon source={tip.icon} tone="text-inverse" />
//                             </Box>
//                             <BlockStack gap="200">
//                               <Text variant="bodyMd" as="p">
//                                 <strong>{tip.title}</strong>
//                               </Text>
//                               <Text as="p" tone="subdued" variant="bodySm">
//                                 {tip.description}
//                               </Text>
//                             </BlockStack>
//                           </InlineGrid>
//                         </Box>
//                       ))}
//                     </BlockStack>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Enhanced Support Section */}
//               <BlockStack gap="400">
//                 <Card>
//                   <Box padding="500">
//                     <BlockStack gap="400">
//                       <BlockStack gap="200" align="center">
//                         <Text variant="headingMd" as="h3" alignment="center">
//                           Need Help Getting Started?
//                         </Text>
//                         <Text
//                           as="p"
//                           tone="subdued"
//                           alignment="center"
//                           variant="bodySm"
//                         >
//                           Our support team is here to help you succeed
//                         </Text>
//                       </BlockStack>

//                       <Divider />

//                       <BlockStack gap="300">
//                         <Button
//                           icon={BookIcon}
//                           fullWidth
//                           url="https://docs.notifyrush.com/"
//                           target="_blank"
//                           size="medium"
//                         >
//                           View Documentation
//                         </Button>
//                         <Button
//                           icon={ChatIcon}
//                           fullWidth
//                           onClick={() => handleNavigate("/app/contactUs")}
//                           variant="plain"
//                           size="medium"
//                         >
//                           Contact Support
//                         </Button>
//                       </BlockStack>
//                     </BlockStack>
//                   </Box>
//                 </Card>

//                 {/* Quick Links */}
//                 <Card>
//                   <Box padding="500">
//                     <BlockStack gap="400">
//                       <Text variant="headingMd" as="h3" alignment="center">
//                         Quick Links
//                       </Text>
//                       <BlockStack gap="200">
//                         {[
//                           { label: "Email Logs", path: "/app/email-logs" },
//                           { label: "Sync Data", path: "/app/syncData" },
//                           { label: "Email Config", path: "/app/senderEmail" },
//                         ].map((link, index) => (
//                           <Button
//                             key={index}
//                             onClick={() => handleNavigate(link.path)}
//                             variant="plain"
//                             fullWidth
//                             textAlign="start"
//                             icon={ChevronRightIcon}
//                           >
//                             {link.label}
//                           </Button>
//                         ))}
//                       </BlockStack>
//                     </BlockStack>
//                   </Box>
//                 </Card>
//               </BlockStack>
//             </InlineGrid>
//           </Layout.Section>
//         </Layout>

//         {/* Call to Action Footer */}
//         <Layout>
//           <Layout.Section>
//             <Card>
//               <Box
//                 padding="800"
//                 background="bg-surface-brand-subdued"
//                 borderRadius="400"
//               >
//                 <BlockStack gap="500" align="center">
//                   <Text variant="headingLg" as="h2" alignment="center">
//                     Ready to Transform Your Customer Communication?
//                   </Text>
//                   <Text as="p" tone="subdued" alignment="center">
//                     Join the growing community of merchants who trust Notify Rush for seamless email communication.
//                   </Text>
//                   <Button
//                     variant="primary"
//                     size="large"
//                     onClick={() => handleNavigate("/app/syncData")}
//                     icon={ImportIcon}
//                   >
//                     Start Your Journey Today
//                   </Button>
//                 </BlockStack>
//               </Box>
//             </Card>
//           </Layout.Section>
//         </Layout>
//       </BlockStack>
//     </Page>
//   );
// }


// import { json, LoaderFunction } from "@remix-run/node";
// import { useLoaderData, useNavigate } from "@remix-run/react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   Button,
//   BlockStack,
//   InlineGrid,
//   Box,
//   Icon,
//   Divider,
//   Badge,
//   ProgressBar,
//   Banner,
// } from "@shopify/polaris";
// import {
//   ImportIcon,
//   OrderIcon,
//   EmailIcon,
//   NoteIcon,
//   HomeIcon,
//   LightbulbIcon,
//   ChatIcon,
//   BookIcon,
//   CheckIcon,
//   SettingsIcon,
//   StarFilledIcon,
//   PlayIcon,
//   ChevronRightIcon,
//   ViewIcon,
// } from "@shopify/polaris-icons";
// import { authenticate } from "app/shopify.server";
// import db from "../db.server";

// type LoaderData = {
//   store: string;
//   orderCount: number;
//   emailCount: number;
//   openedEmailCount: number;
//   openRate: number;
//   templateCount: number;
// };

// export const loader: LoaderFunction = async ({ request }) => {
//   const { session } = await authenticate.admin(request);
//   const { shop } = session;

//   const orderCount = await db.order.count({ where: { shop } });
//   const emailCount = await db.emailLog.count({ where: { shop } });
//   const openedEmailCount = await db.emailLog.count({
//     where: {
//       shop,
//       isOpened: true,
//     },
//   });

//   // Count templates for this store - using shop as storeId
//   const templateCount = await db.emailTemplate.count({
//     where: {
//       storeId: shop,
//     },
//   });

//   // Calculate open rate percentage
//   const openRate = emailCount > 0 ? (openedEmailCount / emailCount) * 100 : 0;

//   return json({
//     store: shop,
//     orderCount,
//     emailCount,
//     openedEmailCount,
//     openRate: Math.round(openRate * 10) / 10, // Round to 1 decimal place
//     templateCount,
//   });
// };

// export default function IndexPage() {
//   const { store, orderCount, emailCount, openedEmailCount, openRate, templateCount } =
//     useLoaderData<LoaderData>();
//   const navigate = useNavigate();

//   const handleNavigate = (path: string) => {
//     navigate(path);
//   };

//   // Calculate setup progress
//   const setupSteps = [
//     { completed: orderCount > 0, label: "Data Synced" },
//     { completed: templateCount > 0, label: "Templates Created" },
//     { completed: emailCount > 0, label: "First Email Sent" },
//   ];
//   const completedSteps = setupSteps.filter((step) => step.completed).length;
//   const progressPercentage = (completedSteps / setupSteps.length) * 100;

//   return (
//     <Page fullWidth>
//       <BlockStack gap="800">
//         {/* Hero Section with Gradient Background */}
//         <Card>
//           <Box
//             padding="800"
//             background="bg-surface-brand-subdued"
//             borderRadius="400"
//           >
//             <BlockStack gap="600" align="center">
//               <div
//                 style={{
//                   background: "linear-gradient(90deg, #3b1f47, #5e3b7c)", // deep royal gradient
//                   color: "#f7e9b7", // soft gold
//                   fontSize: "20px",
//                   fontWeight: 600,
//                   padding: "14px 24px",
//                   borderRadius: "10px",
//                   textAlign: "center",
//                   boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
//                   marginBottom: "20px",
//                   letterSpacing: "0.6px",
//                   fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
//                 }}
//               >
//                 👑 Welcome to Notify Rush
//               </div>

//               <BlockStack gap="400" align="center">
//                 <Text variant="heading3xl" as="h1" alignment="center">
//                   Transform Your Customer Communication
//                 </Text>
//                 <Text as="p" tone="subdued" alignment="center" variant="bodyLg">
//                   Send professional email notifications at scale. Boost customer
//                   satisfaction with timely order updates, shipping
//                   notifications, and personalized messages.
//                 </Text>
//               </BlockStack>

//               <BlockStack gap="300" align="center">
//                 <InlineGrid gap="300" columns="auto auto" alignItems="center">
//                   <Button
//                     variant="primary"
//                     size="large"
//                     onClick={() => handleNavigate("/app/syncData")}
//                     icon={ImportIcon}
//                   >
//                     Get Started Now
//                   </Button>
//                   <Button
//                     icon={BookIcon}
//                     fullWidth
//                     url="https://docs.notifyrush.com/"
//                     target="_blank"
//                     size="medium"
//                   >
//                     Documentation
//                   </Button>
//                 </InlineGrid>

//                 {/* Progress Indicator */}
//                 {completedSteps > 0 && (
//                   <Box paddingBlockStart="400">
//                     <BlockStack gap="200" align="center">
//                       <Text variant="bodyMd" tone="subdued">
//                         Setup Progress: {completedSteps}/{setupSteps.length}{" "}
//                         completed
//                       </Text>
//                       <Box width="200px">
//                         <ProgressBar
//                           progress={progressPercentage}
//                           tone="success"
//                         />
//                       </Box>
//                     </BlockStack>
//                   </Box>
//                 )}
//               </BlockStack>
//             </BlockStack>
//           </Box>
//         </Card>

//         {/* Quick Stats with Enhanced Design */}
//         <Layout>
//           <Layout.Section>
//             <InlineGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="400">
//               {/* Orders Synced */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background="bg-surface-success-subdued"
//                         borderRadius="200"
//                       >
//                         <Icon source={OrderIcon} tone="success" />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           ORDERS SYNCED
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           {orderCount.toLocaleString()}
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       {orderCount > 0
//                         ? "Ready for notifications"
//                         : "Sync your store data to get started"}
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Emails Sent */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background="bg-surface-info-subdued"
//                         borderRadius="200"
//                       >
//                         <Icon source={EmailIcon} tone="info" />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           EMAILS SENT
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           {emailCount.toLocaleString()}
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       {emailCount > 0
//                         ? "Customers notified successfully"
//                         : "Start sending your first emails"}
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Open Rate */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background="bg-surface-warning-subdued"
//                         borderRadius="200"
//                       >
//                         <Icon source={ViewIcon} tone="warning" />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           OPEN RATE
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           {emailCount > 0 ? `${openRate}%` : "0%"}
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       {emailCount > 0
//                         ? `${openedEmailCount} of ${emailCount} emails opened`
//                         : "Send emails to track open rates"}
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Templates Created */}
//               <Card>
//                 <Box padding="500">
//                   <BlockStack gap="400">
//                     <InlineGrid
//                       gap="300"
//                       columns="auto 1fr"
//                       alignItems="center"
//                     >
//                       <Box
//                         padding="400"
//                         background={templateCount > 0 ? "bg-surface-brand-subdued" : "bg-surface-secondary"}
//                         borderRadius="200"
//                       >
//                         <Icon source={NoteIcon} tone={templateCount > 0 ? "base" : "base"} />
//                       </Box>
//                       <BlockStack gap="100">
//                         <Text variant="headingXs" tone="subdued">
//                           TEMPLATES
//                         </Text>
//                         <Text variant="heading2xl" as="p">
//                           {templateCount.toLocaleString()}
//                         </Text>
//                       </BlockStack>
//                     </InlineGrid>
//                     <Text as="p" tone="subdued" variant="bodySm">
//                       {templateCount > 0 
//                         ? `${templateCount} templates ready to use`
//                         : "Create your first template"}
//                     </Text>
//                   </BlockStack>
//                 </Box>
//               </Card>
//             </InlineGrid>
//           </Layout.Section>
//         </Layout>

//         {/* Action Cards with Enhanced CTAs */}
//         <Layout>
//           <Layout.Section>
//             <BlockStack gap="500">
//               <Text variant="headingXl" as="h2" alignment="center">
//                 What would you like to do today?
//               </Text>

//               <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
//                 {/* Primary Actions */}
//                 <Card>
//                   <Box padding="600">
//                     <BlockStack gap="500">
//                       <Box
//                         padding="500"
//                         background="bg-surface-brand-subdued"
//                         borderRadius="300"
//                       >
//                         <InlineGrid
//                           gap="400"
//                           columns="auto 1fr auto"
//                           alignItems="center"
//                         >
//                           <Box
//                             padding="300"
//                             background="bg-surface-brand"
//                             borderRadius="200"
//                           >
//                             <Icon source={NoteIcon} tone="text-inverse" />
//                           </Box>
//                           <BlockStack gap="200">
//                             <Text variant="headingMd" as="h3">
//                               {templateCount > 0 ? "Manage Email Templates" : "Create Email Templates"}
//                             </Text>
//                             <Text as="p" tone="subdued" variant="bodySm">
//                               {templateCount > 0 
//                                 ? "Edit existing templates or create new ones for different scenarios"
//                                 : "Design professional email templates with our drag-and-drop editor"
//                               }
//                             </Text>
//                           </BlockStack>
//                           <Icon source={ChevronRightIcon} tone="subdued" />
//                         </InlineGrid>
//                       </Box>

//                       <Button
//                         onClick={() => handleNavigate("/app/templates")}
//                         variant="primary"
//                         size="large"
//                         fullWidth
//                       >
//                         {templateCount > 0 ? "Manage Templates" : "Start Creating Templates"}
//                       </Button>
//                     </BlockStack>
//                   </Box>
//                 </Card>

//                 <Card>
//                   <Box padding="600">
//                     <BlockStack gap="500">
//                       <Box
//                         padding="500"
//                         background="bg-surface-success-subdued"
//                         borderRadius="300"
//                       >
//                         <InlineGrid
//                           gap="400"
//                           columns="auto 1fr auto"
//                           alignItems="center"
//                         >
//                           <Box
//                             padding="300"
//                             background="bg-surface-success"
//                             borderRadius="200"
//                           >
//                             <Icon source={HomeIcon} tone="text-inverse" />
//                           </Box>
//                           <BlockStack gap="200">
//                             <Text variant="headingMd" as="h3">
//                               Send Bulk Emails
//                             </Text>
//                             <Text as="p" tone="subdued" variant="bodySm">
//                               Select orders and send notifications to multiple
//                               customers at once
//                             </Text>
//                           </BlockStack>
//                           <Icon source={ChevronRightIcon} tone="subdued" />
//                         </InlineGrid>
//                       </Box>

//                       <Button
//                         onClick={() => handleNavigate("/app/dashboard-db")}
//                         variant="primary"
//                         size="large"
//                         fullWidth
//                         tone="success"
//                       >
//                         Go to Dashboard
//                       </Button>
//                     </BlockStack>
//                   </Box>
//                 </Card>
//               </InlineGrid>
//             </BlockStack>
//           </Layout.Section>
//         </Layout>

//         {/* Setup Guide with Visual Steps */}
//         <Layout>
//           <Layout.Section>
//             <Card>
//               <Box padding="800">
//                 <BlockStack gap="800">
//                   <BlockStack gap="400" align="center">
//                     <Badge tone="info" size="large">
//                       Setup Guide
//                     </Badge>
//                     <Text variant="heading2xl" as="h2" alignment="center">
//                       Get Up and Running in Minutes
//                     </Text>
//                     <Text
//                       as="p"
//                       tone="subdued"
//                       alignment="center"
//                       variant="bodyLg"
//                     >
//                       Follow these simple steps to start sending professional
//                       email notifications
//                     </Text>
//                   </BlockStack>

//                   <InlineGrid columns={{ xs: 1, md: 3 }} gap="600">
//                     {[
//                       {
//                         step: "01",
//                         title: "Configure Email Settings",
//                         description:
//                           "Set up and verify your sender email address for reliable delivery",
//                         icon: SettingsIcon,
//                         action: () => handleNavigate("/app/senderEmail"),
//                         buttonText: "Setup Email",
//                         color: "bg-surface-info",
//                         completed: false,
//                       },
//                       {
//                         step: "02",
//                         title: "Create Your Templates",
//                         description:
//                           "Design beautiful email templates with our intuitive editor",
//                         icon: NoteIcon,
//                         action: () => handleNavigate("/app/templates"),
//                         buttonText: templateCount > 0 ? "Manage Templates" : "Create Templates",
//                         color: "bg-surface-warning",
//                         completed: templateCount > 0,
//                       },
//                       {
//                         step: "03",
//                         title: "Send Your First Email",
//                         description:
//                           "Select orders and send notifications to your customers",
//                         icon: EmailIcon,
//                         action: () => handleNavigate("/app/dashboard-db"),
//                         buttonText: "Start Sending",
//                         color: "bg-surface-success",
//                         completed: emailCount > 0,
//                       },
//                     ].map((step, index) => (
//                       <Card key={index} background="bg-surface-secondary">
//                         <Box padding="600">
//                           <BlockStack gap="500" align="center">
//                             <Box position="relative">
//                               <Box
//                                 padding="500"
//                                 background={step.color}
//                                 borderRadius="200"
//                               >
//                                 <Icon source={step.icon} tone="text-inverse" />
//                               </Box>
//                               {step.completed && (
//                                 <Box
//                                   position="absolute"
//                                   insetBlockEnd="-8px"
//                                   insetInlineEnd="-8px"
//                                   padding="100"
//                                   background="bg-surface-success"
//                                   borderRadius="100"
//                                 >
//                                   <Icon
//                                     source={CheckIcon}
//                                     tone="text-inverse"
//                                   />
//                                 </Box>
//                               )}
//                             </Box>

//                             <BlockStack gap="300" align="center">
//                               <Badge tone="subdued" size="small">
//                                 STEP {step.step}
//                               </Badge>
//                               <Text
//                                 variant="headingMd"
//                                 as="h3"
//                                 alignment="center"
//                               >
//                                 {step.title}
//                               </Text>
//                               <Text as="p" tone="subdued" alignment="center">
//                                 {step.description}
//                               </Text>
//                             </BlockStack>

//                             <Button
//                               onClick={step.action}
//                               size="medium"
//                               variant={step.completed ? "plain" : "primary"}
//                               fullWidth
//                             >
//                               {step.completed ? "✓ Completed" : step.buttonText}
//                             </Button>
//                           </BlockStack>
//                         </Box>
//                       </Card>
//                     ))}
//                   </InlineGrid>
//                 </BlockStack>
//               </Box>
//             </Card>
//           </Layout.Section>
//         </Layout>

//         {/* Enhanced Tips Section */}
//         <Layout>
//           <Layout.Section>
//             <InlineGrid columns={{ xs: 1, lg: "2fr 1fr" }} gap="600">
//               <Card>
//                 <Box padding="600">
//                   <BlockStack gap="600">
//                     <BlockStack gap="300">
//                       <InlineGrid
//                         gap="300"
//                         columns="auto 1fr"
//                         alignItems="center"
//                       >
//                         <Box
//                           padding="300"
//                           background="bg-surface-warning-subdued"
//                           borderRadius="100"
//                         >
//                           <Icon source={LightbulbIcon} tone="warning" />
//                         </Box>
//                         <Text variant="headingLg" as="h2">
//                           Pro Tips for Maximum Impact
//                         </Text>
//                       </InlineGrid>
//                       <Text as="p" tone="subdued">
//                         Learn from successful merchants who use Notify Rush
//                         effectively
//                       </Text>
//                     </BlockStack>

//                     <BlockStack gap="400">
//                       {[
//                         {
//                           title: "Segment Your Audience",
//                           description:
//                             "Use smart filters to send targeted messages. Customers who receive relevant emails are 3x more likely to engage.",
//                           icon: CheckIcon,
//                         },
//                         {
//                           title: "Professional & Credible Template Copy",
//                           description:
//                             "A well-crafted email template leads to better open and response rates. Personalize your emails by including the customer's name, write a clear and engaging message body, and add a professional signature. These elements help your emails look more credible and increase the chances of getting noticed.",
//                           icon: CheckIcon,
//                         },
//                         {
//                           title: "Personalize Every Message",
//                           description:
//                             "Include customer names, order details, and purchase history to create meaningful connections.",
//                           icon: CheckIcon,
//                         },
//                         {
//                           title: "Time Your Emails Right",
//                           description:
//                             "Send shipping notifications within 2 hours of dispatch for maximum customer satisfaction.",
//                           icon: CheckIcon,
//                         },
//                       ].map((tip, index) => (
//                         <Box
//                           key={index}
//                           padding="400"
//                           background="bg-surface-secondary"
//                           borderRadius="300"
//                         >
//                           <InlineGrid
//                             gap="300"
//                             columns="auto 1fr"
//                             alignItems="start"
//                           >
//                             <Box
//                               padding="200"
//                               background="bg-surface-success"
//                               borderRadius="100"
//                             >
//                               <Icon source={tip.icon} tone="text-inverse" />
//                             </Box>
//                             <BlockStack gap="200">
//                               <Text variant="bodyMd" as="p">
//                                 <strong>{tip.title}</strong>
//                               </Text>
//                               <Text as="p" tone="subdued" variant="bodySm">
//                                 {tip.description}
//                               </Text>
//                             </BlockStack>
//                           </InlineGrid>
//                         </Box>
//                       ))}
//                     </BlockStack>
//                   </BlockStack>
//                 </Box>
//               </Card>

//               {/* Enhanced Support Section */}
//               <BlockStack gap="400">
//                 <Card>
//                   <Box padding="500">
//                     <BlockStack gap="400">
//                       <BlockStack gap="200" align="center">
//                         <Text variant="headingMd" as="h3" alignment="center">
//                           Need Help Getting Started?
//                         </Text>
//                         <Text
//                           as="p"
//                           tone="subdued"
//                           alignment="center"
//                           variant="bodySm"
//                         >
//                           Our support team is here to help you succeed
//                         </Text>
//                       </BlockStack>

//                       <Divider />

//                       <BlockStack gap="300">
//                         <Button
//                           icon={BookIcon}
//                           fullWidth
//                           url="https://docs.notifyrush.com/"
//                           target="_blank"
//                           size="medium"
//                         >
//                           View Documentation
//                         </Button>
//                         <Button
//                           icon={ChatIcon}
//                           fullWidth
//                           onClick={() => handleNavigate("/app/contactUs")}
//                           variant="plain"
//                           size="medium"
//                         >
//                           Contact Support
//                         </Button>
//                       </BlockStack>
//                     </BlockStack>
//                   </Box>
//                 </Card>

//                 {/* Quick Links */}
//                 <Card>
//                   <Box padding="500">
//                     <BlockStack gap="400">
//                       <Text variant="headingMd" as="h3" alignment="center">
//                         Quick Links
//                       </Text>
//                       <BlockStack gap="200">
//                         {[
//                           { label: "Email Logs", path: "/app/email-logs" },
//                           { label: "Sync Data", path: "/app/syncData" },
//                           { label: "Email Config", path: "/app/senderEmail" },
//                         ].map((link, index) => (
//                           <Button
//                             key={index}
//                             onClick={() => handleNavigate(link.path)}
//                             variant="plain"
//                             fullWidth
//                             textAlign="start"
//                             icon={ChevronRightIcon}
//                           >
//                             {link.label}
//                           </Button>
//                         ))}
//                       </BlockStack>
//                     </BlockStack>
//                   </Box>
//                 </Card>
//               </BlockStack>
//             </InlineGrid>
//           </Layout.Section>
//         </Layout>

//         {/* Call to Action Footer */}
//         <Layout>
//           <Layout.Section>
//             <Card>
//               <Box
//                 padding="800"
//                 background="bg-surface-brand-subdued"
//                 borderRadius="400"
//               >
//                 <BlockStack gap="500" align="center">
//                   <Text variant="headingLg" as="h2" alignment="center">
//                     Ready to Transform Your Customer Communication?
//                   </Text>
//                   <Text as="p" tone="subdued" alignment="center">
//                     Join the growing community of merchants who trust Notify Rush for seamless email communication.
//                   </Text>
//                   <Button
//                     variant="primary"
//                     size="large"
//                     onClick={() => handleNavigate("/app/syncData")}
//                     icon={ImportIcon}
//                   >
//                     Start Your Journey Today
//                   </Button>
//                 </BlockStack>
//               </Box>
//             </Card>
//           </Layout.Section>
//         </Layout>
//       </BlockStack>
//     </Page>
//   );
// }


import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineGrid,
  Box,
  Icon,
  Divider,
  Badge,
  ProgressBar,
  Banner,
} from "@shopify/polaris";
import {
  ImportIcon,
  OrderIcon,
  EmailIcon,
  NoteIcon,
  HomeIcon,
  LightbulbIcon,
  ChatIcon,
  BookIcon,
  CheckIcon,
  SettingsIcon,
  StarFilledIcon,
  PlayIcon,
  ChevronRightIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "app/shopify.server";
import db from "../db.server";
import { useEffect } from "react";

type LoaderData = {
  store: string;
  orderCount: number;
  emailCount: number;
  openedEmailCount: number;
  openRate: number;
  templateCount: number;
  isEmailConfigured: boolean;   hasActivePayment: boolean;
  appSubscriptions: {
   name: string;
 }[]; // Specify that this is an array
};

export const loader: LoaderFunction = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;



  
 

 

  try {
      const orderCount = await db.order.count({ where: { shop } });
  const emailCount = await db.emailLog.count({ where: { shop } });
  const openedEmailCount = await db.emailLog.count({
    where: {
      shop,
      isOpened: true,
    },
  });
   // Count templates for this store - using shop as storeId
  const templateCount = await db.emailTemplate.count({
    where: {
      storeId: shop,
    },
  });

   // Check if email is configured (at least one record with isVerified=true AND isActive=true)
  const configuredEmail = await db.senderEmail.findFirst({
    where: {
      shop,
      isVerified: true,
      isActive: true,
    },
  });
  const isEmailConfigured = !!configuredEmail;

  // Calculate open rate percentage
  const openRate = emailCount > 0 ? (openedEmailCount / emailCount) * 100 : 0;

       const { hasActivePayment, appSubscriptions } = await billing.check({
       session,
       isTest: true,
    });

    return json({
    store: shop,
    orderCount,
    emailCount,
    openedEmailCount,
    openRate: Math.round(openRate * 10) / 10, // Round to 1 decimal place
    templateCount,
    isEmailConfigured,
    hasActivePayment,
    appSubscriptions: appSubscriptions.map((sub) => ({
    name: sub.name,
   })),
  });

  } catch (error) {
    
  }


};

export default function IndexPage() {
  const {
    store,
    orderCount,
    emailCount,
    openedEmailCount,
    openRate,
    templateCount,
    isEmailConfigured,
    hasActivePayment
  } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
   const url = store;

 // Remove '.myshopify.com' using replace method
 const storeName = url.replace(".myshopify.com", "");

 if (!hasActivePayment) {
   useEffect(() => {
     window.parent.location.href = `https://admin.shopify.com/store/${storeName}/charges/notifyrush/pricing_plans`;
   }, []);
 }

  
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Calculate setup progress - 3 main tasks for merchants
  const setupSteps = [
    { completed: isEmailConfigured, label: "Email Settings Configured" },
    { completed: templateCount > 0, label: "Templates Created" },
    { completed: emailCount > 0, label: "First Email Sent" },
  ];
  const completedSteps = setupSteps.filter((step) => step.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  return (
    <Page fullWidth>
      <BlockStack gap="800">
        {/* Hero Section with Gradient Background */}
        <Card>
          <Box
            padding="800"
            background="bg-surface-brand-subdued"
            borderRadius="400"
          >
            <BlockStack gap="600" align="center">
              <div
                style={{
                  background: "linear-gradient(90deg, #3b1f47, #5e3b7c)", // deep royal gradient
                  color: "#f7e9b7", // soft gold
                  fontSize: "20px",
                  fontWeight: 600,
                  padding: "14px 24px",
                  borderRadius: "10px",
                  textAlign: "center",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                  marginBottom: "20px",
                  letterSpacing: "0.6px",
                  fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                }}
              >
                👑 Welcome to Notify Rush
              </div>

              <BlockStack gap="400" align="center">
                <Text variant="heading3xl" as="h1" alignment="center">
                  Transform Your Customer Communication
                </Text>
                <Text as="p" tone="subdued" alignment="center" variant="bodyLg">
                  Send professional email notifications at scale. Boost customer
                  satisfaction with timely order updates, shipping
                  notifications, and personalized messages.
                </Text>
              </BlockStack>

              <BlockStack gap="300" align="center">
                <InlineGrid gap="300" columns="auto auto" alignItems="center">
                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => handleNavigate("/app/syncData")}
                    icon={ImportIcon}
                  >
                    Get Started Now
                  </Button>
                  <Button
                    icon={BookIcon}
                    fullWidth
                    url="https://docs.notifyrush.com/"
                    target="_blank"
                    size="medium"
                  >
                    Documentation
                  </Button>
                </InlineGrid>

                {/* Progress Indicator - Always show for merchants */}
                <Box paddingBlockStart="400">
                  <BlockStack gap="300" align="center">
                    <p style={{
                     fontSize: "14px",
                      justifyContent: "center",
                      paddingLeft: "8px",
                      marginBottom: "20px"
                    }}>
                      Please click on "Get Started Now" above to Sync
                      Orders first.
                    </p>
                    <Text variant="bodyMd" tone="subdued">
                      Setup Progress: {completedSteps}/{setupSteps.length}{" "}
                      completed
                    </Text>
                    <Box width="300px">
                      <ProgressBar
                        progress={progressPercentage}
                        tone="success"
                      />
                    </Box>
                  </BlockStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Box>
        </Card>

        {/* Quick Stats with Enhanced Design */}
        <Layout>
          <Layout.Section>
            <InlineGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="400">
              {/* Orders Synced */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineGrid
                      gap="300"
                      columns="auto 1fr"
                      alignItems="center"
                    >
                      <Box
                        padding="400"
                        background="bg-surface-success-subdued"
                        borderRadius="200"
                      >
                        <Icon source={OrderIcon} tone="success" />
                      </Box>
                      <BlockStack gap="100">
                        <Text variant="headingXs" tone="subdued">
                          ORDERS SYNCED
                        </Text>
                        <Text variant="heading2xl" as="p">
                          {orderCount.toLocaleString()}
                        </Text>
                      </BlockStack>
                    </InlineGrid>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {orderCount > 0
                        ? "Ready for notifications"
                        : "Sync your store data to get started"}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>

              {/* Emails Sent */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineGrid
                      gap="300"
                      columns="auto 1fr"
                      alignItems="center"
                    >
                      <Box
                        padding="400"
                        background="bg-surface-info-subdued"
                        borderRadius="200"
                      >
                        <Icon source={EmailIcon} tone="info" />
                      </Box>
                      <BlockStack gap="100">
                        <Text variant="headingXs" tone="subdued">
                          EMAILS SENT
                        </Text>
                        <Text variant="heading2xl" as="p">
                          {emailCount.toLocaleString()}
                        </Text>
                      </BlockStack>
                    </InlineGrid>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {emailCount > 0
                        ? "Customers notified successfully"
                        : "Start sending your first emails"}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>

              {/* Open Rate */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineGrid
                      gap="300"
                      columns="auto 1fr"
                      alignItems="center"
                    >
                      <Box
                        padding="400"
                        background="bg-surface-warning-subdued"
                        borderRadius="200"
                      >
                        <Icon source={ViewIcon} tone="warning" />
                      </Box>
                      <BlockStack gap="100">
                        <Text variant="headingXs" tone="subdued">
                          OPEN RATE
                        </Text>
                        <Text variant="heading2xl" as="p">
                          {emailCount > 0 ? `${openRate}%` : "0%"}
                        </Text>
                      </BlockStack>
                    </InlineGrid>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {emailCount > 0
                        ? `${openedEmailCount} of ${emailCount} emails opened`
                        : "Send emails to track open rates"}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>

              {/* Templates Created */}
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">
                    <InlineGrid
                      gap="300"
                      columns="auto 1fr"
                      alignItems="center"
                    >
                      <Box
                        padding="400"
                        background={
                          templateCount > 0
                            ? "bg-surface-brand-subdued"
                            : "bg-surface-secondary"
                        }
                        borderRadius="200"
                      >
                        <Icon
                          source={NoteIcon}
                          tone={templateCount > 0 ? "base" : "base"}
                        />
                      </Box>
                      <BlockStack gap="100">
                        <Text variant="headingXs" tone="subdued">
                          TEMPLATES
                        </Text>
                        <Text variant="heading2xl" as="p">
                          {templateCount.toLocaleString()}
                        </Text>
                      </BlockStack>
                    </InlineGrid>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {templateCount > 0
                        ? `${templateCount} templates ready to use`
                        : "Create your first template"}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            </InlineGrid>
          </Layout.Section>
        </Layout>

        {/* Action Cards with Enhanced CTAs */}
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <Text variant="headingXl" as="h2" alignment="center">
                What would you like to do today?
              </Text>

              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                {/* Primary Actions */}
                <Card>
                  <Box padding="600">
                    <BlockStack gap="500">
                      <Box
                        padding="500"
                        background="bg-surface-brand-subdued"
                        borderRadius="300"
                      >
                        <InlineGrid
                          gap="400"
                          columns="auto 1fr auto"
                          alignItems="center"
                        >
                          <Box
                            padding="300"
                            background="bg-surface-brand"
                            borderRadius="200"
                          >
                            <Icon source={NoteIcon} tone="text-inverse" />
                          </Box>
                          <BlockStack gap="200">
                            <Text variant="headingMd" as="h3">
                              {templateCount > 0
                                ? "Manage Email Templates"
                                : "Create Email Templates"}
                            </Text>
                            <Text as="p" tone="subdued" variant="bodySm">
                              {templateCount > 0
                                ? "Edit existing templates or create new ones for different scenarios"
                                : "Design professional email templates with our drag-and-drop editor"}
                            </Text>
                          </BlockStack>
                          <Icon source={ChevronRightIcon} tone="subdued" />
                        </InlineGrid>
                      </Box>

                      <Button
                        onClick={() => handleNavigate("/app/templates")}
                        variant="primary"
                        size="large"
                        fullWidth
                      >
                        {templateCount > 0
                          ? "Manage Templates"
                          : "Start Creating Templates"}
                      </Button>
                    </BlockStack>
                  </Box>
                </Card>

                <Card>
                  <Box padding="600">
                    <BlockStack gap="500">
                      <Box
                        padding="500"
                        background="bg-surface-success-subdued"
                        borderRadius="300"
                      >
                        <InlineGrid
                          gap="400"
                          columns="auto 1fr auto"
                          alignItems="center"
                        >
                          <Box
                            padding="300"
                            background="bg-surface-success"
                            borderRadius="200"
                          >
                            <Icon source={HomeIcon} tone="text-inverse" />
                          </Box>
                          <BlockStack gap="200">
                            <Text variant="headingMd" as="h3">
                              Send Bulk Emails
                            </Text>
                            <Text as="p" tone="subdued" variant="bodySm">
                              Select orders and send notifications to multiple
                              customers at once
                            </Text>
                          </BlockStack>
                          <Icon source={ChevronRightIcon} tone="subdued" />
                        </InlineGrid>
                      </Box>

                      <Button
                        onClick={() => handleNavigate("/app/dashboard-db")}
                        variant="primary"
                        size="large"
                        fullWidth
                        tone="success"
                      >
                        Go to Dashboard
                      </Button>
                    </BlockStack>
                  </Box>
                </Card>
              </InlineGrid>
            </BlockStack>
          </Layout.Section>
        </Layout>

        {/* Setup Guide with Visual Steps */}
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="800">
                  <BlockStack gap="400" align="center">
                    <Badge tone="info" size="large">
                      Setup Guide
                    </Badge>
                    <Text variant="heading2xl" as="h2" alignment="center">
                      Get Up and Running in Minutes
                    </Text>
                    <Text
                      as="p"
                      tone="subdued"
                      alignment="center"
                      variant="bodyLg"
                    >
                      Follow these simple steps to start sending professional
                      email notifications
                    </Text>
                  </BlockStack>

                  <InlineGrid columns={{ xs: 1, md: 3 }} gap="600">
                    {[
                      {
                        step: "01",
                        title: "Configure Email Settings",
                        description:
                          "Set up and verify your sender email address for reliable delivery",
                        icon: SettingsIcon,
                        action: () => handleNavigate("/app/senderEmail"),
                        buttonText: isEmailConfigured
                          ? "Manage Email Settings"
                          : "Setup Email",
                        color: "bg-surface-info",
                        completed: isEmailConfigured,
                      },
                      {
                        step: "02",
                        title: "Create Your Templates",
                        description:
                          "Design beautiful email templates with our intuitive editor",
                        icon: NoteIcon,
                        action: () => handleNavigate("/app/templates"),
                        buttonText:
                          templateCount > 0
                            ? "Manage Templates"
                            : "Create Templates",
                        color: "bg-surface-warning",
                        completed: templateCount > 0,
                      },
                      {
                        step: "03",
                        title: "Send Your First Email",
                        description:
                          "Select orders and send notifications to your customers",
                        icon: EmailIcon,
                        action: () => handleNavigate("/app/dashboard-db"),
                        buttonText:
                          emailCount > 0 ? "Send More Emails" : "Start Sending",
                        color: "bg-surface-success",
                        completed: emailCount > 0,
                      },
                    ].map((step, index) => (
                      <Card key={index} background="bg-surface-secondary">
                        <Box padding="600">
                          <BlockStack gap="500" align="center">
                            <Box position="relative">
                              <Box
                                padding="500"
                                background={step.color}
                                borderRadius="200"
                              >
                                <Icon source={step.icon} tone="text-inverse" />
                              </Box>
                              {step.completed && (
                                <Box
                                  position="absolute"
                                  insetBlockEnd="-8px"
                                  insetInlineEnd="-8px"
                                  padding="100"
                                  background="bg-surface-success"
                                  borderRadius="100"
                                >
                                  <Icon
                                    source={CheckIcon}
                                    tone="text-inverse"
                                  />
                                </Box>
                              )}
                            </Box>

                            <BlockStack gap="300" align="center">
                              <Badge tone="subdued" size="small">
                                STEP {step.step}
                              </Badge>
                              <Text
                                variant="headingMd"
                                as="h3"
                                alignment="center"
                              >
                                {step.title}
                              </Text>
                              <Text as="p" tone="subdued" alignment="center">
                                {step.description}
                              </Text>
                            </BlockStack>

                            <Button
                              onClick={step.action}
                              size="medium"
                              variant={step.completed ? "plain" : "primary"}
                              fullWidth
                            >
                              {step.completed ? "✓ Completed" : step.buttonText}
                            </Button>
                          </BlockStack>
                        </Box>
                      </Card>
                    ))}
                  </InlineGrid>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Enhanced Tips Section */}
        <Layout>
          <Layout.Section>
            <InlineGrid columns={{ xs: 1, lg: "2fr 1fr" }} gap="600">
              <Card>
                <Box padding="600">
                  <BlockStack gap="600">
                    <BlockStack gap="300">
                      <InlineGrid
                        gap="300"
                        columns="auto 1fr"
                        alignItems="center"
                      >
                        <Box
                          padding="300"
                          background="bg-surface-warning-subdued"
                          borderRadius="100"
                        >
                          <Icon source={LightbulbIcon} tone="warning" />
                        </Box>
                        <Text variant="headingLg" as="h2">
                          Pro Tips for Maximum Impact
                        </Text>
                      </InlineGrid>
                      <Text as="p" tone="subdued">
                        Learn from successful merchants who use Notify Rush
                        effectively
                      </Text>
                    </BlockStack>

                    <BlockStack gap="400">
                      {[
                        {
                          title: "Segment Your Audience",
                          description:
                            "Use smart filters to send targeted messages. Customers who receive relevant emails are 3x more likely to engage.",
                          icon: CheckIcon,
                        },
                        {
                          title: "Professional & Credible Template Copy",
                          description:
                            "A well-crafted email template leads to better open and response rates. Personalize your emails by including the customer's name, write a clear and engaging message body, and add a professional signature. These elements help your emails look more credible and increase the chances of getting noticed.",
                          icon: CheckIcon,
                        },
                        {
                          title: "Personalize Every Message",
                          description:
                            "Include customer names, order details, and purchase history to create meaningful connections.",
                          icon: CheckIcon,
                        },
                        {
                          title: "Time Your Emails Right",
                          description:
                            "Send shipping notifications within 2 hours of dispatch for maximum customer satisfaction.",
                          icon: CheckIcon,
                        },
                      ].map((tip, index) => (
                        <Box
                          key={index}
                          padding="400"
                          background="bg-surface-secondary"
                          borderRadius="300"
                        >
                          <InlineGrid
                            gap="300"
                            columns="auto 1fr"
                            alignItems="start"
                          >
                            <Box
                              padding="200"
                              background="bg-surface-success"
                              borderRadius="100"
                            >
                              <Icon source={tip.icon} tone="text-inverse" />
                            </Box>
                            <BlockStack gap="200">
                              <Text variant="bodyMd" as="p">
                                <strong>{tip.title}</strong>
                              </Text>
                              <Text as="p" tone="subdued" variant="bodySm">
                                {tip.description}
                              </Text>
                            </BlockStack>
                          </InlineGrid>
                        </Box>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Box>
              </Card>

              {/* Enhanced Support Section */}
              <BlockStack gap="400">
                <Card>
                  <Box padding="500">
                    <BlockStack gap="400">
                      <BlockStack gap="200" align="center">
                        <Text variant="headingMd" as="h3" alignment="center">
                          Need Help Getting Started?
                        </Text>
                        <Text
                          as="p"
                          tone="subdued"
                          alignment="center"
                          variant="bodySm"
                        >
                          Our support team is here to help you succeed
                        </Text>
                      </BlockStack>

                      <Divider />

                      <BlockStack gap="300">
                        <Button
                          icon={BookIcon}
                          fullWidth
                          url="https://docs.notifyrush.com/"
                          target="_blank"
                          size="medium"
                        >
                          View Documentation
                        </Button>
                        <Button
                          icon={ChatIcon}
                          fullWidth
                          onClick={() => handleNavigate("/app/contactUs")}
                          variant="plain"
                          size="medium"
                        >
                          Contact Support
                        </Button>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                </Card>

                {/* Quick Links */}
                <Card>
                  <Box padding="500">
                    <BlockStack gap="400">
                      <Text variant="headingMd" as="h3" alignment="center">
                        Quick Links
                      </Text>
                      <BlockStack gap="200">
                        {[
                          { label: "Email Logs", path: "/app/email-logs" },
                          { label: "Sync Data", path: "/app/syncData" },
                          { label: "Email Config", path: "/app/senderEmail" },
                        ].map((link, index) => (
                          <Button
                            key={index}
                            onClick={() => handleNavigate(link.path)}
                            variant="plain"
                            fullWidth
                            textAlign="start"
                            icon={ChevronRightIcon}
                          >
                            {link.label}
                          </Button>
                        ))}
                      </BlockStack>
                    </BlockStack>
                  </Box>
                </Card>
              </BlockStack>
            </InlineGrid>
          </Layout.Section>
        </Layout>

        {/* Call to Action Footer */}
        <Layout>
          <Layout.Section>
            <Card>
              <Box
                padding="800"
                background="bg-surface-brand-subdued"
                borderRadius="400"
              >
                <BlockStack gap="500" align="center">
                  <Text variant="headingLg" as="h2" alignment="center">
                    Ready to Transform Your Customer Communication?
                  </Text>
                  <Text as="p" tone="subdued" alignment="center">
                    Join the growing community of merchants who trust Notify
                    Rush for seamless email communication.
                  </Text>
                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => handleNavigate("/app/syncData")}
                    icon={ImportIcon}
                  >
                    Start Your Journey Today
                  </Button>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
