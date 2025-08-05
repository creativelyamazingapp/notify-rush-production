import { LoaderFunction, json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

type StoreData = {
    storeName: string[];
    storeUrl: string[];
  };
  

export const loader: LoaderFunction = async () => {
  const prisma = new PrismaClient();
  try {
    const stores = await prisma.session.findMany({
      select: {
        id: true,
        shop: true,
      },
    });
    console.log("Stores", stores)
    return json({ stores });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return json({ stores: [] }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

