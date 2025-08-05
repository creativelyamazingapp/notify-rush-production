import { LoaderFunction } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ params }) => {
  const { trackingId } = params;

  if (!trackingId) {
    throw new Error("Tracking ID is required");
  }

  // Update the EmailLog to mark the email as opened
  try {
    await prisma.emailLog.updateMany({
      where: { trackingId },
      data: { isOpened: true },
    });
    console.log(`Email with tracking ID ${trackingId} marked as opened.`);
  } catch (error) {
    console.error("Error updating email open status:", error);
  }

  // Return a 1x1 transparent pixel
  return new Response(Buffer.from([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 255, 0, 255, 255, 255, 0, 0, 0, 33, 249, 4, 1, 0, 0, 1, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]), {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": "43",
	      "Access-Control-Allow-Origin": "*",
    },
  });
};
