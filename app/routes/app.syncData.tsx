// import { Page, Layout, Card, Text, Button, ProgressBar, Banner } from "@shopify/polaris";
// import { useFetcher } from "@remix-run/react";
// import type { ActionFunction, LoaderFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { useEffect, useState } from "react";
// import { authenticate } from "app/shopify.server";
// import { shopifySyncTestQueue } from "app/utils/queue.server";
// import { getShopAccessToken } from "app/utils/getShopAccessToken.server";

// type ProgressData = {
//   jobId?: string;
//   status?: string;
//   totalRecords?: number;
//   processedRecords?: number;
//   error?: string;
// };

// // 1) Action that enqueues the job
// export const action: ActionFunction = async ({ request }) => {
//   const { admin, session } = await authenticate.admin(request);
//   const shopDomain = session.shop; // e.g. "myshop.myshopify.com"
//   console.log("[testRedisSync] shop domain:", shopDomain);

//   // Query DB for token
//   const token = await getShopAccessToken(shopDomain);
//   if (!token) {
//     return json({ error: "No accessToken found for this shop" }, { status: 400 });
//   }

//   try {
//     // Enqueue job with necessary data
//     const job = await shopifySyncTestQueue.add("testShopify", {
//       shopDomain,
//       token, // pass the token
//     });
//     console.log("[testRedisSync] queued job ID:", job.id);

//     return json({ jobId: job.id });
//   } catch (err: any) {
//     console.error("[testRedisSync] enqueue error:", err);
//     return json({ error: err.message }, { status: 500 });
//   }
// };

// // 2) Loader for polling job progress
// export const loader: LoaderFunction = async ({ request }) => {
//   // Poll the queue job progress
//   const url = new URL(request.url);
//   const jobId = url.searchParams.get("jobId");
//   if (!jobId) {
//     return json({ status: "NO_JOB_ID" });
//   }

//   const job = await shopifySyncTestQueue.getJob(jobId);
//   if (!job) {
//     return json({ status: "NOT_FOUND" });
//   }

//   const state = await job.getState();
//   console.log(`[testRedisSync] Job ${jobId} state:`, state);

//   let totalRecords = 0;
//   let processedRecords = 0;
//   const progress = job.progress() as any;
//   if (progress && typeof progress === "object") {
//     totalRecords = progress.totalRecords || 0;
//     processedRecords = progress.processedRecords || 0;
//   }

//   if (state === "completed") {
//     const result = await job.finished();
//     return json({
//       jobId,
//       status: "COMPLETED",
//       totalRecords: result.totalRecords,
//       processedRecords: result.processedRecords,
//     });
//   } else if (state === "failed") {
//     return json({
//       jobId,
//       status: "ERROR",
//       error: job.failedReason || "Unknown error",
//     });
//   }

//   return json({
//     jobId,
//     status: state,
//     totalRecords,
//     processedRecords,
//   });
// };

// // 3) React UI
// export default function TestRedisSync() {
//   const fetcher = useFetcher<ProgressData>();
//   const [jobId, setJobId] = useState<string | null>(null);
//   const [status, setStatus] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [processed, setProcessed] = useState(0);
//   const [total, setTotal] = useState(0);

//   const startSync = () => {
//     // Post to the same route to enqueue the job
//     fetcher.submit(null, { method: "post", action: "/app/syncData" });
//   };

//     // Whenever the job is created, store the jobId in local storage so
//   // the root layout can detect & show the banner.
//   useEffect(() => {
//     if (fetcher.data?.jobId) {
//       localStorage.setItem("syncJobId", fetcher.data.jobId);
//     }
//   }, [fetcher.data]);


//   // If job is created, start polling
//   useEffect(() => {
//     // `fetcher.state === 'idle'` means the fetch request is done
//     if (fetcher.state === "idle" && fetcher.data?.jobId) {
//       setJobId(fetcher.data.jobId);
//       setStatus("pending");
//       setProcessed(0);
//       setTotal(0);
//       setErrorMsg("");
//     }
//   }, [fetcher.state, fetcher.data]);
  

//   useEffect(() => {
//     if (jobId && status !== "COMPLETED" && status !== "ERROR") {
//       const interval = setInterval(() => {
//         const jobInfor = fetcher.load(`/app/syncData?jobId=${jobId}`);
//       }, 3000);
//       return () => clearInterval(interval);
//     }
//   }, [jobId, status, fetcher]);

//   useEffect(() => {
//     if (fetcher.data) {
//       setStatus(fetcher.data.status || "");
//       setErrorMsg(fetcher.data.error || "");
//       setProcessed(fetcher.data.processedRecords || 0);
//       setTotal(fetcher.data.totalRecords || 0);

//     }
//   }, [fetcher.data]);

//   const progressPercent = total ? Math.min((processed / total) * 100, 100) : 0;

//   return (
//     <Page title="Notify Rush - Data Sync">
//       <Layout>
//         {errorMsg && <Banner tone="critical">{errorMsg}</Banner>}

//         <Layout.Section>
//           <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             gap: "20px"
//           }}
//           >

         
//         <Card>
//               <Text variant="bodyLg" as="p">
//                 After installing Notify Rush, please sync the data from your Shopify
//                 store to the app. Click on the Sync Data button. Once progress shows
//                 that all records have been processed, you can start using the app.
//                 <br />
//                 <br />
//                 After the initial sync, future orders will be synced automatically
//                 via webhooks.
//               </Text>
//             </Card>

//             <Card> 
//             <Button
//               onClick={startSync}
//               disabled={status && status !== "COMPLETED" && status !== "ERROR"}
//               variant="primary"
//               fullWidth
//             >
//               {status && status !== "COMPLETED" && status !== "ERROR"
//                 ? "Sync Running..."
//                 : "Start Sync"}
//             </Button>
//             </Card>
//             </div>
//         </Layout.Section>

//         {status && (
//           <Layout.Section>
//             <Banner title={`Sync Status: ${status}`} tone={status === "ERROR" ? "critical" : "info"}>
//               {status === "COMPLETED" ? (
//                 <p>All done! {processed} records synced.</p>
//               ) : status === "ERROR" ? (
//                 <p>Error: {errorMsg}</p>
//               ) : (
//                 <>
//                   <ProgressBar progress={progressPercent} />
//                   <p>
//                     {processed} of {total} records processed.
//                   </p>
//                 </>
//               )}
//             </Banner>
//           </Layout.Section>
//         )}
//       </Layout>
//     </Page>
//   );
// }


// March 26 2025
// Data sync with order tags

import { Page, Layout, Card, Text, Button, ProgressBar, Banner } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useEffect, useState } from "react";
import { authenticate } from "app/shopify.server";
import { shopifySyncTestQueue } from "app/utils/queue.server";
import { getShopAccessToken } from "app/utils/getShopAccessToken.server";

type ProgressData = {
  jobId?: string;
  status?: string;
  totalRecords?: number;
  processedRecords?: number;
  error?: string;
};

// 1) Action that enqueues the job
export const action: ActionFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop; // e.g. "myshop.myshopify.com"
  console.log("[testRedisSync] shop domain:", shopDomain);

  // Query DB for token
  const token = await getShopAccessToken(shopDomain);
  if (!token) {
    return json({ error: "No accessToken found for this shop" }, { status: 400 });
  }

  try {
    // Enqueue job with necessary data
    const job = await shopifySyncTestQueue.add("testShopify", {
      shopDomain,
      token, // pass the token
    });
    console.log("[testRedisSync] queued job ID:", job.id);

    return json({ jobId: job.id });
  } catch (err: any) {
    console.error("[testRedisSync] enqueue error:", err);
    return json({ error: err.message }, { status: 500 });
  }
};

// 2) Loader for polling job progress
export const loader: LoaderFunction = async ({ request }) => {
  // Poll the queue job progress
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return json({ status: "NO_JOB_ID" });
  }

  const job = await shopifySyncTestQueue.getJob(jobId);
  if (!job) {
    return json({ status: "NOT_FOUND" });
  }

  const state = await job.getState();
  console.log(`[testRedisSync] Job ${jobId} state:`, state);

  let totalRecords = 0;
  let processedRecords = 0;
  const progress = job.progress() as any;
  if (progress && typeof progress === "object") {
    totalRecords = progress.totalRecords || 0;
    processedRecords = progress.processedRecords || 0;
  }

  if (state === "completed") {
    const result = await job.finished();
    return json({
      jobId,
      status: "COMPLETED",
      totalRecords: result.totalRecords,
      processedRecords: result.processedRecords,
    });
  } else if (state === "failed") {
    return json({
      jobId,
      status: "ERROR",
      error: job.failedReason || "Unknown error",
    });
  }

  return json({
    jobId,
    status: state,
    totalRecords,
    processedRecords,
  });
};

// 3) React UI
export default function TestRedisSync() {
  const fetcher = useFetcher<ProgressData>();
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);

  const startSync = () => {
    // Post to the same route to enqueue the job
    fetcher.submit(null, { method: "post", action: "/app/syncData" });
  };

  // Whenever the job is created, store the jobId in local storage so
  // the root layout can detect & show the banner.
  useEffect(() => {
    if (fetcher.data?.jobId) {
      localStorage.setItem("syncJobId", fetcher.data.jobId);
    }
  }, [fetcher.data]);

  // If job is created, start polling
  useEffect(() => {
    // `fetcher.state === 'idle'` means the fetch request is done
    if (fetcher.state === "idle" && fetcher.data?.jobId) {
      setJobId(fetcher.data.jobId);
      setStatus("pending");
      setProcessed(0);
      setTotal(0);
      setErrorMsg("");
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (jobId && status !== "COMPLETED" && status !== "ERROR") {
      const interval = setInterval(() => {
        fetcher.load(`/app/syncData?jobId=${jobId}`);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [jobId, status, fetcher]);

  useEffect(() => {
    if (fetcher.data) {
      setStatus(fetcher.data.status || "");
      setErrorMsg(fetcher.data.error || "");
      setProcessed(fetcher.data.processedRecords || 0);
      setTotal(fetcher.data.totalRecords || 0);
    }
  }, [fetcher.data]);

  const progressPercent = total ? Math.min((processed / total) * 100, 100) : 0;

  return (
    <Page title="Notify Rush - Data Sync">
      <Layout>
        {errorMsg && <Banner tone="critical">{errorMsg}</Banner>}

        <Layout.Section>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
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
              <Button
                onClick={startSync}
                disabled={status && status !== "COMPLETED" && status !== "ERROR"}
                variant="primary"
                fullWidth
              >
                {status && status !== "COMPLETED" && status !== "ERROR"
                  ? "Sync Running..."
                  : "Start Sync"}
              </Button>
            </Card>
          </div>
        </Layout.Section>

        {status && (
          <Layout.Section>
            <Banner title={`Sync Status: ${status}`} tone={status === "ERROR" ? "critical" : "info"}>
              {status === "COMPLETED" ? (
                <p>All done! {processed} records synced.</p>
              ) : status === "ERROR" ? (
                <p>Error: {errorMsg}</p>
              ) : (
                <>
                  <ProgressBar progress={progressPercent} />
                  <p>
                    {processed} of {total} records processed.
                  </p>
                </>
              )}
            </Banner>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
