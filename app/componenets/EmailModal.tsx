// import { useState, useEffect } from "react";
// import { Modal, Select, TextField, Checkbox, Text } from "@shopify/polaris";
// import { useFetcher } from "@remix-run/react";

// const EmailModal = ({ isOpen, onClose, onSend }) => {
//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState("");
//   const [subject, setSubject] = useState("");
//   const [bodyHtml, setBodyHtml] = useState("");
//   const [bodyText, setBodyText] = useState("");
//   const [sendHtml, setSendHtml] = useState(true); // default to true if desired
//   const [sendText, setSendText] = useState(true); // default to true if desired

//   const fetcher = useFetcher();

//   // Fetch templates when the modal is opened
//   useEffect(() => {
//     if (isOpen) {
//       fetcher.load("/app/templates");
//     }
//   }, [isOpen]);

//   // Update templates when fetcher data is available
//   useEffect(() => {
//     if (fetcher.data && fetcher.data.templates) {
//       setTemplates(fetcher.data.templates);
//     }
//   }, [fetcher.data]);

//   // Handle template selection and auto-fill subject and body
//   const handleTemplateChange = (value) => {
//     setSelectedTemplate(value);
//     const template = templates.find((t) => t.id === value);
//     if (template) {
//       setSubject(template.subject || "");
//       setBodyHtml(template.bodyHtml || "");
//       setBodyText(template.bodyText || "");
//     }
//   };

//   const handleSend = () => {
//     // Always provide bodyHtml and bodyText, even if empty
//     const htmlToSend = sendHtml ? bodyHtml : "";
//     const textToSend = sendText ? bodyText : "";
//     onSend({ subject, bodyHtml: htmlToSend, bodyText: textToSend });
//   };

//   return (
//     <Modal
//       size="large"
//       open={isOpen}
//       onClose={onClose}
//       title="Send Email"
//       primaryAction={{
//         content: "Send",
//         onAction: handleSend,
//       }}
//     >
//       <Modal.Section>
//         <Select
//           label="Select Template"
//           options={templates.map((template) => ({
//             label: template.title,
//             value: template.id,
//           }))}
//           value={selectedTemplate}
//           onChange={handleTemplateChange}
//         />
//         <TextField
//           label="Subject"
//           value={subject}
//           onChange={(value) => setSubject(value)}
//         />
        
//         {/* HTML Body and Checkbox */}
//         <TextField
//           label="Body (HTML)"
//           value={bodyHtml}
//           onChange={(value) => setBodyHtml(value)}
//           multiline={4}
//         />
//         <Checkbox
//           label="Send HTML"
//           checked={sendHtml}
//           onChange={setSendHtml}
//         />

//         {/* Text Body and Checkbox */}
//         <TextField
//           label="Body (Text)"
//           value={bodyText}
//           onChange={(value) => setBodyText(value)}
//           multiline={4}
//         />
//         <Checkbox
//           label="Send Text"
//           checked={sendText}
//           onChange={setSendText}
//         />
//          <Text>
//         If template is not appearing, try adding one more template.
//       </Text>
//       </Modal.Section>
//     </Modal>
//   );
// };

// export default EmailModal;


import React, { useState, useEffect } from "react";
import {
  Modal,
  Select,
  TextField,
  Checkbox,
  Text,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";

interface Template {
  id: string;
  title: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called when the user clicks the "Send" button. 
   * Must be async for the loader to work correctly.
   */
  onSend: (payload: {
    subject: string;
    bodyHtml: string;
    bodyText: string;
  }) => Promise<void>;
}

export default function EmailModal({ isOpen, onClose, onSend }: EmailModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sendHtml, setSendHtml] = useState(false); // toggles sending the HTML body
  const [sendText, setSendText] = useState(true); // toggles sending the Text body
  const [isSending, setIsSending] = useState(false);

  const fetcher = useFetcher();

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetcher.load("/app/templates");
    }
  }, [isOpen]);

  // Update local template list once fetcher loads them
  useEffect(() => {
    if (fetcher.data && fetcher.data.templates) {
      setTemplates(fetcher.data.templates);
    }
  }, [fetcher.data]);

  // When user picks a template, update subject, bodyHtml, and bodyText
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject || "");
      setBodyHtml(template.bodyHtml || "");
      setBodyText(template.bodyText || "");
    }
  };

  // Called when user presses "Send"
  const handleSend = async () => {
    setIsSending(true);

    // Build the final bodies based on checkboxes
    const htmlToSend = sendHtml ? bodyHtml : "";
    const textToSend = sendText ? bodyText : "";

    try {
      // Wait for the parent's onSend to complete
      await onSend({
        subject,
        bodyHtml: htmlToSend,
        bodyText: textToSend,
      });
    } catch (err) {
      console.error("Error in handleSend:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Full-screen loader overlay when sending */}
      {isSending && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <h1 className="loading-text">Sending emails...</h1>
        </div>
      )}

      <Modal
        size="large"
        open={isOpen}
        onClose={onClose}
        title="Send Email"
        primaryAction={{
          content: "Send",
          onAction: handleSend,
        }}
      >
        <Modal.Section>
          <Select
            label="Select Template"
            options={templates.map((template) => ({
              label: template.title,
              value: template.id,
            }))}
            value={selectedTemplate}
            onChange={handleTemplateChange}
          />
          <TextField
            label="Subject"
            value={subject}
            onChange={(value) => setSubject(value)}
          />

          {/* HTML Body */}
          <TextField
            label="Body (HTML)"
            value={bodyHtml}
            onChange={(value) => setBodyHtml(value)}
            multiline={4}
          />
          <Checkbox
            label="Send HTML"
            checked={sendHtml}
            onChange={setSendHtml}
          />

          {/* Text Body */}
          <TextField
            label="Body (Text)"
            value={bodyText}
            onChange={(value) => setBodyText(value)}
            multiline={4}
          />
          <Checkbox
            label="Send Text"
            checked={sendText}
            onChange={setSendText}
          />

          <Text>
            If no templates appear, try adding one or more templates.
          </Text>
        </Modal.Section>
      </Modal>

      {/* You can style these .loading-overlay, .loading-spinner, and .loading-text classes 
          in your "style.css" or a global CSS file. For example:

          .loading-overlay {
            position: fixed;
            z-index: 9999;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(255, 255, 255, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 6px solid #f3f3f3;
            border-top: 6px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .loading-text {
            margin-top: 16px;
            font-size: 18px;
            color: #555;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
      */}
    </>
  );
}
