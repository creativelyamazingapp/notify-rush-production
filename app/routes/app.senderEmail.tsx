import { useState } from "react";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import {
  Card,
  Button,
  TextField,
  Layout,
  Badge,
  DataTable,
  Checkbox,
  Banner,
  Modal,
  Page,
} from "@shopify/polaris";
import {
  SESClient,
  VerifyEmailIdentityCommand,
  GetIdentityVerificationAttributesCommand,
} from "@aws-sdk/client-ses";
import { authenticate } from "app/shopify.server";

// Initialize Prisma and SES clients
const prisma = new PrismaClient();
const sesClient = new SESClient({ region: "us-east-1" });

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Loader to fetch all sender emails
export const loader: LoaderFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const senderEmails = await prisma.senderEmail.findMany({
    where: { shop },
  });
  return json({ senderEmails });
};

// Action to add new email, trigger verification, update active status, delete, or recheck verification
export const action: ActionFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const id = formData.get("id")?.toString();
  const actionType = formData.get("actionType");
  const isActive = formData.get("isActive") === "true";

  try {
    // Handle email addition
    if (actionType === "add") {
      if (!email || !emailRegex.test(email)) {
        return json({ error: "Invalid email format" }, { status: 400 });
      }

      const newEmail = await prisma.senderEmail.create({
        data: {
          email,
          shop,
          isVerified: false,
          isActive: false,
        },
      });
      return json({ success: true, senderEmail: newEmail });
    }

    // Handle email verification with AWS SES
    if (actionType === "verify") {
      const verifyCommand = new VerifyEmailIdentityCommand({
        EmailAddress: email,
      });
      await sesClient.send(verifyCommand);
      return json({ success: true });
    }

    // Recheck email verification status
    if (actionType === "recheck") {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [email],
      });
      const response = await sesClient.send(command);
      const verificationStatus =
        response.VerificationAttributes?.[email]?.VerificationStatus;

      // Update the database if verified
      if (verificationStatus === "Success") {
        await prisma.senderEmail.update({
          where: { email },
          data: { isVerified: true },
        });
        return json({ success: true, verified: true });
      } else {
        return json({ success: true, verified: false });
      }
    }

    // Handle updating active status
    if (actionType === "update") {
      // Set all other emails to inactive before activating the new one
      await prisma.senderEmail.updateMany({
        where: { shop },
        data: { isActive: false },
      });

      // Parse the id as a number
      const numericId = parseInt(id || "", 10);

      // Check for NaN to avoid passing invalid IDs
      if (isNaN(numericId)) {
        throw new Error("Invalid ID provided for updating sender email.");
      }

      // Update the current email's active status
      await prisma.senderEmail.update({
        where: { id: numericId },
        data: { isActive },
      });

      return json({ success: true });
    }

    // Handle deleting an email address
    if (actionType === "delete") {
      await prisma.senderEmail.delete({
        where: { id: parseInt(id || "", 10) },
      });
      return json({ success: true });
    }
  } catch (error) {
    console.error("Error processing email:", error);
    return json({ error: error.message }, { status: 500 });
  }
};

// Component for the Email Address Management and Verification
export default function EmailAddressManager() {
  const { senderEmails } = useLoaderData<{ senderEmails: any[] }>();
  const fetcher = useFetcher();
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState("");
  const [isActiveCheckbox, setIsActiveCheckbox] = useState(false);
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState("");

  // Check if no sender email is active
  const hasActiveEmail = senderEmails.some((sender) => sender.isActive);
  // Check if any sender email is not verified
  const hasUnverifiedEmail = senderEmails.some((sender) => !sender.isVerified);

  // Function to add a new email address
  const addEmail = () => {
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("actionType", "add");
    fetcher.submit(formData, { method: "post" });
    setEmail(""); // Clear input field after submission
  };

  // Function to trigger email verification
  const verifyEmail = (emailToVerify: string) => {
    const formData = new FormData();
    formData.append("email", emailToVerify);
    formData.append("actionType", "verify");
    fetcher.submit(formData, { method: "post" });

    setVerificationMessage(
      `Verification email sent to ${emailToVerify}. Please check your inbox and follow the instructions to verify.`
    );
  };

  // Recheck AWS SES verification status
  const recheckVerification = (emailToRecheck: string) => {
    const formData = new FormData();
    formData.append("email", emailToRecheck);
    formData.append("actionType", "recheck");

    fetcher
      .submit(formData, {
        method: "post",
        replace: true,
      })
      .then(() => {
        if (fetcher.data?.verified) {
          setVerificationMessage(""); // Clear the message when verified
        }
      });
  };

  // Handle setting an email as active
  const handleSave = (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("isActive", String(isActiveCheckbox));
    formData.append("actionType", "update");
    fetcher.submit(formData, { method: "post" });

    // Reset editing state after saving
    setEditingId("");
    setIsSaveEnabled(false);
  };

  // Open delete confirmation modal
  const confirmDelete = (id: string) => {
    setShowDeleteModal(true);
    setEmailToDelete(id);
  };

  // Handle deleting an email
  const handleDelete = () => {
    const formData = new FormData();
    formData.append("id", emailToDelete);
    formData.append("actionType", "delete");
    fetcher.submit(formData, { method: "post" });

    setEditingId("");
    setShowDeleteModal(false); // Close modal
  };

  // Handle editing state and enable save button on change
  const handleEdit = (sender: any) => {
    setEditingId(sender.id);
    setIsActiveCheckbox(sender.isActive);
    setIsSaveEnabled(false);
  };

  // Prepare data for the table
  const rows = senderEmails.map((sender) => [
    sender.email,
    <Badge status={sender.isVerified ? "success" : "attention"}>
      {sender.isVerified ? "Verified" : "Unverified"}
    </Badge>,
    editingId === sender.id ? (
      <Checkbox
        checked={isActiveCheckbox}
        onChange={(checked) => {
          setIsActiveCheckbox(checked);
          setIsSaveEnabled(true);
        }}
      />
    ) : sender.isActive ? (
      "Yes"
    ) : (
      "No"
    ),
    <>
      {editingId !== sender.id && (
        <Button onClick={() => handleEdit(sender)} primary>
          Edit
        </Button>
      )}
      {editingId === sender.id && (
        <>
          <Button
            onClick={() => handleSave(sender.id)}
            primary
            disabled={!isSaveEnabled}
          >
            Save
          </Button>
          <Button onClick={() => confirmDelete(sender.id)} destructive>
            Delete
          </Button>
        </>
      )}
      {!sender.isVerified && (
        <>
          <Button onClick={() => verifyEmail(sender.email)}>Verify</Button>
          <Button onClick={() => recheckVerification(sender.email)}>
            Recheck
          </Button>
        </>
      )}
    </>,
  ]);

  return (
    <Page fullWidth title="Notify Rush - Email Configuration">
      <Layout>
        <Layout.Section>
          {/* Show warning if no sender email is added */}
          {senderEmails.length === 0 && (
            <Banner status="critical" title="No sender email address added">
              <p>
                No sender email address is added, you will not be able to send emails.
              </p>
            </Banner>
          )}
          {/* Show warning if no active sender email */}
          {!hasActiveEmail && senderEmails.length > 0 && (
            <Banner status="critical" title="No active sender email found">
              <p>
                No user is active, you will not be able to send emails. Emails
                will be sent only by the active email address. Click on the
                "Edit" button and make the correct sender email address active.
                Only one email address can be active at a time.
              </p>
            </Banner>
          )}
          {/* Show warning if any sender email is not verified */}
          {hasUnverifiedEmail && (
            <Banner status="warning" title="Unverified Sender Email">
              <p>
                Sender email address is not verified. Please click on "Verify" button. A verification email will
                be sent from our Amazon AWS Service, please open the email and
                click on the verify link. After that, please click on "Recheck"
                button to complete the verification.
              </p>
            </Banner>
          )}
          {verificationMessage && (
            <Banner status="info" title={verificationMessage} />
          )}
          <Card roundedAbove="sm" title="Add New Sender Email">
            <div style={{ gap: "10px" }}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(value) => setEmail(value)}
                autoComplete="off"
              />
              <div style={{ marginTop: "20px" }}>
                <Button onClick={addEmail} size="large" variant="primary">
                  ✚ Add Email
                </Button>
              </div>
            </div>
          </Card>

          {/* Display sender emails in a table */}
          <Card sectioned title="Sender Emails">
            <DataTable
              columnContentTypes={["text", "text", "text", "text"]}
              headings={[
                "Email Address",
                "Verify Status",
                "Is Active",
                "Actions",
              ]}
              rows={rows}
            />
          </Card>

          {/* Modal for delete confirmation */}
          <Modal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Confirm Delete"
            primaryAction={{
              content: "Delete",
              onAction: handleDelete,
              destructive: true,
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: () => setShowDeleteModal(false),
              },
            ]}
          >
            <Modal.Section>
              <p>Are you sure you want to delete this email?</p>
            </Modal.Section>
          </Modal>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
