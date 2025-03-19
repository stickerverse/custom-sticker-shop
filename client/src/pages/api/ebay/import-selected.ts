import { NextApiRequest, NextApiResponse } from 'next';
import { importSelectedEbayProducts } from '../../../server/ebay/ebay-selection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return importSelectedEbayProducts(req, res);
}