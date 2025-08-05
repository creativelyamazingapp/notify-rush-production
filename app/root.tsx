// import {
//   Links,
//   Meta,
//   Outlet,
//   Scripts,
//   ScrollRestoration,
// } from "@remix-run/react";

// export default function App() {
//   return (
//     <html>
//       <head>
//         <meta charSet="utf-8" />
//         <meta name="viewport" content="width=device-width,initial-scale=1" />
//         <link rel="preconnect" href="https://cdn.shopify.com/" />
//         <link
//           rel="stylesheet"
//           href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
//         />
//         <Meta />
//         <Links />
//       </head>
//       <body>
//         <Outlet />
//         <ScrollRestoration />
//         <Scripts />
//       </body>
//     </html>
//   );
// }


import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import enTranslations from "@shopify/polaris/locales/en.json";
import { AppProvider, Banner, ProgressBar, Button } from "@shopify/polaris";

export default function App() {
  // If you have global state for your sync banner, keep that logic here.
  const fetcher = useFetcher();
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);

  // Restore any stored jobId from localStorage
  useEffect(() => {
    const storedJobId = window.localStorage.getItem("syncJobId");
    if (storedJobId) {
      setJobId(storedJobId);
      setStatus("pending");
    }
  }, []);

  // Poll the job if it’s running
  useEffect(() => {
    if (jobId && status !== "COMPLETED" && status !== "ERROR") {
      const interval = setInterval(() => {
        fetcher.load(`/app/syncData?jobId=${jobId}`);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [jobId, status, fetcher]);

  // Handle fetcher results
  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data;
      setStatus(data.status || "");
      setErrorMsg(data.error || "");
      setProcessed(data.processedRecords || 0);
      setTotal(data.totalRecords || 0);

      // If job ended, remove from local storage
      if (data.status === "COMPLETED" || data.status === "ERROR") {
        window.localStorage.removeItem("syncJobId");
      }
    }
  }, [fetcher.data]);

  // "Close" button callback to hide the banner manually
  const handleCloseBanner = () => {
    // Clear local state
    setJobId(null);
    setStatus("");
    setProcessed(0);
    setTotal(0);
    setErrorMsg("");
  };

  // Calculate progress
  const progressPercent = total ? Math.min((processed / total) * 100, 100) : 0;

  let syncBanner = null;
  if (jobId && status) {
    syncBanner = (
      <Banner
        title={`Sync Status: ${status}`}
        status={status === "ERROR" ? "critical" : "info"}
      >
        {status === "COMPLETED" ? (
          <>
            <p>All done! {processed} records synced.</p>
            <Button onClick={handleCloseBanner}>Close</Button>
          </>
        ) : status === "ERROR" ? (
          <>
            <p>Error: {errorMsg}</p>
            <Button onClick={handleCloseBanner}>Close</Button>
          </>
        ) : (
          <>
            <ProgressBar progress={progressPercent} />
            <p>
              {processed} of {total} records processed.
            </p>
          </>
        )}
      </Banner>
    );
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {/* Wrap your entire app in AppProvider */}
        <AppProvider i18n={enTranslations}>
          {/* If there's an active sync job, show the banner at the top */}
          {syncBanner}

          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
