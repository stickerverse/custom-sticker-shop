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
      <div className="flex mb-5 justify-end">
        <div className="flex flex-col items-end max-w-[75%]">
          {message.messageType === "text" ? (
            <div className="chat-bubble chat-bubble-own bg-primary text-white p-3 rounded-xl rounded-tr-sm clean-shadow">
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          ) : (
            <div className="chat-bubble chat-bubble-own bg-primary text-white p-2 rounded-xl rounded-tr-sm clean-shadow">
              <img 
                src={message.imageUrl} 
                alt="Shared image" 
                className="w-full h-auto rounded-lg mb-1 shadow-sm"
              />
              {message.content && <p className="text-sm mt-1 leading-relaxed">{message.content}</p>}
            </div>
          )}
          <div className="flex items-center mt-1">
            <span className="text-xs text-slate-400">{formattedTime}</span>
            <div className="ml-1 text-xs text-primary/70">✓✓</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex mb-5">
      <div className="flex-shrink-0 mr-3">
        <Avatar className="w-8 h-8 border border-slate-100 shadow-sm">
          <AvatarImage src={product?.imageUrl} alt="Sender" />
          <AvatarFallback className="bg-slate-100 text-primary">{product?.title?.charAt(0) || "S"}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col max-w-[75%]">
        {message.messageType === "text" ? (
          <div className="chat-bubble chat-bubble-other glass-card p-3 rounded-xl rounded-tl-sm clean-shadow">
            <p className="text-sm text-slate-700 leading-relaxed">{message.content}</p>
          </div>
        ) : (
          <div className="chat-bubble chat-bubble-other glass-card p-2 rounded-xl rounded-tl-sm clean-shadow">
            <img 
              src={message.imageUrl} 
              alt="Shared image" 
              className="w-full h-auto rounded-lg mb-1 shadow-sm" 
            />
            {message.content && <p className="text-sm mt-1 text-slate-700 leading-relaxed">{message.content}</p>}
            <p className="text-xs text-slate-400">{message.imageUrl?.split("/").pop()}</p>
          </div>
        )}
        <span className="text-xs text-slate-400 mt-1">{formattedTime}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
