import { useState, useEffect, createContext, useContext } from "react";

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  reconnect: () => {},
});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

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
    };
    
    newSocket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      setConnected(false);
      
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

  return (
    <WebSocketContext.Provider value={{ socket, connected, reconnect }}>
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
