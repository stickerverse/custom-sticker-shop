import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/use-chat";
import { formatDistanceToNow } from "date-fns";

interface ConversationProps {
  id: number;
  orderId: number;
  product: any;
  lastMessage: any;
  order: any;
  createdAt: Date;
  isSelected: boolean;
}

const ConversationItem = ({ 
  id, 
  orderId, 
  product, 
  lastMessage, 
  order,
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
  
  const isActive = lastMessage?.userId !== order?.userId;
  
  return (
    <div 
      className={`border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-gray-50' : ''}`}
      onClick={handleClick}
    >
      <div className="p-3 flex items-start">
        <div className="relative">
          <Avatar>
            <AvatarImage src={product?.imageUrl} alt={product?.title} />
            <AvatarFallback>{product?.title?.charAt(0) || "S"}</AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 ${isActive ? 'bg-success' : 'bg-gray-400'} w-3 h-3 rounded-full border-2 border-white`}></span>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm truncate">{order?.userId ? "Customer" : "Admin"}</h3>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {lastMessage?.content || "No messages yet"}
          </p>
          <div className="mt-1 flex items-center">
            <Badge variant="outline" className="text-xs font-medium text-primary px-2 py-0.5 bg-primary bg-opacity-10 rounded-full">
              Order #{orderId}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [location] = useLocation();
  const { conversations, loadingConversations } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredConversations = conversations.filter(conv => {
    const orderNumber = `Order #${conv.orderId}`;
    const productTitle = conv.product?.title || "";
    const lastMessageContent = conv.lastMessage?.content || "";
    
    const searchTerms = [orderNumber, productTitle, lastMessageContent].join(" ").toLowerCase();
    return searchQuery === "" || searchTerms.includes(searchQuery.toLowerCase());
  });
  
  // Extract the selected conversation ID from the URL
  const selectedId = location.startsWith('/chat/') 
    ? parseInt(location.split('/chat/')[1]) 
    : null;
  
  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Messages</h2>
          <Link href="/shop">
            <Button variant="ghost" size="sm">
              <span className="material-icons text-sm mr-1">arrow_back</span>
              Shop
            </Button>
          </Link>
        </div>
        <div className="mt-2 relative">
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

      <ScrollArea className="h-[calc(100vh-105px)]">
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
              createdAt={conversation.createdAt}
              isSelected={selectedId === conversation.id}
            />
          ))
        )}
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
