import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  ProgressBar,
  Banner,
  TextField,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useEffect, useState } from "react";

// Import your server helpers
import { authenticate } from "app/shopify.server";
import { shopifySyncTestQueue } from "app/utils/queue.server";
import { getShopAccessToken } from "app/utils/getShopAccessToken.server";

/** Progress data type for the fetcher */
type ProgressData = {
  jobId?: string;
  status?: string;
  totalRecords?: number;
  processedRecords?: number;
  error?: string;
};

// 1) Action that enqueues the job, optionally for a custom store domain
export const action: ActionFunction = async ({ request }) => {
  // Parse form data to see if user provided an alternate store domain
  const formData = await request.formData();
  const customDomain = formData.get("storeDomain")?.toString() || "";

  let shopDomain: string;
  let accessToken: string | null = null;

  // If a custom domain is provided, skip authenticate.admin, look up the store in DB
  if (customDomain.trim()) {
    console.log("[newSync] Using custom domain:", customDomain);
    shopDomain = customDomain.trim();
    accessToken = await getShopAccessToken(shopDomain);
    if (!accessToken) {
      return json(
        { error: `No accessToken found in DB for custom domain: ${shopDomain}` },
        { status: 400 }
      );
    }
  } else {
    // Otherwise, fall back to the current session's shop
    const { admin, session } = await authenticate.admin(request);
    shopDomain = session.shop; // e.g. "myshop.myshopify.com"
    console.log("[newSync] shop domain (from session):", shopDomain);

    // Query DB for token
    accessToken = await getShopAccessToken(shopDomain);
    if (!accessToken) {
      return json({ error: `No accessToken found for shop: ${shopDomain}` }, { status: 400 });
    }
  }

  // At this point, we have shopDomain + accessToken for the store
  try {
    // Enqueue a Bull job using our existing queue
    const job = await shopifySyncTestQueue.add("testShopify", {
      shopDomain,
      token: accessToken, // pass the access token
    });
    console.log("[newSync] queued job ID:", job.id);

    return json({ jobId: job.id });
  } catch (err: any) {
    console.error("[newSync] enqueue error:", err);
    return json({ error: err.message }, { status: 500 });
  }
};

// 2) Loader for polling job progress
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return json({ status: "NO_JOB_ID" });
  }

  // Retrieve the job from the queue
  const job = await shopifySyncTestQueue.getJob(jobId);
  if (!job) {
    return json({ status: "NOT_FOUND" });
  }

  const state = await job.getState();
  console.log(`[newSync] Job ${jobId} state:`, state);

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
export default function NewSync() {
  const fetcher = useFetcher<ProgressData>();
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);

  // Optional field for a custom store domain
  const [showOtherStoreField, setShowOtherStoreField] = useState(false);
  const [otherStoreDomain, setOtherStoreDomain] = useState("");

  // Start the sync job
  const startSync = (domain?: string) => {
    // Build form data
    const formData = new FormData();
    if (domain && domain.trim()) {
      formData.append("storeDomain", domain.trim());
    }
    // Post to the same route's action
    fetcher.submit(formData, { method: "post", action: "/app/newSync" });
  };

  // Store jobId in localStorage if created
  useEffect(() => {
    if (fetcher.data?.jobId) {
      localStorage.setItem("syncJobId", fetcher.data.jobId);
    }
  }, [fetcher.data]);

  // If job is created, set local states
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.jobId) {
      setJobId(fetcher.data.jobId);
      setStatus("pending");
      setProcessed(0);
      setTotal(0);
      setErrorMsg("");
    }
  }, [fetcher.state, fetcher.data]);

  // Poll the job status every 3 seconds if it's running
  useEffect(() => {
    if (jobId && status !== "COMPLETED" && status !== "ERROR") {
      const interval = setInterval(() => {
        fetcher.load(`/app/newSync?jobId=${jobId}`);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [jobId, status, fetcher]);

  // Update UI each time we get new data from the loader
  useEffect(() => {
    if (fetcher.data) {
      setStatus(fetcher.data.status || "");
      setErrorMsg(fetcher.data.error || "");
      setProcessed(fetcher.data.processedRecords || 0);
      setTotal(fetcher.data.totalRecords || 0);
    }
  }, [fetcher.data]);

  // Calculate percentage
  const progressPercent = total ? Math.min((processed / total) * 100, 100) : 0;

  return (
    <Page title="Notify Rush - Data Sync (New)">
      <Layout>
        {errorMsg && <Banner status="critical">{errorMsg}</Banner>}

        <Layout.Section>
          <Card sectioned>
            <Text variant="bodyLg" as="p">
              After installing Notify Rush, click "Start Data Sync" to fetch all
              historical customers and orders. You can either sync your currently
              authenticated shop, or specify a different shop domain in the
              "Sync Another Store" section below.
              <br />
              <br />
              Once the sync is complete, all future updates are handled by webhooks
              automatically.
            </Text>
          </Card>

          <Card sectioned>
            <Button
              onClick={() => startSync()}
              disabled={status && status !== "COMPLETED" && status !== "ERROR"}
              primary
              fullWidth
            >
              {status && status !== "COMPLETED" && status !== "ERROR"
                ? "Sync Running..."
                : "Start Data Sync (Current Shop)"}
            </Button>

            {/* Toggle the custom domain field */}
            <Button
              onClick={() => setShowOtherStoreField(!showOtherStoreField)}
              fullWidth
              disabled={status && status !== "COMPLETED" && status !== "ERROR"}
            >
              {showOtherStoreField ? "Hide Another Store Field" : "Sync Another Store"}
            </Button>

            {/* If toggled on, allow user to input a different store domain */}
            {showOtherStoreField && (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
                <TextField
                  label="Custom Store Domain"
                  value={otherStoreDomain}
                  onChange={(val) => setOtherStoreDomain(val)}
                  autoComplete="off"
                  helpText="Example: custom-shop.myshopify.com"
                />
                <Button
                  primary
                  onClick={() => {
                    if (otherStoreDomain.trim()) {
                      startSync(otherStoreDomain);
                    }
                  }}
                  disabled={status && status !== "COMPLETED" && status !== "ERROR"}
                >
                  {status && status !== "COMPLETED" && status !== "ERROR"
                    ? "Sync Running..."
                    : "Start Sync for Custom Domain"}
                </Button>
              </div>
            )}
          </Card>
        </Layout.Section>

        {/* Show progress bar while sync is active */}
        {status && (
          <Layout.Section>
            <Banner
              title={`Sync Status: ${status}`}
              status={status === "ERROR" ? "critical" : "info"}
            >
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
