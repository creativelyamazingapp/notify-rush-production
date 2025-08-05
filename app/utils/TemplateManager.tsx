import { useEffect, useState } from "react";
import { Button, Card, TextField, Layout, Modal, Page } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    subject: "",
    bodyHtml: "",
    bodyText: "",
  });

  const fetcher = useFetcher();

  const handleSaveTemplate = async () => {
    try {
      const response = await fetcher.submit(
        {
          title: newTemplate.title,
          subject: newTemplate.subject,
          bodyHtml: newTemplate.bodyHtml,
          bodyText: newTemplate.bodyText,
        },
        { method: "post", action: "/app/templates" }
      );
  
      if (response.ok) {
        // Clear modal form
        setIsModalOpen(false);
        setNewTemplate({ title: "", subject: "", bodyHtml: "", bodyText: "" });
        
        // Refresh template list after saving
        fetcher.load("/app/templates");
      } else {
        console.error("Failed to save template", response.status);
      }
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  useEffect(() => {
    fetcher.load("/app/templates");
  }, []);
  
  useEffect(() => {
    if (fetcher.data && fetcher.data.templates) {
      console.log("Templates fetched:", fetcher.data.templates); // Debug log
      setTemplates(fetcher.data.templates);
    }
  }, [fetcher.data]);
  
  
  return (
    <Page title="Manage Email Templates">
      <Layout>
        <Layout.Section>
          <Button primary onClick={() => setIsModalOpen(true)}>
            Add New Template
          </Button>

          {/* Modal for creating/editing templates */}
          <Modal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Create New Email Template"
            primaryAction={{
              content: "Save Template",
              onAction: handleSaveTemplate,
            }}
          >
            <Modal.Section>
              <TextField
                label="Title"
                value={newTemplate.title}
                onChange={(value) =>
                  setNewTemplate((prev) => ({ ...prev, title: value }))
                }
              />
              <TextField
                label="Subject"
                value={newTemplate.subject}
                onChange={(value) =>
                  setNewTemplate((prev) => ({ ...prev, subject: value }))
                }
              />
              <TextField
                label="Body (HTML)"
                value={newTemplate.bodyHtml}
                multiline={4}
                onChange={(value) =>
                  setNewTemplate((prev) => ({ ...prev, bodyHtml: value }))
                }
              />
              <TextField
                label="Body (Text)"
                value={newTemplate.bodyText}
                multiline={4}
                onChange={(value) =>
                  setNewTemplate((prev) => ({ ...prev, bodyText: value }))
                }
              />
            </Modal.Section>
          </Modal>

          {/* Display templates */}
          <div style={{ marginTop: "20px" }}>
            {templates.map((template) => (
              <Card key={template.title} title={template.title}>
                <p>Subject: {template.subject}</p>
                <p>Body: {template.bodyHtml}</p>
              </Card>
            ))}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default TemplateManager;
