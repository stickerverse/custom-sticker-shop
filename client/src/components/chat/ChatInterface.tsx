import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRelative } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import MessageBubble from "./MessageBubble";

interface ChatInterfaceProps {
  conversationId: number;
}

const ChatInterface = ({ conversationId }: ChatInterfaceProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    activeConversation, 
    loadingConversation, 
    sendMessage, 
    isMessageSending,
    createNewConversation,
    isCreatingConversation
  } = useChat();
  
  const [messageText, setMessageText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState("");
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the latest message
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages]);
  
  // Group messages by date
  const groupMessagesByDate = () => {
    if (!activeConversation?.messages) return [];
    
    const grouped: { [key: string]: any[] } = {};
    
    activeConversation.messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return Object.entries(grouped).map(([date, messages]) => ({
      date,
      messages
    }));
  };
  
  const groupedMessages = groupMessagesByDate();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!messageText.trim() && !image) || !user) return;
    
    try {
      // First handle image if present
      let imageUrl = null;
      if (image) {
        // For this demo, we'll just use a placeholder URL
        // In a real app, you would upload the image to a server
        imageUrl = imagePreview;
      }
      
      await sendMessage({
        conversationId,
        content: messageText.trim(),
        messageType: image ? "image" : "text",
        imageUrl
      });
      
      setMessageText("");
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };
  
  if (loadingConversation) {
    return (
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <div className="md:hidden mr-2">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/chat")}>
                <span className="material-icons">menu</span>
              </Button>
            </div>
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 bg-gray-50">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex mb-4">
              <Skeleton className="h-8 w-8 rounded-full mr-3" />
              <div>
                <Skeleton className="h-16 w-64 rounded-md" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t border-gray-200 bg-white">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }
  
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8">
          <span className="material-icons text-6xl text-gray-300">chat</span>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">No Conversation Selected</h2>
          <p className="mt-2 text-gray-500">Select a conversation from the sidebar or start a new one from your orders.</p>
          <Button className="mt-4" onClick={() => setLocation("/shop")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }
  
  const { order, product } = activeConversation;
  
  return (
    <div className="flex-1 flex flex-col h-screen md:border-r border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center">
          <div className="md:hidden mr-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/chat")}>
              <span className="material-icons">menu</span>
            </Button>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarImage src={product?.imageUrl} alt={product?.title} />
                <AvatarFallback className="bg-blue-50 text-blue-600">{product?.title?.charAt(0) || "S"}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></span>
            </div>
            <div className="ml-3">
              <h2 className="font-semibold text-gray-800">
                {activeConversation.isDirectChat 
                  ? activeConversation.subject 
                  : user?.isAdmin ? "Customer" : "Seller"}
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                {activeConversation.isDirectChat ? (
                  <span>Online now</span>
                ) : (
                  <>
                    <span className="material-icons text-xs mr-1">shopping_bag</span>
                    <span>Order #{order?.id} - {product?.title}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowNewChatDialog(true)}
            className="hidden md:flex bg-white hover:bg-gray-50 border-gray-200"
          >
            <span className="material-icons text-sm mr-1">add</span>
            New Chat
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100">
            <span className="material-icons text-lg">more_vert</span>
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        {groupedMessages.map(group => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex justify-center my-4">
              <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                {formatRelative(new Date(group.date), new Date()).split('at')[0].trim()}
              </span>
            </div>
            
            {group.messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.userId === user?.id}
                product={product}
              />
            ))}
          </div>
        ))}
        
        {/* Order Details Card */}
        <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 mb-4">
          <div className="flex items-center text-sm text-gray-700">
            <span className="material-icons text-primary mr-2">assignment</span>
            <span className="font-medium">Order #{order?.id} Details</span>
          </div>
          <div className="mt-2 text-sm">
            <p><span className="font-medium">Product:</span> {product?.title}</p>
            {activeConversation.orderItems?.[0]?.options && (
              <>
                <p>
                  <span className="font-medium">Size:</span> {activeConversation.orderItems[0].options.size || "Standard"}
                </p>
                <p>
                  <span className="font-medium">Quantity:</span> {activeConversation.orderItems[0].quantity || 1} pcs
                </p>
                <p>
                  <span className="font-medium">Material:</span> {activeConversation.orderItems[0].options.material || "Vinyl"}
                  {activeConversation.orderItems[0].options.finish ? `, ${activeConversation.orderItems[0].options.finish} Finish` : ""}
                </p>
                <p>
                  <span className="font-medium">Total:</span> ${((order?.total || 0) / 100).toFixed(2)}
                </p>
              </>
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <Button variant="link" className="text-secondary text-sm p-0 font-medium hover:underline">
              View Full Order
            </Button>
          </div>
        </div>
        
        {/* Empty div for scrolling to end */}
        <div ref={endOfMessagesRef} />
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100">
                <span className="material-icons text-lg">add_photo_alternate</span>
              </Button>
            </div>
            
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100">
              <span className="material-icons text-lg">emoji_emotions</span>
            </Button>
          </div>
          
          <div className="flex-1 mx-2">
            {imagePreview && (
              <div className="relative mb-2">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-32 rounded-xl"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-gray-800 bg-opacity-70 hover:bg-opacity-100 text-white"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                >
                  <span className="material-icons text-sm">close</span>
                </Button>
              </div>
            )}
            <textarea
              placeholder="Type a message..."
              className="w-full border border-gray-300 rounded-[20px] py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none text-gray-800"
              rows={1}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>
          
          <Button
            type="submit"
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600"
            disabled={(!messageText.trim() && !image) || isMessageSending}
          >
            <span className="material-icons">send</span>
          </Button>
        </form>
      </div>

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
                  // Disable multiple submissions by checking if already creating
                  if (isCreatingConversation) {
                    console.log("Creation already in progress, ignoring click");
                    return;
                  }
                  
                  // First close dialog and clear input before API call
                  // This prevents UI freezing
                  setNewChatSubject('');
                  setShowNewChatDialog(false);
                  
                  console.log("Starting conversation creation from chat interface");
                  const newConversationId = await createNewConversation(newChatSubject);
                  console.log("Successfully created conversation with ID:", newConversationId);
                  
                  // Use a longer delay to ensure all state updates are complete
                  // This prevents React state update loops
                  if (newConversationId) {
                    console.log(`Scheduling navigation to /chat/${newConversationId} after 300ms`);
                    setTimeout(() => {
                      console.log(`Navigating to /chat/${newConversationId}`);
                      setLocation(`/chat/${newConversationId}`);
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

export default ChatInterface;
