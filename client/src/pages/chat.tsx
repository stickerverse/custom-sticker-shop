import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import OrderDetails from "@/components/order/OrderDetails";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { 
    loadConversation, 
    activeConversation, 
    activateConversation, 
    conversations 
  } = useChat();
  
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const conversationId = id ? parseInt(id) : null;
  
  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      activateConversation(conversationId);
    }
  }, [conversationId, loadConversation, activateConversation]);
  
  // For mobile view, automatically show sidebar when no conversation is selected
  useEffect(() => {
    if (!conversationId && window.innerWidth < 768) {
      // If on mobile and no conversation selected, make sure sidebar is visible
      setShowOrderDetails(false);
    }
  }, [conversationId]);
  
  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <span className="material-icons text-primary text-5xl mb-4">lock</span>
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-gray-600 mb-6">
            Please login to access your messages and chat with sellers.
          </p>
          <Button className="bg-primary text-white hover:bg-primary/90 w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for conversations list */}
      <Sidebar />
      
      {/* Main Chat Interface or Empty State */}
      {conversationId ? (
        <>
          <ChatInterface conversationId={conversationId} />
          
          {/* Order Details Sidebar - visible on larger screens or when toggled on mobile */}
          {(showOrderDetails || window.innerWidth >= 1024) && activeConversation?.order && (
            <OrderDetails 
              orderId={activeConversation.order.id} 
              onClose={() => setShowOrderDetails(false)}
            />
          )}
          
          {/* Mobile Toggle for Order Details */}
          {window.innerWidth < 1024 && !showOrderDetails && (
            <button 
              className="md:hidden fixed bottom-20 right-4 z-50 rounded-full bg-primary text-white p-3 shadow-lg"
              onClick={() => setShowOrderDetails(true)}
            >
              <span className="material-icons">receipt</span>
            </button>
          )}
        </>
      ) : (
        <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
          <div className="text-center max-w-md">
            <span className="material-icons text-gray-300 text-6xl mb-4">chat</span>
            <h2 className="text-2xl font-bold mb-2">No Conversation Selected</h2>
            <p className="text-gray-600 mb-4">
              Select a conversation from the sidebar or start a new one from your orders.
            </p>
            {conversations.length === 0 && (
              <Button className="bg-primary text-white hover:bg-primary/90">
                Browse Products
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
