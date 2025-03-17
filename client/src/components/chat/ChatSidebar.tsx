import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { formatRelative } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatSidebarProps {
  onClose?: () => void;
  expanded: boolean;
  toggleExpanded: () => void;
}

export const ChatSidebar = ({ onClose, expanded, toggleExpanded }: ChatSidebarProps) => {
  const { user } = useAuth();
  const { 
    conversations, 
    activeConversation,
    loadingConversations,
    activateConversation,
    sendMessage,
    unreadCount
  } = useChat();
  
  const [messageText, setMessageText] = useState("");
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !activeConversation || !user) return;
    
    try {
      await sendMessage({
        conversationId: activeConversation.id,
        content: messageText.trim(),
        messageType: "text"
      });
      
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  // Select conversation and focus input
  const handleSelectConversation = (conversationId: number) => {
    activateConversation(conversationId);
    if (messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  };
  
  return (
    <div className={`fixed left-0 top-0 h-screen bg-background/95 backdrop-blur-md border-r border-primary/10 transition-all duration-300 shadow-lg z-40 ${
      expanded ? "w-64" : "w-16"
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-primary/10 flex items-center justify-between">
          {expanded ? (
            <>
              <div className="flex items-center">
                <span className="material-icons text-primary">chat</span>
                <h3 className="ml-2 text-sm font-medium">Chat Support</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleExpanded}
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <span className="material-icons text-sm">chevron_left</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleExpanded}
              className="h-8 w-8 rounded-full hover:bg-primary/10 mx-auto"
            >
              <span className="material-icons text-primary relative">
                chat
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
            </Button>
          )}
        </div>
        
        {/* Conversation List */}
        {expanded && (
          <ScrollArea className="flex-1">
            <div className="p-2">
              {loadingConversations ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                conversations.map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`p-2 rounded-lg mb-1 cursor-pointer transition-colors ${
                      activeConversation?.id === conversation.id
                        ? "bg-primary/10"
                        : "hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conversation.product?.imageUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {conversation.product?.title?.charAt(0) || 
                           conversation.subject?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-medium truncate">
                            {conversation.subject || `Order #${conversation.orderId}`}
                          </p>
                          {conversation.lastMessage && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatRelative(new Date(conversation.lastMessage.createdAt), new Date()).split('at')[0].trim()}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
        
        {/* Quick Message Input */}
        {expanded && activeConversation && (
          <div className="p-2 border-t border-primary/10">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <Input
                ref={messageInputRef}
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 h-8 text-xs"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!messageText.trim()}
                className="h-8 w-8 rounded-full bg-primary"
              >
                <span className="material-icons text-[16px] text-white">send</span>
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;