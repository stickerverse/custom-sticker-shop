import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: {
    id: number;
    content: string;
    userId: number;
    messageType: string;
    imageUrl?: string;
    createdAt: Date;
  };
  isOwnMessage: boolean;
  product: any;
}

const MessageBubble = ({ message, isOwnMessage, product }: MessageBubbleProps) => {
  const formattedTime = format(new Date(message.createdAt), "h:mm a");
  
  if (isOwnMessage) {
    return (
      <div className="flex mb-4 justify-end">
        <div className="flex flex-col items-end max-w-[75%]">
          {message.messageType === "text" ? (
            <div className="bg-secondary text-white p-3 rounded-[8px] shadow-sm">
              <p className="text-sm">{message.content}</p>
            </div>
          ) : (
            <div className="bg-secondary text-white p-2 rounded-[8px] shadow-sm">
              <img 
                src={message.imageUrl} 
                alt="Shared image" 
                className="w-full h-auto rounded-[8px] mb-1"
              />
              {message.content && <p className="text-sm mt-1">{message.content}</p>}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-1">{formattedTime}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex mb-4">
      <div className="flex-shrink-0 mr-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={product?.imageUrl} alt="Sender" />
          <AvatarFallback>{product?.title?.charAt(0) || "S"}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col max-w-[75%]">
        {message.messageType === "text" ? (
          <div className="bg-white p-3 rounded-[8px] shadow-sm">
            <p className="text-sm">{message.content}</p>
          </div>
        ) : (
          <div className="bg-white p-2 rounded-[8px] shadow-sm">
            <img 
              src={message.imageUrl} 
              alt="Shared image" 
              className="w-full h-auto rounded-[8px] mb-1" 
            />
            {message.content && <p className="text-sm mt-1">{message.content}</p>}
            <p className="text-xs text-gray-500">{message.imageUrl?.split("/").pop()}</p>
          </div>
        )}
        <span className="text-xs text-gray-500 mt-1">{formattedTime}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
