// app/utils/getShopAccessToken.server.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Retrieve the access token from the Session table for a given shop domain.
 */
export async function getShopAccessToken(shopDomain: string): Promise<string | null> {
  try {
    const sessionRecord = await prisma.session.findFirst({
      where: { shop: shopDomain },
    });
    if (!sessionRecord || !sessionRecord.accessToken) {
      return null;
    }
    return sessionRecord.accessToken;
  } catch (error) {
    console.error(`[getShopAccessToken] Error fetching token for ${shopDomain}:`, error);
    return null;
  }
}
