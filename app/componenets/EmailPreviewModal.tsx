// import React, { useMemo } from "react";
// import { Modal, Text } from "@shopify/polaris";

// export type OrderPreview = {
//   orderNumber: string;
//   customerName: string;
//   customerEmail: string;
//   orderedProducts: string;
// };

// type EmailPreviewModalProps = {
//   isOpen: boolean;
//   orders: OrderPreview[];
//   onClose: () => void;
//   onConfirm: () => void;
// };

// const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ isOpen, orders, onClose, onConfirm }) => {
//   // Compute a map of email counts to determine duplicates.
//   const duplicateMap = useMemo(() => {
//     const map: Record<string, number> = {};
//     orders.forEach((order) => {
//       if (order.customerEmail) {
//         map[order.customerEmail] = (map[order.customerEmail] || 0) + 1;
//       }
//     });
//     return map;
//   }, [orders]);

//   return (
//     <Modal
//       open={isOpen}
//       onClose={onClose}
//       title="Email Preview"
//       primaryAction={{
//         content: "Send Email",
//         onAction: onConfirm,
//       }}
//       secondaryActions={[
//         {
//           content: "Cancel",
//           onAction: onClose,
//         },
//       ]}
//     >
//       <Modal.Section>
//         <Text variant="bodyMd">
//           Please review the list of orders below before sending the email.
//         </Text>
//         <div style={{ overflowX: "auto", marginTop: "1rem" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 <th style={{ border: "1px solid #ccc", padding: "8px" }}>S No.</th>
//                 <th style={{ border: "1px solid #ccc", padding: "8px" }}>Order#</th>
//                 <th style={{ border: "1px solid #ccc", padding: "8px" }}>Customer Name</th>
//                 <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email Address</th>
//                 <th style={{ border: "1px solid #ccc", padding: "8px" }}>Is Duplicate</th>
//                 <th style={{ border: "1px solid #ccc", padding: "8px" }}>Products</th>
//               </tr>
//             </thead>
//             <tbody>
//               {orders.map((order, index) => (
//                 <tr key={order.orderNumber}>
//                   <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{index + 1}</td>
//                   <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.orderNumber}</td>
//                   <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.customerName}</td>
//                   <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.customerEmail}</td>
//                   <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
//                     {duplicateMap[order.customerEmail] > 1 ? "Yes" : "No"}
//                   </td>
//                   <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.orderedProducts}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Modal.Section>
//     </Modal>
//   );
// };

// export default EmailPreviewModal;


import React, { useMemo } from "react";
import { Modal, Text } from "@shopify/polaris";

export type OrderPreview = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderedProducts: string;
};

type EmailPreviewModalProps = {
  isOpen: boolean;
  orders: OrderPreview[];
  onClose: () => void;
  onConfirm: () => void;
};

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ isOpen, orders, onClose, onConfirm }) => {
  // Compute a map of email counts to determine duplicates.
  const duplicateMap = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((order) => {
      if (order.customerEmail) {
        map[order.customerEmail] = (map[order.customerEmail] || 0) + 1;
      }
    });
    return map;
  }, [orders]);

  return (

    <Modal
    size="large"
      open={isOpen}
      onClose={onClose}
      title="Email Preview"
      primaryAction={{
        content: "Send Email",
        onAction: onConfirm,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
  
      <Modal.Section>
        <Text variant="bodyMd">
          Please review the list of orders below before sending the email.
        </Text>
        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>S No.</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Order#</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Customer Name</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email Address</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Is Duplicate</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Products</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.orderNumber}>
                  <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{index + 1}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.orderNumber}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.customerName}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.customerEmail}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                    {duplicateMap[order.customerEmail] > 1 ? "Yes" : "No"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.orderedProducts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal.Section>
    </Modal>
    
  );
};

export default EmailPreviewModal;
