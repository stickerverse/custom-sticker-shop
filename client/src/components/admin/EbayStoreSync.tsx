import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  FileDown,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Store,
  ExternalLink,
  FileCheck,
  ListFilter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Step interface for the workflow
interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "in-progress" | "completed";
}

const EbayStoreSync: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [logs, setLogs] = useState<string>("");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [isCheckingProducts, setIsCheckingProducts] = useState(false);
  const [ebayApiStatus, setEbayApiStatus] = useState<'connected' | 'error' | 'missing'>('connected');

  // Workflow steps
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 1,
      title: "Connect to eBay",
      description: "Connect to your eBay store account",
      icon: <Store className="h-5 w-5" />,
      status: "completed" // Assume connected if using the tool
    },
    {
      id: 2,
      title: "Select Products",
      description: "Choose which products to import",
      icon: <ListFilter className="h-5 w-5" />,
      status: "pending"
    },
    {
      id: 3,
      title: "Import & Customize",
      description: "Import products and set up customization options",
      icon: <FileCheck className="h-5 w-5" />,
      status: "pending"
    }
  ]);

  // Function to check if eBay token is properly configured
  const checkEbayToken = async () => {
    try {
      const response = await apiRequest("GET", "/api/ebay/token-status", undefined);
      const data = await response.json();
      
      if (data.valid) {
        setEbayApiStatus('connected');
      } else if (data.missing) {
        setEbayApiStatus('missing');
      } else {
        setEbayApiStatus('error');
      }
    } catch (error) {
      console.error("Error checking eBay token status:", error);
      // Default to error state if we can't check the token status
      setEbayApiStatus('error');
    }
  };

  // Check token and available products on component mount
  useEffect(() => {
    // First check token status, then check for products
    checkEbayToken().then(() => {
      checkAvailableProducts();
    });
  }, []);

  // Check how many products are available
  const checkAvailableProducts = async () => {
    setIsCheckingProducts(true);
    
    try {
      const response = await apiRequest("GET", "/api/ebay/products", undefined);
      
      // Check for authentication errors
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        
        if (errorData.missingCredentials) {
          toast({
            title: 'eBay API Configuration Required',
            description: 'Please provide your eBay API token with correct permissions in the environment settings.',
            variant: 'destructive',
            duration: 6000,
          });
          setEbayApiStatus('missing');
          setProductCount(0);
          setIsCheckingProducts(false);
          return;
        }
        
        if (response.status === 403) {
          toast({
            title: 'eBay API Permission Error',
            description: 'Your eBay API token lacks required permissions. Please update with appropriate scopes including Listing Management.',
            variant: 'destructive',
            duration: 6000,
          });
          setEbayApiStatus('error');
          setProductCount(0);
          setIsCheckingProducts(false);
          return;
        }
      }
      
      const data = await response.json();
      
      // If we got here with a successful response, the API is connected
      setEbayApiStatus('connected');
      
      if (data.products && Array.isArray(data.products)) {
        setProductCount(data.products.length);
      } else {
        setProductCount(0);
      }
    } catch (error) {
      console.error("Error checking products:", error);
      
      // Check if this is an authentication error
      if (error instanceof Error && error.message && error.message.includes('403')) {
        toast({
          title: 'eBay API Permission Error',
          description: 'Your eBay API token lacks required permissions. Please update with appropriate scopes.',
          variant: 'destructive',
          duration: 6000,
        });
        setEbayApiStatus('error');
      } else if (error instanceof Error && error.message && error.message.includes('401')) {
        setEbayApiStatus('missing');
      } else {
        // For other errors, the API might still be connected but something else went wrong
        setEbayApiStatus('error');
      }
      
      setProductCount(0);
    } finally {
      setIsCheckingProducts(false);
    }
  };

  // Import products from eBay - redirects to selection page
  const handleImportProducts = () => {
    // Update workflow step status
    const updatedSteps = [...workflowSteps];
    updatedSteps[1].status = "in-progress"; // Set select products as in progress
    setWorkflowSteps(updatedSteps);
    
    setLocation("/ebay-selection");
  };

  // Sync products from eBay and save to files
  const handleSyncProducts = async () => {
    setIsSyncing(true);

    try {
      const response = await apiRequest("POST", "/api/ebay/sync", {});
      
      // Check for authentication errors
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        
        if (errorData.missingCredentials) {
          toast({
            title: 'eBay API Configuration Required',
            description: 'Please provide your eBay API token with appropriate permissions in the environment settings.',
            variant: 'destructive',
            duration: 6000,
          });
          setEbayApiStatus('missing');
          setIsSyncing(false);
          return;
        }
        
        if (response.status === 403) {
          toast({
            title: 'eBay API Permission Error',
            description: 'Your eBay API token lacks required permissions for syncing products. Please ensure your token has Listing Management and Account Management scopes.',
            variant: 'destructive',
            duration: 8000,
          });
          setEbayApiStatus('error');
          setIsSyncing(false);
          return;
        }
      }

      const data = await response.json();
      setLastSyncResult(data);

      toast({
        title: "Sync Successful",
        description: `Synced ${data.productsImported} products from eBay`,
        variant: "default",
      });

      // Load logs after successful sync
      fetchLogs();
      
      // Update product count
      checkAvailableProducts();
    } catch (error) {
      console.error("Error syncing products:", error);
      
      // Check if this is an authentication error
      if (error instanceof Error && error.message && error.message.includes('403')) {
        toast({
          title: 'eBay API Permission Error',
          description: 'Your eBay API token lacks required permissions. Please update with appropriate scopes including Listing Management.',
          variant: 'destructive',
          duration: 6000,
        });
        setEbayApiStatus('error');
      } else if (error instanceof Error && error.message && error.message.includes('401')) {
        toast({
          title: 'eBay API Authentication Failed',
          description: 'Your eBay API token is invalid or expired. Please provide a valid token.',
          variant: 'destructive',
          duration: 6000,
        });
        setEbayApiStatus('missing');
      } else {
        toast({
          title: "Sync Failed",
          description:
            "Could not sync products from eBay. Please check your credentials and API permissions, then try again.",
          variant: "destructive",
        });
        // For other errors, we don't change the API status as the issue might be temporary
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Download products as JSON
  const handleDownloadJson = () => {
    window.open("/api/ebay/export/json", "_blank");
  };

  // Download products as CSV
  const handleDownloadCsv = () => {
    window.open("/api/ebay/export/csv", "_blank");
  };

  // Fetch sync logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);

    try {
      const response = await apiRequest(
        "GET",
        "/api/ebay/sync-logs",
        undefined,
      );

      const data = await response.json();
      setLogs(data.logs || "No logs available");
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs("Error loading logs");
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
            <CardTitle className="flex items-center">
              <Store className="mr-2 h-5 w-5" />
              eBay Store Integration
            </CardTitle>
            <CardDescription>
              Import and manage products from your eBay store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">eBay Connection Status: </span>
                {ebayApiStatus === 'connected' && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50">
                    Connected
                  </Badge>
                )}
                {ebayApiStatus === 'error' && (
                  <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
                    Permission Error
                  </Badge>
                )}
                {ebayApiStatus === 'missing' && (
                  <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 hover:bg-red-50">
                    Configuration Required
                  </Badge>
                )}
              </div>
              <div>
                <Badge variant="secondary" className="flex items-center">
                  <Store className="mr-1 h-3.5 w-3.5" />
                  {isCheckingProducts ? (
                    <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                  ) : (
                    <span>{productCount !== null ? `${productCount} products available` : 'Unknown'}</span>
                  )}
                </Badge>
              </div>
            </div>

            {/* Workflow steps */}
            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-4">Import Workflow</h3>
              <div className="space-y-6">
                {workflowSteps.map((step, index) => (
                  <div key={step.id}>
                    <div className="flex items-start">
                      <div className={`rounded-full p-2 mr-4 ${
                        step.status === 'completed' 
                          ? 'bg-green-50 text-green-600' 
                          : step.status === 'in-progress'
                            ? 'bg-blue-50 text-blue-600 animate-pulse'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium">{step.title}</h4>
                          {step.status === 'completed' && (
                            <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
                          )}
                          {step.status === 'in-progress' && (
                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">In Progress</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className="ml-6 mt-2 mb-2 border-l h-6 border-dashed"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Import Selected Products</CardTitle>
                    <CardDescription>
                      Choose which eBay products to import as customizable stickers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      You'll be able to select specific products and customize how they're imported
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleImportProducts} 
                      className="w-full"
                      disabled={productCount === 0}
                    >
                      <ListFilter className="mr-2 h-4 w-4" />
                      Browse & Select Products
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sync & Export</CardTitle>
                    <CardDescription>
                      Update and export your eBay product data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      Refresh your product data and save it in various formats for backup
                    </p>
                  </CardContent>
                  <CardFooter>
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
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync eBay Data
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {lastSyncResult && (
              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Sync Completed</AlertTitle>
                <AlertDescription>
                  Successfully synced {lastSyncResult.productsImported}{" "}
                  products. Files saved to:
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
            <CardTitle className="flex items-center">
              <FileDown className="mr-2 h-5 w-5" />
              Export eBay Data
            </CardTitle>
            <CardDescription>
              Download your eBay product data in various formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="text-lg">JSON Export</span>
                    <Badge variant="outline" className="ml-2">Full Data</Badge>
                  </CardTitle>
                  <CardDescription>
                    Complete product data in JSON format including all attributes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm list-disc pl-5 text-muted-foreground">
                    <li>Complete product details</li>
                    <li>Image URLs and descriptions</li>
                    <li>Price and inventory data</li>
                    <li>Perfect for integrations</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleDownloadJson} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="text-lg">CSV Export</span>
                    <Badge variant="outline" className="ml-2">Spreadsheet Ready</Badge>
                  </CardTitle>
                  <CardDescription>
                    Formatted data ready for Excel or Google Sheets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm list-disc pl-5 text-muted-foreground">
                    <li>Organized in columns and rows</li>
                    <li>Basic product information</li>
                    <li>Import directly into spreadsheets</li>
                    <li>Great for inventory analysis</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleDownloadCsv}
                    variant="outline"
                    className="w-full"
                  >
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
                Exported files include product IDs, titles, prices, quantities,
                and image URLs. Use these files to integrate with other systems
                or for backup purposes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileCheck className="mr-2 h-5 w-5" />
              eBay Sync Logs
            </CardTitle>
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
              {logs || "No logs available. Sync products to generate logs."}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default EbayStoreSync;
