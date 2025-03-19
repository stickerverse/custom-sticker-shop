import React from "react";
import { NextPage } from "next";
import Head from "next/head";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EbayProductSelector from "@/components/ebay/EbayProductSelector";
import EbayStoreSync from "@/components/ebay/EbayStoreSync";

const EbayImportPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>eBay Import | Admin Dashboard</title>
      </Head>

      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">eBay Products Import</h1>

        <Tabs defaultValue="select">
          <TabsList className="mb-4">
            <TabsTrigger value="select">Select Products</TabsTrigger>
            <TabsTrigger value="sync">Sync & Export</TabsTrigger>
          </TabsList>

          <TabsContent value="select">
            <EbayProductSelector />
          </TabsContent>

          <TabsContent value="sync">
            <EbayStoreSync />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default EbayImportPage;
