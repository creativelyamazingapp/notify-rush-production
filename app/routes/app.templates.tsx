// Import necessary modules and libraries
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import {
  Card,
  TextField,
  Button,
  Layout,
  Modal,
  BlockStack,
  Badge,
  Page,
} from "@shopify/polaris";
import { authenticate } from "app/shopify.server";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Utility function to get storeId from request/session
async function getStoreIdFromRequest(request: Request): Promise<string | null> {
  const { admin, session } = await authenticate.admin(request);
  return session?.shop || null;
}

// Loader function to fetch all templates for the current store
export const loader: LoaderFunction = async ({ request }) => {
  const storeId = await getStoreIdFromRequest(request);
  if (!storeId) {
    return json({ templates: [] });
  }

  try {
    // Fetch templates only for the current store
    const templates = await prisma.emailTemplate.findMany({
      where: {
        storeId: storeId,
      },
    });
    return json({ templates });
  } catch (error) {
    console.error("Error loading templates:", error);
    return json({ templates: [] });
  }
};

// Action function for creating and updating templates
export const action: ActionFunction = async ({ request }) => {
  const storeId = await getStoreIdFromRequest(request);
  if (!storeId) {
    return json({ success: false, error: "Store not authenticated" }, { status: 400 });
  }

  const formData = await request.formData();
  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString();
  const subject = formData.get("subject")?.toString();
  const bodyHtml = formData.get("bodyHtml")?.toString();
  const bodyText = formData.get("bodyText")?.toString();
  const method = formData.get("_method")?.toString() || "post";

  try {
    if (method === "put" && id) {
      // Update existing template
      const updatedTemplate = await prisma.emailTemplate.update({
        where: { id },
        data: { title, subject, bodyHtml, bodyText },
      });
      return json({ success: true, template: updatedTemplate });
    } else if (method === "post") {
      // Create new template
      const newTemplate = await prisma.emailTemplate.create({
        data: { storeId, title, subject, bodyHtml, bodyText },
      });
      return json({ success: true, template: newTemplate });
    } else {
      return json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error saving template:", error);
    return json({ success: false, error: error.message });
  }
};

export default function TemplateManager() {
  const { templates } = useLoaderData<{ templates: any[] }>();
  const fetcher = useFetcher();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  // Separate state to manage form fields
  const [templateForm, setTemplateForm] = useState({
    id: "",
    title: "",
    subject: "",
    bodyHtml: "",
    bodyText: "",
  });

  // Function to open the modal for editing or creating
  const openModal = (template = null) => {
    setEditTemplate(template);
    setIsModalOpen(true);
    if (template) {
      setTemplateForm({
        id: template.id,
        title: template.title,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
      });
    } else {
      setTemplateForm({
        id: "",
        title: "",
        subject: "",
        bodyHtml: "",
        bodyText: "",
      });
    }
  };

  // Function to close the modal
  const closeModal = () => {
    setEditTemplate(null);
    setIsModalOpen(false);
  };

  // Function to handle form input changes
  const handleChange = (field) => (value) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  // Function to handle form submission for creating or updating templates
  const handleSubmit = () => {
    const method = editTemplate ? "put" : "post";

    const formData = new FormData();
    formData.append("_method", method);
    if (editTemplate) formData.append("id", templateForm.id); // Append ID for updating
    formData.append("title", templateForm.title);
    formData.append("subject", templateForm.subject);
    formData.append("bodyHtml", templateForm.bodyHtml);
    formData.append("bodyText", templateForm.bodyText);

    fetcher.submit(formData, { method: "post", action: "/app/templates" });

    // Close modal after submission
    closeModal();
  };

  return (
    <Page fullWidth title="Notify Rush - Email Templates">
      <Layout>
        <div style={{ textAlign: "center", width: "100%" }}>
          <Button variant="primary" size="large" onClick={() => openModal()}>
            ✚ Add New Template
          </Button>
        </div>

        {/* Modal for creating/editing templates */}
        <Modal
          size="large"
          open={isModalOpen}
          onClose={closeModal}
          title={editTemplate ? "Edit Template" : "Create New Email Template"}
          primaryAction={{
            content: editTemplate ? "Update Template" : "Save Template",
            onAction: handleSubmit,
          }}
        >
          <Modal.Section>
            <TextField
              label="Title"
              value={templateForm.title}
              onChange={handleChange("title")}
              autoComplete="off"
            />
            <TextField
              label="Subject"
              value={templateForm.subject}
              onChange={handleChange("subject")}
              autoComplete="off"
            />
            <TextField
              label="Body (HTML)"
              value={templateForm.bodyHtml}
              multiline={4}
              onChange={handleChange("bodyHtml")}
              autoComplete="off"
              helpText="Use {{customer.name}} to insert the customer's name dynamically."
            />
            <TextField
              label="Body (Text)"
              value={templateForm.bodyText}
              multiline={4}
              onChange={handleChange("bodyText")}
              autoComplete="off"
              helpText="Use {{customer.name}} to insert the customer's name dynamically."
            />
          </Modal.Section>
        </Modal>

        {/* Display list of templates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
          {templates.map((template) => (
            <Card key={template.id} title={template.title} sectioned>
              <BlockStack vertical spacing="tight">
                <Badge tone="info">{template.subject}</Badge>
                <div style={{ padding: "10px 0" }}>
                  <p><strong>Body (HTML):</strong></p>
                  <div dangerouslySetInnerHTML={{ __html: template.bodyHtml }} />
                </div>
                <div style={{ padding: "10px 0" }}>
                  <p><strong>Body (Text):</strong></p>
                  <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                    {template.bodyText}
                  </pre>
                </div>
              </BlockStack>
              <div style={{ textAlign: "right", marginTop: "20px" }}>
                <Button onClick={() => openModal(template)} primary>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Layout>
    </Page>
  );
}
