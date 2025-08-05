import React, { useEffect, useRef } from "react";
import { DataTable } from "@shopify/polaris";

/**
 * NOTE: If TypeScript complains about "ui-modal" or "ui-title-bar",
 * you may need to add a global declaration:
 *
 * declare global {
 *   namespace JSX {
 *     interface IntrinsicElements {
 *       "ui-modal": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
 *         show?: () => Promise<void>;
 *         hide?: () => Promise<void>;
 *         variant?: "small" | "base" | "large" | "max";
 *       };
 *       "ui-title-bar": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
 *         title?: string;
 *       };
 *     }
 *   }
 * }
 */

interface EmailResult {
  sNo: number;
  dateTime: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  status: string; // 'Delivered' or 'Error'
}

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: EmailResult[];
}

/**
 * EmailConfirmationModal:
 *   - Replaces Polaris <Modal> with the new `ui-modal` web component
 *   - Uses .show() / .hide() methods on the <ui-modal> ref
 *   - Listens for the "hide" event to call onClose
 *   - Displays a Polaris <DataTable> with the email-sending results
 *   - Uses variant="max" to make the modal as large as possible
 */
export default function EmailConfirmationModal({
  isOpen,
  onClose,
  data,
}: EmailConfirmationModalProps) {
  // We'll store a reference to the <ui-modal> element
  const modalRef = useRef<any>(null);

  // Show/hide the modal when `isOpen` changes
  useEffect(() => {
    const uiModalEl = modalRef.current;
    if (!uiModalEl) return;

    // If user triggers a close from the outside, we'll hide the modal
    if (isOpen) {
      uiModalEl.show?.();
    } else {
      uiModalEl.hide?.();
    }
  }, [isOpen]);

  // Attach a 'hide' listener so that if the user hits Esc or clicks outside,
  // we trigger onClose. That keeps parent state in sync.
  useEffect(() => {
    const uiModalEl = modalRef.current;
    if (!uiModalEl) return;

    const handleHide = () => {
      onClose();
    };

    uiModalEl.addEventListener("hide", handleHide);
    return () => {
      uiModalEl.removeEventListener("hide", handleHide);
    };
  }, [onClose]);

  // Build rows for the DataTable
  const rows = data.map((item) => [
    item.sNo,
    item.dateTime,
    item.customerName,
    item.customerEmail,
    item.orderNumber,
    item.status,
  ]);

  // Let user close on a button if desired
  const handleManualClose = async () => {
    if (modalRef.current) {
      await modalRef.current.hide?.(); // triggers the 'hide' event => onClose
    }
  };

  return (
    /**
     * We assign an ID for clarity (not strictly required),
     * and use variant="max" to maximize the modal size.
     */
    <ui-modal id="email-confirmation-modal" ref={modalRef} variant="large">
      {/*
        The `ui-modal` requires a single top-level element (commonly a <div>)
        to hold everything, including <ui-title-bar> and your content.
      */}
        <ui-title-bar title="Email Confirmation"></ui-title-bar>

      <div style={{ padding: "16px" }}>
        {/* Title bar with a close button */}
        <ui-title-bar title="Email Delivery Status">
          {/* Example button to close manually */}
          <button variant="primary" onClick={handleManualClose}>
            Close
          </button>
        </ui-title-bar>

        {/* Display the results in a Polaris DataTable */}
        <div style={{ marginTop: "16px",  fontWeight: "bold" }}>
          <DataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
            ]}
            headings={[
                <span style={{ fontWeight: "bold" }}>S No.</span>,
                <span style={{ fontWeight: "bold" }}>Date & Time</span>,
                <span style={{ fontWeight: "bold" }}>Customer Name</span>,
                <span style={{ fontWeight: "bold" }}>Customer Email</span>,
                <span style={{ fontWeight: "bold" }}>Order #</span>,
                <span style={{ fontWeight: "bold" }}>Status</span>,
            ]}
            rows={rows}
          />
        </div>
      </div>
    </ui-modal>
  );
}
