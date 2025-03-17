import { useState, useEffect, createContext, useContext } from "react";

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  reconnect: () => void;
  sendMessage: (type: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  reconnect: () => {},
  sendMessage: () => {},
});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Function to send a message through the WebSocket
  const sendMessage = (type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    } else {
      console.error("Cannot send message, WebSocket is not connected");
    }
  };

  // Function to authenticate with the WebSocket server
  const authenticate = () => {
    // Get the user ID from session storage or local storage
    const userDataStr = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData && userData.id) {
          sendMessage('authenticate', { userId: userData.id });
          setAuthenticated(true);
          console.log("WebSocket authenticated for user:", userData.id);
        }
      } catch (e) {
        console.error("Failed to parse user data for WebSocket authentication:", e);
      }
    } else {
      console.log("No user data found for WebSocket authentication");
    }
  };

  const createWebSocketConnection = () => {
    // Close existing socket if any
    if (socket) {
      socket.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log("Connecting to WebSocket server at:", wsUrl);
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connection established");
      setConnected(true);
      
      // Authenticate after connection is established
      setTimeout(authenticate, 500);
    };
    
    newSocket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      setConnected(false);
      setAuthenticated(false);
      
      // Auto-reconnect after a delay if not intentionally closed
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          createWebSocketConnection();
        }, 5000);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };
    
    // Handle incoming messages
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);
        
        // Handle different message types
        if (message.type === 'error') {
          console.error("WebSocket server error:", message.data.message);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };
    
    setSocket(newSocket);
    return newSocket;
  };

  const reconnect = () => {
    console.log("Manual reconnection requested");
    createWebSocketConnection();
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = createWebSocketConnection();
    
    // Cleanup function
    return () => {
      console.log("Closing WebSocket connection due to component unmount");
      newSocket.close(1000, "Component unmounted");
    };
  }, []);

  // Reconnect on page visibility change (tab becomes active again)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && (!socket || socket.readyState !== WebSocket.OPEN)) {
        console.log("Page became visible, reconnecting WebSocket");
        reconnect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket]);

  // Listen for auth changes
  useEffect(() => {
    const checkAndAuthenticate = () => {
      if (connected && !authenticated) {
        authenticate();
      }
    };

    // Try to authenticate when connection is established
    checkAndAuthenticate();

    // Setup storage event listener to detect login/logout
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData') {
        checkAndAuthenticate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [connected, authenticated]);

  return (
    <WebSocketContext.Provider value={{ socket, connected, reconnect, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
