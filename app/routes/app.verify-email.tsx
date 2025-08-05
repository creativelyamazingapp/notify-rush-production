
import { LoaderFunction, json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { Card, Layout, Banner, Page } from "@shopify/polaris";

// Initialize Prisma client
const prisma = new PrismaClient();

// Loader function to verify the email based on the verification code
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return json(
      { error: "Verification code is missing", success: false },
      { status: 400 }
    );
  }

  try {
    // Find the email entry with the given verification code
    const emailEntry = await prisma.senderEmail.findFirst({
      where: { verificationCode: code },
    });

    if (!emailEntry) {
      return json(
        { error: "Invalid verification code", success: false },
        { status: 400 }
      );
    }

    // Update the email's verification status
    await prisma.senderEmail.update({
      where: { id: emailEntry.id },
      data: { isVerified: true, verificationCode: null }, // Clear verification code after verification
    });

    return json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    return json({ error: "Server error", success: false }, { status: 500 });
  }
};

// Component to display verification status
export default function VerifyEmail() {
  const { success, message, error } = useLoaderData<{
    success: boolean;
    message?: string;
    error?: string;
  }>();

  // Display the appropriate message based on the verification result
  useEffect(() => {
    if (success) {
      alert("Your email has been successfully verified!");
    } else if (error) {
      alert(`Error verifying email: ${error}`);
    }
  }, [success, error]);

  return (
    <Page>
    <Layout>
      <Layout.Section>
        <Card sectioned title="Email Verification">
          {success ? (
            <Banner status="success" title={message} />
          ) : (
            <Banner status="critical" title={error || "Verification failed"} />
          )}
        </Card>
      </Layout.Section>
    </Layout>
    </Page>
  );
}
