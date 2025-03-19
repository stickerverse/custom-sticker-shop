import { NextApiRequest, NextApiResponse } from 'next';
import { getEbayProductsApi } from '../../../../server/ebay/ebay-selection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return getEbayProductsApi(req, res);
}