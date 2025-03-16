import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useChat } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ConversationProps {
  id: number;
  orderId?: number;
  product?: any;
  lastMessage?: any;
  order?: any;
  user?: any;
  subject?: string;
  isDirectChat?: boolean;
  createdAt: Date;
  isSelected: boolean;
}

const ConversationItem = ({ 
  id, 
  orderId, 
  product, 
  lastMessage, 
  order,
  user,
  subject,
  isDirectChat,
  createdAt,
  isSelected 
}: ConversationProps) => {
  const [, setLocation] = useLocation();
  
  let timeAgo = "Just now";
  if (lastMessage && lastMessage.createdAt) {
    timeAgo = formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false });
  }
  
  const handleClick = () => {
    setLocation(`/chat/${id}`);
  };
  
  // Determine active status based on conversation type
  let isActive = false;
  if (isDirectChat) {
    isActive = !!lastMessage && lastMessage.userId !== user?.id;
  } else {
    isActive = !!lastMessage && lastMessage.userId !== order?.userId;
  }
  
  // Determine avatar and title based on conversation type
  let avatarSrc = '';
  let avatarFallback = 'S';
  let title = '';
  
  if (isDirectChat) {
    avatarSrc = '';
    avatarFallback = subject?.charAt(0) || 'D';
    title = subject || 'Direct Message';
  } else {
    avatarSrc = product?.imageUrl || '';
    avatarFallback = product?.title?.charAt(0) || 'S';
    title = order?.userId ? "Order Discussion" : "Admin";
  }
  
  return (
    <div 
      className={`border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-gray-50' : ''}`}
      onClick={handleClick}
    >
      <div className="p-3 flex items-start">
        <div className="relative">
          <Avatar>
            <AvatarImage src={avatarSrc} alt={title} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 ${isActive ? 'bg-success' : 'bg-gray-400'} w-3 h-3 rounded-full border-2 border-white`}></span>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm truncate">{title}</h3>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {lastMessage?.content || "No messages yet"}
          </p>
          <div className="mt-1 flex items-center">
            {isDirectChat ? (
              <Badge variant="outline" className="text-xs font-medium text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">
                Direct Chat
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-medium text-primary px-2 py-0.5 bg-primary bg-opacity-10 rounded-full">
                Order #{orderId}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [location, setLocation] = useLocation();
  const { conversations, loadingConversations, createNewConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState("");
  
  const filteredConversations = conversations.filter(conv => {
    // Build search terms based on conversation type
    const searchTerms = [];
    
    if (conv.isDirectChat) {
      // For direct chats, search by subject and message content
      searchTerms.push(conv.subject || "");
      searchTerms.push("Direct Chat");
      if (conv.lastMessage) {
        searchTerms.push(conv.lastMessage.content || "");
      }
    } else {
      // For order-related chats, search by order number, product, and messages
      searchTerms.push(`Order #${conv.orderId}`);
      searchTerms.push(conv.product?.title || "");
      if (conv.lastMessage) {
        searchTerms.push(conv.lastMessage.content || "");
      }
    }
    
    const searchTermsText = searchTerms.join(" ").toLowerCase();
    return searchQuery === "" || searchTermsText.includes(searchQuery.toLowerCase());
  });
  
  // Extract the selected conversation ID from the URL
  const selectedId = location.startsWith('/chat/') 
    ? parseInt(location.split('/chat/')[1]) 
    : null;
  
  const { toast } = useToast();
  const { isCreatingConversation } = useChat();
  
  return (
    <>
      <aside className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto h-screen">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Messages</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNewChatDialog(true)}
              className="bg-white hover:bg-gray-50"
            >
              <span className="material-icons text-sm mr-1">add</span>
              New Chat
            </Button>
          </div>
          <div className="flex justify-start mb-3">
            <Link href="/shop">
              <Button variant="ghost" size="sm">
                <span className="material-icons text-sm mr-1">arrow_back</span>
                Shop
              </Button>
            </Link>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-3 top-2.5 text-gray-400 material-icons text-sm">search</span>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-185px)]">
          {loadingConversations ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No conversations match your search" : "No conversations yet"}
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                id={conversation.id}
                orderId={conversation.orderId}
                product={conversation.product}
                lastMessage={conversation.lastMessage}
                order={conversation.order}
                user={conversation.user}
                subject={conversation.subject}
                isDirectChat={conversation.isDirectChat}
                createdAt={conversation.createdAt}
                isSelected={selectedId === conversation.id}
              />
            ))
          )}
        </ScrollArea>
      </aside>
      
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
                  const newConversationId = await createNewConversation(newChatSubject);
                  setNewChatSubject('');
                  setShowNewChatDialog(false);
                  setLocation(`/chat/${newConversationId}`);
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
    </>
  );
};

export default Sidebar;
