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
      <div className="flex mb-6 justify-end">
        <div className="flex flex-col items-end max-w-[75%]">
          {message.messageType === "text" ? (
            <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          ) : (
            <div className="bg-blue-500 text-white p-2 rounded-2xl rounded-tr-sm shadow-sm">
              <img 
                src={message.imageUrl} 
                alt="Shared image" 
                className="w-full h-auto rounded-xl mb-1"
              />
              {message.content && <p className="text-sm mt-1 leading-relaxed">{message.content}</p>}
            </div>
          )}
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500">{formattedTime}</span>
            <div className="ml-1 text-xs text-green-500">✓✓</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex mb-6">
      <div className="flex-shrink-0 mr-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={product?.imageUrl} alt="Sender" />
          <AvatarFallback>{product?.title?.charAt(0) || "S"}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col max-w-[75%]">
        {message.messageType === "text" ? (
          <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">{message.content}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-2 rounded-2xl rounded-tl-sm shadow-sm">
            <img 
              src={message.imageUrl} 
              alt="Shared image" 
              className="w-full h-auto rounded-xl mb-1" 
            />
            {message.content && <p className="text-sm mt-1 text-gray-800 leading-relaxed">{message.content}</p>}
            <p className="text-xs text-gray-500">{message.imageUrl?.split("/").pop()}</p>
          </div>
        )}
        <span className="text-xs text-gray-500 mt-1">{formattedTime}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
