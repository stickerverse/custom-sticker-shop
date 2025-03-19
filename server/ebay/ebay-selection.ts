import { Request, Response } from "express";
import { Product, InsertProduct } from "../../shared/schema";
import { storage } from "../storage";
import {
  getEbayToken,
  getEbayProductsFromBrowseAPI,
  getEbayProducts,
} from "../services/ebay";
import {
  logSync,
  saveProductsToJson,
  saveProductsToCsv,
} from "../services/ebay-sync";

// Get eBay products without importing them
export async function getEbayProductsApi(
  req: Request,
  res: Response,
) {
  try {
    logSync("Fetching eBay products for selection...");

    // Attempt to get products from inventory API first
    let ebayProducts: any[] = [];
    try {
      logSync("Attempting to fetch products from eBay Inventory API...");
      ebayProducts = await getEbayProducts();
      logSync(`Retrieved ${ebayProducts.length} products from Inventory API`);
    } catch (error) {
      logSync("Inventory API failed, falling back to Browse API...");
      ebayProducts = await getEbayProductsFromBrowseAPI();
      logSync(`Retrieved ${ebayProducts.length} products from Browse API`);
    }

    if (ebayProducts.length === 0) {
      throw new Error("No products retrieved from eBay APIs");
    }

    return res.status(200).json({
      success: true,
      products: ebayProducts,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logSync(`ERROR: Failed to fetch eBay products - ${errorMessage}`);

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

// Import only selected products
export async function importSelectedEbayProducts(
  req: Request,
  res: Response,
) {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No product IDs provided for import",
      });
    }

    logSync(
      `Starting selective import of ${productIds.length} eBay products...`,
    );

    // Fetch all eBay products first
    let allEbayProducts: any[] = [];
    try {
      allEbayProducts = await getEbayProducts();
    } catch (error) {
      allEbayProducts = await getEbayProductsFromBrowseAPI();
    }

    // Filter products by the selected IDs
    const selectedProducts = allEbayProducts.filter((product) => {
      const productId = product.itemId || product.sku;
      return productIds.includes(productId);
    });

    logSync(`Found ${selectedProducts.length} products matching selected IDs`);

    // Save raw eBay data to files
    await saveProductsToJson(selectedProducts);
    await saveProductsToCsv(selectedProducts);

    // Import the selected products
    const importedProducts: Product[] = [];
    const errors: any[] = [];

    for (const ebayProduct of selectedProducts) {
      try {
        // Extract product details
        const title =
          ebayProduct.title ||
          ebayProduct.product?.title ||
          ebayProduct.inventoryItem?.product?.title ||
          ebayProduct.sku ||
          "eBay Product";

        const description =
          ebayProduct.shortDescription ||
          ebayProduct.description ||
          ebayProduct.product?.description ||
          ebayProduct.inventoryItem?.product?.description ||
          title;

        const imageUrl =
          ebayProduct.image?.imageUrl ||
          ebayProduct.product?.imageUrls?.[0] ||
          ebayProduct.inventoryItem?.product?.imageUrls?.[0] ||
          "https://i.imgur.com/FV6jJVk.jpg";

        let price = 9.99; // Default price if none is found

        if (ebayProduct.price?.value) {
          price = parseFloat(ebayProduct.price.value);
        } else if (
          ebayProduct.offers &&
          Array.isArray(ebayProduct.offers) &&
          ebayProduct.offers.length > 0
        ) {
          const offer = ebayProduct.offers[0];
          if (offer.price?.value) {
            price = parseFloat(offer.price.value);
          }
        }

        // Create product in our database
        const insertProduct: InsertProduct = {
          title,
          description,
          price: Math.round(price * 100), // Convert to cents as per schema
          imageUrl,
          categoryId: 1, // Default category for stickers
        };

        // Add product to our database
        const product = await storage.createProduct(insertProduct);
        importedProducts.push(product);

        // Add default options for each sticker product
        const options = [
          {
            optionType: "size",
            optionValue: "Small (2 x 3.8 in)",
            priceModifier: 0,
          },
          {
            optionType: "size",
            optionValue: "Medium (2.9 x 5.5 in)",
            priceModifier: 200,
          },
          {
            optionType: "size",
            optionValue: "Large (4.5 x 8.5 in)",
            priceModifier: 400,
          },
          {
            optionType: "size",
            optionValue: "Extra Large (7.5 x 14 in)",
            priceModifier: 800,
          },
          {
            optionType: "material",
            optionValue: "Prismatic",
            priceModifier: 200,
          },
          {
            optionType: "material",
            optionValue: "Kraft Paper",
            priceModifier: 0,
          },
          {
            optionType: "material",
            optionValue: "Hi-Tack Vinyl",
            priceModifier: 100,
          },
          { optionType: "finish", optionValue: "Glossy", priceModifier: 0 },
          { optionType: "finish", optionValue: "Matte", priceModifier: 100 },
          {
            optionType: "shape",
            optionValue: "Contour Cut",
            priceModifier: 200,
          },
          { optionType: "shape", optionValue: "Square", priceModifier: 0 },
        ];

        // Save product options
        for (const option of options) {
          await storage.createProductOption({
            productId: product.id,
            optionType: option.optionType,
            optionValue: option.optionValue,
            priceModifier: option.priceModifier,
          });
        }

        logSync(`Successfully imported product: ${title}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logSync(`ERROR: Failed to import product - ${errorMessage}`);
        errors.push({
          productId: ebayProduct.itemId || ebayProduct.sku,
          error: errorMessage,
        });
      }
    }

    logSync(
      `Import completed. ${importedProducts.length} products imported, ${errors.length} failed`,
    );

    return res.status(200).json({
      success: true,
      importedCount: importedProducts.length,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logSync(`ERROR: Failed to import selected products - ${errorMessage}`);

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
