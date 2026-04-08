import { prisma } from "../db/prisma.js";
import { syncInflowProductsToDatabase } from "../modules/products/product-sync.service.js";

async function main() {
  const result = await syncInflowProductsToDatabase();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
