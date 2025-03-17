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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { 
    loadConversation, 
    activeConversation, 
    activateConversation, 
    conversations,
    createNewConversation,
    isCreatingConversation
  } = useChat();
  
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState('');
  const conversationId = id ? parseInt(id) : null;
  
  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      console.log(`Setting up conversation with ID: ${conversationId}`);
      
      // First activate the ID, then the loadConversation will be triggered
      // by useEffect in useChat.tsx
      activateConversation(conversationId);
    }
  }, [conversationId]);
  
  // For mobile view, automatically show sidebar when no conversation is selected
  // Using useLayoutEffect to ensure this runs before the browser paints
  // to avoid flash of incorrect UI
  useEffect(() => {
    // Store the width once to avoid window.innerWidth calls on every render
    const isMobile = window.innerWidth < 768;
    if (!conversationId && isMobile) {
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
              Select a conversation from the sidebar or start a new chat.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => setShowNewChatDialog(true)}
              >
                <span className="material-icons mr-2 text-sm">add</span>
                Start New Chat
              </Button>
              
              {conversations.length === 0 && (
                <Button variant="outline">
                  Browse Products
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start a New Conversation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                value={newChatSubject}
                onChange={(e) => setNewChatSubject(e.target.value)}
                placeholder="What would you like to discuss?"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewChatDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newChatSubject.trim()) {
                  toast({
                    title: "Subject required",
                    description: "Please enter a subject for your conversation.",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  // Prevent multiple submissions
                  if (isCreatingConversation) {
                    console.log("Creation already in progress, ignoring click");
                    return;
                  }
                  
                  // First, close the dialog and clear the input
                  // This prevents UI freezing during API call
                  setNewChatSubject('');
                  setShowNewChatDialog(false);
                  
                  console.log("Starting conversation creation process");
                  const newConversationId = await createNewConversation(newChatSubject);
                  console.log("Successfully created conversation with ID:", newConversationId);
                  
                  // Use setTimeout with a longer delay to ensure all state updates are complete
                  // This prevents React state update loops
                  if (newConversationId) {
                    console.log(`Scheduling navigation to /chat/${newConversationId} after 300ms`);
                    setTimeout(() => {
                      console.log(`Navigating to /chat/${newConversationId}`);
                      navigate(`/chat/${newConversationId}`);
                    }, 300);
                  }
                } catch (error) {
                  console.error('Error creating conversation:', error);
                  toast({
                    title: "Failed to create conversation",
                    description: error instanceof Error ? error.message : "Something went wrong",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isCreatingConversation || !newChatSubject.trim()}
            >
              {isCreatingConversation ? 'Creating...' : 'Create Conversation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
