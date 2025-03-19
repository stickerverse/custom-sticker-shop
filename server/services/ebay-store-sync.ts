import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Product, InsertProduct } from '../../shared/schema';
import { storage } from '../storage';
import { getEbayToken, getEbayProductsFromBrowseAPI, getEbayProducts } from './ebay';
import { logSync, saveProductsToJson, saveProductsToCsv, getSyncLogs as getSyncLogsFile } from './ebay-sync';

// Get eBay products without importing them
export async function getEbayProductsApi(req: Request, res: Response) {
  try {
    logSync('Fetching eBay products for selection...');

    // Attempt to get products from inventory API first
    let ebayProducts: any[] = [];
    try {
      logSync('Attempting to fetch products from eBay Inventory API...');
      ebayProducts = await getEbayProducts();
      logSync(`Retrieved ${ebayProducts.length} products from Inventory API`);
    } catch (error) {
      logSync('Inventory API failed, falling back to Browse API...');
      ebayProducts = await getEbayProductsFromBrowseAPI();
      logSync(`Retrieved ${ebayProducts.length} products from Browse API`);
    }

    if (ebayProducts.length === 0) {
      throw new Error('No products retrieved from eBay APIs');
    }

    return res.status(200).json({
      success: true,
      products: ebayProducts
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Failed to fetch eBay products - ${errorMessage}`);

    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

// Import only selected products
export async function importSelectedEbayProducts(req: Request, res: Response) {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No product IDs provided for import'
      });
    }

    logSync(`Starting selective import of ${productIds.length} eBay products...`);

    // Fetch all eBay products first
    let allEbayProducts: any[] = [];
    try {
      allEbayProducts = await getEbayProducts();
    } catch (error) {
      allEbayProducts = await getEbayProductsFromBrowseAPI();
    }

    // Filter products by the selected IDs
    const selectedProducts = allEbayProducts.filter(product => {
      const productId = product.itemId || product.sku;
      return productIds.includes(productId);
    });

    logSync(`Found ${selectedProducts.length} products matching selected IDs`);

    // Import the selected products
    const importedProducts: Product[] = [];
    const errors: any[] = [];

    for (const ebayProduct of selectedProducts) {
      try {
        // Extract product details
        const title = ebayProduct.title || 
                    ebayProduct.product?.title || 
                    ebayProduct.inventoryItem?.product?.title ||
                    ebayProduct.sku || 
                    "eBay Product";

        const description = ebayProduct.shortDescription || 
                          ebayProduct.description || 
                          ebayProduct.product?.description ||
                          ebayProduct.inventoryItem?.product?.description ||
                          title;

        const imageUrl = ebayProduct.image?.imageUrl || 
                        ebayProduct.product?.imageUrls?.[0] ||
                        ebayProduct.inventoryItem?.product?.imageUrls?.[0] ||
                        "https://i.imgur.com/FV6jJVk.jpg";

        let price = 9.99; // Default price if none is found

        if (ebayProduct.price?.value) {
          price = parseFloat(ebayProduct.price.value);
        } else if (ebayProduct.offers && Array.isArray(ebayProduct.offers) && ebayProduct.offers.length > 0) {
          const offer = ebayProduct.offers[0];
          if (offer.price?.value) {
            price = parseFloat(offer.price.value);
          }
        }

        // Create product in our database
        const insertProduct: InsertProduct = {
          title,
          description,
          price,
          imageUrl,
          categoryId: 1, // Default category for stickers
        };

        // Add product to our database
        const product = await storage.createProduct(insertProduct);
        importedProducts.push(product);

        // Add default options for each sticker product
        const options = [
          { optionType: 'size', optionValue: 'small', priceModifier: 0.00 },
          { optionType: 'size', optionValue: 'medium', priceModifier: 2.00 },
          { optionType: 'size', optionValue: 'large', priceModifier: 4.00 },
          { optionType: 'material', optionValue: 'matte', priceModifier: 0.00 },
          { optionType: 'material', optionValue: 'glossy', priceModifier: 1.00 },
          { optionType: 'shape', optionValue: 'rectangle', priceModifier: 0.00 },
          { optionType: 'shape', optionValue: 'circle', priceModifier: 0.50 },
          { optionType: 'shape', optionValue: 'custom', priceModifier: 1.50 },
        ];

        // Save product options
        for (const option of options) {
          await storage.createProductOption({
            productId: product.id,
            optionType: option.optionType,
            optionValue: option.optionValue,
            priceModifier: option.priceModifier
          });
        }

        logSync(`Successfully imported product: ${title}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logSync(`ERROR: Failed to import product - ${errorMessage}`);
        errors.push({
          productId: ebayProduct.itemId || ebayProduct.sku,
          error: errorMessage
        });
      }
    }

    logSync(`Import completed. ${importedProducts.length} products imported, ${errors.length} failed`);

    return res.status(200).json({
      success: true,
      importedCount: importedProducts.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Failed to import selected products - ${errorMessage}`);

    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

// Sync products from eBay and save to files
export async function syncEbayProducts(req: Request, res: Response) {
  try {
    logSync('Starting eBay product sync...');
    
    // Fetch products from eBay
    let ebayProducts: any[] = [];
    try {
      logSync('Attempting to fetch products from eBay Inventory API...');
      ebayProducts = await getEbayProducts();
      logSync(`Retrieved ${ebayProducts.length} products from Inventory API`);
    } catch (error) {
      logSync('Inventory API failed, falling back to Browse API...');
      ebayProducts = await getEbayProductsFromBrowseAPI();
      logSync(`Retrieved ${ebayProducts.length} products from Browse API`);
    }
    
    if (ebayProducts.length === 0) {
      throw new Error('No products retrieved from eBay APIs');
    }
    
    // Save to JSON and CSV files
    const jsonFile = await saveProductsToJson(ebayProducts);
    const csvFile = await saveProductsToCsv(ebayProducts);
    
    logSync(`Sync completed. Files saved: ${jsonFile}, ${csvFile}`);
    
    return res.status(200).json({
      success: true,
      productsImported: ebayProducts.length,
      jsonFile,
      csvFile
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: Sync failed - ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

// Handle request to download eBay products as JSON
export async function getEbayProductsJsonDownload(req: Request, res: Response) {
  const DATA_DIR = './shared/data';
  const PRODUCTS_JSON_FILE = path.join(DATA_DIR, 'ebay-products.json');
  
  try {
    if (!fs.existsSync(PRODUCTS_JSON_FILE)) {
      // If the file doesn't exist, create it by fetching products
      logSync('JSON file not found, fetching products...');
      const products = await getEbayProductsFromBrowseAPI();
      await saveProductsToJson(products);
    }
    
    if (fs.existsSync(PRODUCTS_JSON_FILE)) {
      logSync('Serving JSON file download');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=ebay-products.json');
      
      const fileStream = fs.createReadStream(PRODUCTS_JSON_FILE);
      fileStream.pipe(res);
    } else {
      throw new Error('Failed to create JSON file');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: JSON download failed - ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to download JSON file: ' + errorMessage
    });
  }
}

// Handle request to download eBay products as CSV
export async function getEbayProductsCsvDownload(req: Request, res: Response) {
  const DATA_DIR = './shared/data';
  const PRODUCTS_CSV_FILE = path.join(DATA_DIR, 'ebay-products.csv');
  
  try {
    if (!fs.existsSync(PRODUCTS_CSV_FILE)) {
      // If the file doesn't exist, create it by fetching products
      logSync('CSV file not found, fetching products...');
      const products = await getEbayProductsFromBrowseAPI();
      await saveProductsToCsv(products);
    }
    
    if (fs.existsSync(PRODUCTS_CSV_FILE)) {
      logSync('Serving CSV file download');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ebay-products.csv');
      
      const fileStream = fs.createReadStream(PRODUCTS_CSV_FILE);
      fileStream.pipe(res);
    } else {
      throw new Error('Failed to create CSV file');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSync(`ERROR: CSV download failed - ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to download CSV file: ' + errorMessage
    });
  }
}

// Get sync logs
export async function getSyncLogs(req: Request, res: Response) {
  try {
    // Use the imported renamed function from ebay-sync.ts
    const logs = getSyncLogsFile();
    
    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting sync logs:', error);
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
