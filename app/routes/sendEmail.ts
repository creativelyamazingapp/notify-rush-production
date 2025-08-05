import { SendEmailCommand } from "@aws-sdk/client-ses";
import sesClient from "../utils/awsSES";
import { ActionFunction, json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "app/shopify.server";

const prisma = new PrismaClient();

interface SendEmailParams {
  toAddresses: string[];
  subject: string;
  bodyHtml: string;  // Potentially empty
  bodyText: string;  // Potentially empty
  orderId: string;
  customerName: string;
  shopDomain: string;
}

/**
 * Replaces placeholders like {{ customer.name }} with actual values.
 */
function replacePlaceholders(
  template: string,
  replacements: { [key: string]: string }
) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    return replacements[key.trim()] || "";
  });
}

/**
 * Sends an email via AWS SES with open-tracking pixel. 
 * Even if the user wants "text-only", we include a minimal HTML part
 * so that the pixel can load in HTML-capable clients,
 * and we embed the text content in that HTML as well so it isn't "blank."
 */
export const sendEmail = async ({
  toAddresses,
  subject,
  bodyHtml,
  bodyText,
  orderId,
  customerName,
  shopDomain,
}: SendEmailParams) => {
  // Validate
  const missingFields = [];
  if (!subject.trim()) missingFields.push("subject");
  if (!bodyHtml.trim() && !bodyText.trim()) {
    missingFields.push("bodyHtml or bodyText");
  }
  if (missingFields.length > 0) {
    throw new Error(`Missing required field(s): ${missingFields.join(", ")}`);
  }

  // Check for active sender
  const activeSenderEmail = await prisma.senderEmail.findFirst({
    where: { isActive: true, shop: shopDomain },
  });
  if (!activeSenderEmail) {
    throw new Error("No active sender email found for the store. Please set one as active.");
  }
  if (!orderId) {
    throw new Error("orderId is missing or not provided.");
  }

  // Basic name placeholder
  const firstName = (customerName || "").split(" ")[0] || "Customer";
  const replacements = { "customer.name": firstName };

  // Generate unique trackingId
  const trackingId = Math.random().toString(36).substring(2);
  // Example domain: "https://YOUR_DOMAIN/tracking/:trackingId"
  const trackingUrl = `https://up-to-date.fly.dev/tracking/${trackingId}`;

  // Prepare final subject
  const finalSubject = replacePlaceholders(subject, replacements);

  // Replace placeholders in user-provided bodies
  let replacedHtml = bodyHtml.trim()
    ? replacePlaceholders(bodyHtml, replacements)
    : "";
  let replacedText = bodyText.trim()
    ? replacePlaceholders(bodyText, replacements)
    : "";

  // If there's HTML, embed the pixel
  let finalBodyHtml = "";
  if (replacedHtml) {
    finalBodyHtml =
      replacedHtml + `<img src="${trackingUrl}" width="1" height="1" style="display:none;" />`;
  }
  // If user said "text only" (no HTML given) but there's text:
  // We still build a minimal HTML that includes their text plus the pixel.
  else if (!replacedHtml && replacedText) {
    finalBodyHtml = `
      <html>
        <body style="white-space: pre-wrap; font-family: sans-serif;">
          <div>${replacedText}</div>
          <img src="${trackingUrl}" width="1" height="1" style="display:none;" />
        </body>
      </html>
    `;
  }

  // Final text remains the text content, if any
  const finalBodyText = replacedText;

  // Construct SES body
  const Body: { Html?: { Data: string }; Text?: { Data: string } } = {};
  if (finalBodyHtml.trim()) {
    Body.Html = { Data: finalBodyHtml.trim() };
  }
  if (finalBodyText.trim()) {
    Body.Text = { Data: finalBodyText.trim() };
  }

  const params = {
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Body,
      Subject: { Data: finalSubject },
    },
    Source: activeSenderEmail.email,
  };

  try {
    // Send email
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    // Log email details
    await prisma.emailLog.create({
      data: {
        orderId: orderId.toString(),
        email: toAddresses.join(", "),
        subject: finalSubject,
        bodyHtml: finalBodyHtml,
        bodyText: finalBodyText,
        sentCount: 1,
        isOpened: false,
        isBouncedBack: false,
        deliveryStatus: "Sent",
        customerName: customerName || "Unknown",
        shop: shopDomain,
        trackingId,
      },
    });

    return response;
  } catch (error: any) {
    console.error("Error sending email with SES:", error);

    // Log failure
    await prisma.emailLog.create({
      data: {
        orderId: orderId.toString(),
        email: toAddresses.join(", "),
        subject: finalSubject,
        bodyHtml: finalBodyHtml,
        bodyText: finalBodyText,
        sentCount: 1,
        isOpened: false,
        isBouncedBack: true,
        deliveryStatus: `Failed: ${error.message}`,
        customerName: customerName || "Unknown",
        shop: shopDomain,
      },
    });
    throw error;
  }
};

// The Remix action to handle POST requests for sending email
export const action: ActionFunction = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shopDomain = session.shop;

    const { toAddresses, subject, bodyHtml, bodyText, orderId, customerName } =
      await request.json();

    if (!orderId || typeof orderId !== "string") {
      throw new Error("orderId must be provided and should be a string.");
    }
    if (!shopDomain || typeof shopDomain !== "string") {
      throw new Error("shopDomain must be provided and should be a string.");
    }

    await sendEmail({
      toAddresses,
      subject,
      bodyHtml,
      bodyText,
      orderId,
      customerName,
      shopDomain,
    });

    return json({ message: "Email sent successfully", success: true });
  } catch (error: any) {
    console.error("Error sending email:", error);

    if (error.message.includes("Missing required field")) {
      return json({ error: error.message, success: false }, { status: 400 });
    }
    if (error.message.includes("No active sender email found")) {
      return json(
        { error: "No active sender email found. Please set one as active.", success: false },
        { status: 400 }
      );
    }
    return json({ error: "Failed to send email", success: false }, { status: 500 });
  }
};
