import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/lib/socket";

// Types
type Message = {
  id: number;
  conversationId: number;
  userId: number;
  messageType: "text" | "image";
  content: string;
  imageUrl?: string;
  createdAt: Date;
  read: boolean;
};

type Conversation = {
  id: number;
  orderId?: number;
  userId: number;
  createdAt: Date;
  subject: string;
  isDirectChat?: boolean;
  order?: any;
  product?: any;
  orderItems?: any[];
  lastMessage?: Message;
  messages?: Message[];
};

interface SendMessageParams {
  conversationId: number;
  content: string;
  messageType?: "text" | "image";
  imageUrl?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loadingConversations: boolean;
  loadingConversation: boolean;
  isMessageSending: boolean;
  isCreatingConversation: boolean;
  unreadCount: number;
  loadConversations: () => Promise<void>;
  loadConversation: (id: number) => Promise<void>;
  sendMessage: (params: SendMessageParams) => Promise<void>;
  createNewConversation: (subject: string) => Promise<number>;
  activateConversation: (id: number) => void;
}

// Create context
const ChatContext = createContext<ChatContextType>({
  conversations: [],
  activeConversation: null,
  loadingConversations: false,
  loadingConversation: false,
  isMessageSending: false,
  isCreatingConversation: false,
  unreadCount: 0,
  loadConversations: async () => {},
  loadConversation: async () => {},
  sendMessage: async () => {},
  createNewConversation: async () => 0,
  activateConversation: () => {},
});

// Provider component
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { socket, connected } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingConversations(true);
      const response = await fetch("/api/conversations", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // Calculate unread messages
        const unread = data.reduce((count: number, conv: Conversation) => {
          if (conv.lastMessage && !conv.lastMessage.read && conv.lastMessage.userId !== user?.id) {
            return count + 1;
          }
          return count;
        }, 0);
        
        setUnreadCount(unread);
      } else {
        throw new Error("Could not fetch conversations");
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Could not load your conversations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated, user?.id, toast]);

  // Load a specific conversation with caching to prevent redundant API calls
  const loadConversation = useCallback(async (id: number) => {
    // Skip if not authenticated
    if (!isAuthenticated) return;
    
    // Skip if we're already loading a conversation
    if (loadingConversation) return;
    
    // Skip if the conversation we want is already active
    if (activeConversation && activeConversation.id === id) return;
    
    try {
      setLoadingConversation(true);
      const response = await fetch(`/api/conversations/${id}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveConversation(data);
      } else {
        throw new Error("Could not fetch conversation");
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "Could not load the conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingConversation(false);
    }
  }, [isAuthenticated, loadingConversation, activeConversation, toast]);

  // Send a message
  const sendMessage = async ({ conversationId, content, messageType = "text", imageUrl }: SendMessageParams) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Not Authenticated",
        description: "You need to be logged in to send messages.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsMessageSending(true);
      
      const message = {
        conversationId,
        userId: user.id,
        messageType,
        content,
        imageUrl,
      };
      
      // Send via API
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, message);
      const newMessage = await response.json();
      
      // Update active conversation with the new message
      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation(prev => {
          if (!prev) return null;
          
          const messages = [...(prev.messages || []), newMessage];
          return {
            ...prev,
            lastMessage: newMessage,
            messages,
          };
        });
      }
      
      // Update conversations list with the new message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessage: newMessage } 
            : conv
        )
      );
      
      return newMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    } finally {
      setIsMessageSending(false);
    }
  };
  
  // Create a new conversation with protection against double-submission
  const createNewConversation = async (subject: string): Promise<number> => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Not Authenticated",
        description: "You need to be logged in to create a conversation.",
        variant: "destructive",
      });
      throw new Error("Not authenticated");
    }
    
    // Safety check to prevent multiple simultaneous calls
    if (isCreatingConversation) {
      console.warn("Creation already in progress, ignoring duplicate request");
      throw new Error("Creation already in progress");
    }
    
    try {
      setIsCreatingConversation(true);
      
      console.log("Creating new conversation with subject:", subject);
      const response = await apiRequest("POST", "/api/conversations", { subject });
      
      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }
      
      const newConversation = await response.json();
      console.log("Successfully created conversation:", newConversation);
      
      // Add the new conversation to the list
      setConversations(prev => [newConversation, ...prev]);
      
      // Return the new conversation ID
      return newConversation.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create a new conversation. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      // Make sure we always reset the creating state
      setIsCreatingConversation(false);
    }
  };
  
  // Set active conversation ID
  const activateConversation = (id: number) => {
    // Only set the ID, don't trigger loadConversation
    // This avoids an infinite loop between activateConversation and loadConversation
    setActiveConversationId((prevId) => {
      if (prevId !== id) {
        return id;  // Only update if the ID has changed
      }
      return prevId;
    });
  };
  
  // Initial load of conversations
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);
  
  // Load active conversation when ID changes
  useEffect(() => {
    if (activeConversationId) {
      // We need to remove loadConversation from the dependency array
      // but still need to call it. We'll use a function that just captures the current value.
      const loadCurrentConversation = () => {
        loadConversation(activeConversationId);
      };
      loadCurrentConversation();
    }
  }, [activeConversationId]); // Only depend on activeConversationId

  // WebSocket event handling
  useEffect(() => {
    if (!socket || !connected || !user) return;
    
    // Authenticate with the WebSocket server
    const authMessage = {
      type: 'authenticate',
      data: { userId: user.id }
    };
    socket.send(JSON.stringify(authMessage));
    
    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'new_message') {
          const newMessage = message.data;
          
          // Update active conversation if it's the one receiving the message
          if (activeConversation && activeConversation.id === newMessage.conversationId) {
            setActiveConversation(prev => {
              if (!prev) return null;
              
              const messages = [...(prev.messages || []), newMessage];
              return {
                ...prev,
                lastMessage: newMessage,
                messages,
              };
            });
          }
          
          // Update conversations list
          setConversations(prev => 
            prev.map(conv => 
              conv.id === newMessage.conversationId 
                ? { ...conv, lastMessage: newMessage } 
                : conv
            )
          );
          
          // Increment unread count if message is from someone else
          if (newMessage.userId !== user.id) {
            setUnreadCount(prev => prev + 1);
          }
          
          // Show toast notification for new messages
          if (newMessage.userId !== user.id && (!activeConversation || activeConversation.id !== newMessage.conversationId)) {
            toast({
              title: "New Message",
              description: newMessage.content.length > 50 
                ? `${newMessage.content.substring(0, 50)}...` 
                : newMessage.content,
            });
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    socket.addEventListener("message", handleMessage);
    
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, connected, user, activeConversation, toast]);

  return (
    <ChatContext.Provider 
      value={{
        conversations,
        activeConversation,
        loadingConversations,
        loadingConversation,
        isMessageSending,
        isCreatingConversation,
        unreadCount,
        loadConversations,
        loadConversation,
        sendMessage,
        createNewConversation,
        activateConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
