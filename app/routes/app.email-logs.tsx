// import { LoaderFunction, json } from "@remix-run/node";
// import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
// import { PrismaClient } from "@prisma/client";
// import { Card, Layout, DataTable, Button, Text } from "@shopify/polaris";
// import { format } from "date-fns";
// import { authenticate } from "app/shopify.server";

// const prisma = new PrismaClient();
// const ITEMS_PER_PAGE = 20;

// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const pageParam = url.searchParams.get("page");
//   const page = pageParam ? parseInt(pageParam, 10) : 1;

//   const totalLogsCount = await prisma.emailLog.count({ where: { shop } });
//   const totalPages = Math.ceil(totalLogsCount / ITEMS_PER_PAGE);

//   const skip = (page - 1) * ITEMS_PER_PAGE;
//   const take = ITEMS_PER_PAGE;

//   const emailLogs = await prisma.emailLog.findMany({
//     where: { shop },
//     orderBy: { sentAt: "desc" },
//     skip,
//     take,
//   });

//   return json({ emailLogs, totalPages, currentPage: page });
// };

// export default function EmailLogList() {
//   const { emailLogs, totalPages, currentPage } = useLoaderData<{
//     emailLogs: any[];
//     totalPages: number;
//     currentPage: number;
//   }>();

//   const [searchParams] = useSearchParams();
//   const submit = useSubmit();

//   const rows = emailLogs.map((log) => [
//     log.orderId,
//     log.customerName,
//     log.email,
//     log.subject,
//     log.sentCount,
//     log.isBouncedBack ? "Yes" : "No",
//     log.deliveryStatus || "Pending",
//     format(new Date(log.sentAt), "yyyy-MM-dd HH:mm:ss"),
//   ]);

//   // Function to change pages
//   const goToPage = (page: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", page.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   return (
//     <Layout>
//       <Layout.Section>
//         <Card sectioned title="Sent Emails">
//           <DataTable
//             columnContentTypes={[
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//             ]}
//             headings={[
//               <Text variant="headingMd" as="h6">Order ID</Text>,
//               <Text variant="headingMd" as="h6">Customer Name</Text>,
//               <Text variant="headingMd" as="h6">Recipient Email</Text>,
//               <Text variant="headingMd" as="h6">Subject</Text>,
//               <Text variant="headingMd" as="h6">Sent Count</Text>,
//               <Text variant="headingMd" as="h6">Bounced</Text>,
//               <Text variant="headingMd" as="h6">Delivery Status</Text>,
//               <Text variant="headingMd" as="h6">Sent At</Text>,
//             ]}
//             rows={rows}
//           />

//           {totalPages > 1 && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginTop: "20px",
//               }}
//             >
//               {/* First Page: Only Next and Last visible */}
//               {/* Last Page: Only First and Previous visible */}
//               {/* On pages 2 to second-last: First, Previous, Next, Last as appropriate */}
//               {/* On second page: First, Next, Last (no Previous) */}

//               {currentPage > 1 && (
//                 <>
//                   <Button onClick={() => goToPage(1)}>First</Button>
//                   {/* Show Previous only if not on first or second page */}
//                   {currentPage > 2 && (
//                     <Button onClick={() => goToPage(currentPage - 1)}>
//                       Previous
//                     </Button>
//                   )}
//                 </>
//               )}

//               <Text variant="bodyMd">
//                 Page {currentPage} of {totalPages}
//               </Text>

//               {currentPage < totalPages && (
//                 <>
//                   <Button onClick={() => goToPage(currentPage + 1)}>
//                     Next
//                   </Button>
//                   <Button onClick={() => goToPage(totalPages)}>Last</Button>
//                 </>
//               )}
//             </div>
//           )}
//         </Card>
//       </Layout.Section>
//     </Layout>
//   );
// }


// import { LoaderFunction, json } from "@remix-run/node";
// import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
// import { PrismaClient } from "@prisma/client";
// import { Card, Layout, DataTable, Button, Text } from "@shopify/polaris";
// import { format } from "date-fns";
// import { authenticate } from "app/shopify.server";

// const prisma = new PrismaClient();
// const ITEMS_PER_PAGE = 20;

// export const loader: LoaderFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shop = session.shop;

//   const url = new URL(request.url);
//   const pageParam = url.searchParams.get("page");
//   const page = pageParam ? parseInt(pageParam, 10) : 1;

//   const totalLogsCount = await prisma.emailLog.count({ where: { shop } });
//   const totalPages = Math.ceil(totalLogsCount / ITEMS_PER_PAGE);

//   const skip = (page - 1) * ITEMS_PER_PAGE;
//   const take = ITEMS_PER_PAGE;

//   const emailLogs = await prisma.emailLog.findMany({
//     where: { shop },
//     orderBy: { sentAt: "desc" },
//     skip,
//     take,
//     select: {
//       orderId: true,
//       customerName: true,
//       email: true,
//       subject: true,
//       sentCount: true,
//       isBouncedBack: true,
//       deliveryStatus: true,
//       sentAt: true,
//       isOpened: true, // Include the Is Opened field
//     },
//   });

//   return json({ emailLogs, totalPages, currentPage: page });
// };

// export default function EmailLogList() {
//   const { emailLogs, totalPages, currentPage } = useLoaderData<{
//     emailLogs: any[];
//     totalPages: number;
//     currentPage: number;
//   }>();

//   const [searchParams] = useSearchParams();
//   const submit = useSubmit();

//   const rows = emailLogs.map((log) => [
//     log.orderId,
//     log.customerName,
//     log.email,
//     log.subject,
//     log.sentCount,
//     log.isBouncedBack ? "Yes" : "No",
//     log.deliveryStatus || "Pending",
//     format(new Date(log.sentAt), "yyyy-MM-dd HH:mm:ss"),
//     log.isOpened ? "Yes" : "No", // Display the Is Opened status
//   ]);

//   const goToPage = (page: number) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set("page", page.toString());
//     submit(url.searchParams, { method: "get" });
//   };

//   return (
//     <Layout>
//       <Layout.Section>
//         <Card sectioned title="Sent Emails">
//           <DataTable
//             columnContentTypes={[
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//               "text",
//               "text", // Column for Is Opened
//             ]}
//             headings={[
//               <Text variant="headingMd" as="h6">Order ID</Text>,
//               <Text variant="headingMd" as="h6">Customer Name</Text>,
//               <Text variant="headingMd" as="h6">Recipient Email</Text>,
//               <Text variant="headingMd" as="h6">Subject</Text>,
//               <Text variant="headingMd" as="h6">Sent Count</Text>,
//               <Text variant="headingMd" as="h6">Bounced</Text>,
//               <Text variant="headingMd" as="h6">Delivery Status</Text>,
//               <Text variant="headingMd" as="h6">Sent At</Text>,
//               <Text variant="headingMd" as="h6">Is Opened</Text>, // Heading for Is Opened
//             ]}
//             rows={rows}
//           />

//           {totalPages > 1 && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginTop: "20px",
//               }}
//             >
//               {currentPage > 1 && (
//                 <>
//                   <Button onClick={() => goToPage(1)}>First</Button>
//                   {currentPage > 2 && (
//                     <Button onClick={() => goToPage(currentPage - 1)}>
//                       Previous
//                     </Button>
//                   )}
//                 </>
//               )}

//               <Text variant="bodyMd">
//                 Page {currentPage} of {totalPages}
//               </Text>

//               {currentPage < totalPages && (
//                 <>
//                   <Button onClick={() => goToPage(currentPage + 1)}>
//                     Next
//                   </Button>
//                   <Button onClick={() => goToPage(totalPages)}>Last</Button>
//                 </>
//               )}
//             </div>
//           )}
//         </Card>
//       </Layout.Section>
//     </Layout>
//   );
// }


// March 26 2025
// New Serach functionlity

import { LoaderFunction, json } from "@remix-run/node";
import {
  useLoaderData,
  useSearchParams,
  useSubmit,
  Form,
} from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import {
  Card,
  Layout,
  DataTable,
  Button,
  Text,
  TextField,
  Page,
} from "@shopify/polaris";
import { format } from "date-fns";
import { authenticate } from "app/shopify.server";

const prisma = new PrismaClient();
const ITEMS_PER_PAGE = 20;

export const loader: LoaderFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  // 1) Get the search query param
  const q = url.searchParams.get("q") || "";

  // 2) Build the "where" clause depending on search
  // If there's a search string (q), search across these fields:
  // Order ID, Customer Name, Recipient Email, Subject
  // using case-insensitive partial matches.
  let whereClause: any = { shop };
  if (q) {
    whereClause = {
      shop,
      OR: [
        { orderId: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  // 3) Count total logs matching the where clause
  const totalLogsCount = await prisma.emailLog.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalLogsCount / ITEMS_PER_PAGE);

  const skip = (page - 1) * ITEMS_PER_PAGE;
  const take = ITEMS_PER_PAGE;

  // 4) Find logs matching the where clause, with pagination
  const emailLogs = await prisma.emailLog.findMany({
    where: whereClause,
    orderBy: { sentAt: "desc" },
    skip,
    take,
    select: {
      orderId: true,
      customerName: true,
      email: true,
      subject: true,
      sentCount: true,
      isBouncedBack: true,
      deliveryStatus: true,
      sentAt: true,
      isOpened: true, // Include the Is Opened field
    },
  });

  return json({
    emailLogs,
    totalPages,
    currentPage: page,
    searchQuery: q, // pass the current search string to the client
  });
};

export default function EmailLogList() {
  const { emailLogs, totalPages, currentPage, searchQuery } =
    useLoaderData<{
      emailLogs: any[];
      totalPages: number;
      currentPage: number;
      searchQuery: string;
    }>();

  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  // 5) Create table rows
  const rows = emailLogs.map((log) => [
    log.orderId,
    log.customerName,
    log.email,
    log.subject,
    log.sentCount,
    log.isBouncedBack ? "Yes" : "No",
    log.deliveryStatus || "Pending",
    format(new Date(log.sentAt), "yyyy-MM-dd HH:mm:ss"),
    log.isOpened ? "Yes" : "No", // Display the Is Opened status
  ]);

  // Pagination function
  const goToPage = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    submit(url.searchParams, { method: "get" });
  };

  // 6) Handle search changes (through a form GET)
  // We'll keep the 'page=1' whenever user searches new text
  const handleSearchChange = (newValue: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", newValue);
    url.searchParams.set("page", "1"); // reset to page 1
    submit(url.searchParams, { method: "get" });
  };

  return (
    <Page>
    <Layout>
      <Layout.Section>
        <Card sectioned title="Sent Emails">
          {/* 7) Search Bar on top */}
          <div style={{ marginBottom: "16px" }}>
            <TextField
              label="Search Orders"
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <DataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
              "text", // Column for Is Opened
            ]}
            headings={[
              <Text variant="headingMd" as="h6">
                Order ID
              </Text>,
              <Text variant="headingMd" as="h6">
                Customer Name
              </Text>,
              <Text variant="headingMd" as="h6">
                Recipient Email
              </Text>,
              <Text variant="headingMd" as="h6">
                Subject
              </Text>,
              <Text variant="headingMd" as="h6">
                Sent Count
              </Text>,
              <Text variant="headingMd" as="h6">
                Bounced
              </Text>,
              <Text variant="headingMd" as="h6">
                Delivery Status
              </Text>,
              <Text variant="headingMd" as="h6">
                Sent At
              </Text>,
              <Text variant="headingMd" as="h6">
                Is Opened
              </Text>, // Heading for Is Opened
            ]}
            rows={rows}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              {currentPage > 1 && (
                <>
                  <Button onClick={() => goToPage(1)}>First</Button>
                  {currentPage > 2 && (
                    <Button onClick={() => goToPage(currentPage - 1)}>
                      Previous
                    </Button>
                  )}
                </>
              )}

              <Text variant="bodyMd">
                Page {currentPage} of {totalPages}
              </Text>

              {currentPage < totalPages && (
                <>
                  <Button onClick={() => goToPage(currentPage + 1)}>
                    Next
                  </Button>
                  <Button onClick={() => goToPage(totalPages)}>Last</Button>
                </>
              )}
            </div>
          )}
        </Card>
      </Layout.Section>
    </Layout>
    </Page>
  );
}
