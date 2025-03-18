import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileDown, Download, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const EbayStoreSync: React.FC = () => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [logs, setLogs] = useState<string>('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Import products from eBay
  const handleImportProducts = async () => {
    setIsImporting(true);
    
    try {
      const response = await apiRequest({
        method: 'POST',
        url: '/api/ebay/import-products',
      });
      
      const data = await response.json();
      
      toast({
        title: 'Import Successful',
        description: `Imported ${data.products.length} products from eBay`,
        variant: 'default',
      });
      
      // Load logs after successful import
      fetchLogs();
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: 'Import Failed',
        description: 'Could not import products from eBay. Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Sync products from eBay and save to files
  const handleSyncProducts = async () => {
    setIsSyncing(true);
    
    try {
      const response = await apiRequest({
        method: 'POST',
        url: '/api/ebay/sync',
      });
      
      const data = await response.json();
      setLastSyncResult(data);
      
      toast({
        title: 'Sync Successful',
        description: `Synced ${data.productsImported} products from eBay`,
        variant: 'default',
      });
      
      // Load logs after successful sync
      fetchLogs();
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not sync products from eBay. Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Download products as JSON
  const handleDownloadJson = () => {
    window.open('/api/ebay/export/json', '_blank');
  };

  // Download products as CSV
  const handleDownloadCsv = () => {
    window.open('/api/ebay/export/csv', '_blank');
  };

  // Fetch sync logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    
    try {
      const response = await apiRequest({
        method: 'GET',
        url: '/api/ebay/sync-logs',
      });
      
      const data = await response.json();
      setLogs(data.logs || 'No logs available');
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs('Error loading logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  return (
    <Tabs defaultValue="import" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="import">Import Products</TabsTrigger>
        <TabsTrigger value="export">Export Data</TabsTrigger>
        <TabsTrigger value="logs">Sync Logs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="import" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>eBay Store Migration</CardTitle>
            <CardDescription>
              Import products from your eBay store into your sticker shop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Import Products</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import your eBay product listings directly into your sticker shop inventory.
                </p>
                <Button 
                  onClick={handleImportProducts} 
                  disabled={isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Import from eBay
                    </>
                  )}
                </Button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Sync Products</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sync products and save to JSON/CSV files for backup or integration.
                </p>
                <Button 
                  onClick={handleSyncProducts} 
                  disabled={isSyncing}
                  variant="outline"
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Sync & Export
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {lastSyncResult && (
              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Sync Completed</AlertTitle>
                <AlertDescription>
                  Successfully synced {lastSyncResult.productsImported} products.
                  Files saved to:
                  <ul className="mt-2 list-disc pl-5">
                    <li>JSON: {lastSyncResult.jsonFile}</li>
                    <li>CSV: {lastSyncResult.csvFile}</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="export" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Export eBay Data</CardTitle>
            <CardDescription>
              Download your eBay product data in various formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>JSON Export</CardTitle>
                  <CardDescription>
                    Download complete product data in JSON format
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={handleDownloadJson} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>CSV Export</CardTitle>
                  <CardDescription>
                    Download product data in CSV format for Excel/Spreadsheets
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={handleDownloadCsv} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Export Information</AlertTitle>
              <AlertDescription>
                Exported files include product IDs, titles, prices, quantities, and image URLs.
                Use these files to integrate with other systems or for backup purposes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="logs" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>eBay Sync Logs</CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>View sync activity and debug information</span>
              <Button 
                onClick={fetchLogs} 
                variant="outline" 
                size="sm"
                disabled={isLoadingLogs}
              >
                {isLoadingLogs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-[400px]">
              {logs || 'No logs available. Sync products to generate logs.'}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default EbayStoreSync;