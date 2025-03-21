/**
 * eBay Token Management and Validation
 * Provides utilities to check validity and permissions of eBay OAuth tokens
 */

import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { getEbayToken } from './ebay';
import { logSync } from './ebay-sync';

interface TokenInfo {
  valid: boolean;
  missing?: boolean;
  expired?: boolean;
  scopes?: string[];
  error?: string;
}

/**
 * Checks the status and validity of the provided eBay API token
 * @returns Information about the token's validity and permissions
 */
export async function checkEbayTokenStatus(): Promise<TokenInfo> {
  try {
    // First check if we have an eBay token available in environment variables
    const token = process.env.EBAY_TOKEN;
    
    if (!token) {
      logSync("eBay token check failed: No token found in environment variables");
      return {
        valid: false,
        missing: true,
        error: "No eBay token provided in environment variables"
      };
    }
    
    // Try to validate the token using the browse API which is more lenient with permissions
    try {
      // First, try with the Browse API which should work with the basic scope
      const response = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search?q=stickers&limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      });
      
      // If we get a successful response, the token is valid for basic data access
      if (response.status === 200) {
        logSync("eBay token check: Token is valid for Browse API");
        return {
          valid: true,
          scopes: ['browse.api.readonly']
        };
      } else {
        logSync(`eBay token check: Unexpected status code ${response.status}`);
        return {
          valid: false,
          error: `Unexpected status code: ${response.status}`
        };
      }
    } catch (apiError: any) {
      // Try a fallback API endpoint that needs fewer permissions
      try {
        const fallbackResponse = await axios.get('https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (fallbackResponse.status === 200) {
          logSync("eBay token check: Token is valid for Taxonomy API, but may have limited access");
          return {
            valid: true,
            scopes: ['commerce.taxonomy.readonly'],
            error: "Token has limited permissions but may work for basic operations"
          };
        }
      } catch (fallbackError) {
        // Fallback also failed, continue with original error handling
      }
      
      if (apiError.response) {
        // Authentication error
        if (apiError.response.status === 401) {
          logSync("eBay token check: Token is invalid or expired");
          return {
            valid: false,
            expired: true,
            error: "Token is invalid or expired"
          };
        }
        
        // Permission error
        if (apiError.response.status === 403) {
          // Still mark as valid but with a warning - we might be able to use other API endpoints
          logSync("eBay token check: Token has limited permissions, but we'll try to work with it");
          return {
            valid: true, // Changed to true so we can still attempt operations
            error: "Token has limited permissions, some features may be restricted",
            scopes: []
          };
        }
        
        logSync(`eBay token check error: ${apiError.response.status} - ${apiError.response.data?.error || 'Unknown error'}`);
        return {
          valid: false,
          error: apiError.response.data?.error || `API error: ${apiError.response.status}`
        };
      }
      
      logSync(`eBay token check error: ${apiError.message || 'Unknown error'}`);
      return {
        valid: false,
        error: apiError.message || "Unknown API error"
      };
    }
  } catch (error: any) {
    logSync(`eBay token validation error: ${error.message}`);
    return {
      valid: false,
      error: error.message || "Error during token validation"
    };
  }
}

/**
 * Express API endpoint handler to check eBay token status
 */
export async function getEbayTokenStatus(req: Request, res: Response) {
  try {
    const tokenInfo = await checkEbayTokenStatus();
    res.json(tokenInfo);
  } catch (error: any) {
    res.status(500).json({
      valid: false,
      error: error.message || "Server error checking token status"
    });
  }
}

/**
 * Middleware to check if eBay token exists
 * Adds useful headers for debugging token issues
 */
export function requireEbayToken(req: Request, res: Response, next: NextFunction) {
  const token = process.env.EBAY_TOKEN;
  
  // Add diagnostic headers
  res.setHeader('X-eBay-Token-Present', token ? 'true' : 'false');
  
  if (!token) {
    return res.status(400).json({
      message: "eBay API token is required",
      missingCredentials: true
    });
  }
  
  next();
}