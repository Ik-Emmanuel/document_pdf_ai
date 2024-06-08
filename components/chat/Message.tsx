import { cn } from "@/lib/utils";
import { ExtendedMessage } from "@/types/messages";
import { Icons } from "../Icons";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { forwardRef } from "react";
import Image from "next/image";

interface MessageProps {
  message: ExtendedMessage;
  isNextMessageSamePerson: boolean;
}

const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-end", {
          "justify-end": message.isUserMessage,
        })}
      >
        <div
          className={cn(
            "relative flex h-6 w-6 aspect-square items-center justify-center",
            {
              "order-2 bg-blue-600 rounded-sm": message.isUserMessage,
              "order-1 rounded-sm": !message.isUserMessage,
              invisible: isNextMessageSamePerson,
            }
          )}
        >
          {message.isUserMessage ? (
            <Icons.user className="fill-zinc-200 text-zinc-200 h-3/4 w-3/4" />
          ) : (
            // <Icons.Bot className="fill-zinc-300 h-3/4 w-3/4" />
            <Image src={"/logoipsum-245.svg"} alt="ai" width={50} height={50} />
          )}
        </div>

        <div
          className={cn("flex flex-col space-y-2 text-base max-w-md mx-2", {
            "order-1 items-end": message.isUserMessage,
            "order-2 items-start": !message.isUserMessage,
          })}
        >
          <div
            className={cn("px-4 py-2 rounded-lg inline-block", {
              "bg-gradient-to-r from-blue-400 via-blue-350 to-blue-600 text-white":
                message.isUserMessage,
              "bg-gradient-to-r from-gray-300 via-gray-200 to-gray-400 text-gray-900":
                !message.isUserMessage,
              "rounded-br-none":
                !isNextMessageSamePerson && message.isUserMessage,
              "rounded-bl-none":
                !isNextMessageSamePerson && !message.isUserMessage,
            })}
          >
            {typeof message.text === "string" ? (
              <ReactMarkdown
                className={cn("prose", {
                  "text-zinc-50": message.isUserMessage,
                })}
              >
                {message.text}
              </ReactMarkdown>
            ) : (
              message.text
            )}
            {message.id !== "loading-message" ? (
              <div
                className={cn("text-xs select-none mt-2 w-full text-right", {
                  "text-zinc-600": !message.isUserMessage,
                  "text-blue-200": message.isUserMessage,
                })}
              >
                {format(new Date(message.createdAt), "HH:mm")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

Message.displayName = "Message";

export default Message;
