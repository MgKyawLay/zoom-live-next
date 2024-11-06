import React, { MutableRefObject, useEffect, useState } from "react";
import { Input } from "./ui/input";
import ZoomVideo, { VideoClient } from "@zoom/videosdk";

interface Props {
  isInSession: boolean;
  client: MutableRefObject<typeof VideoClient>;
}

interface ChatMessage {
  message: string;
  sender: string;
  receiver: string;
  timestamp: string;
  id: string;
}

const MessageBox: React.FC<Props> = ({ isInSession, client }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleIncomingMessages = async (payload: any) => {
      const formattedMessage: ChatMessage = {
        message: payload?.message,
        sender: payload?.sender.name,
        receiver: payload?.receiver.name,
        id: payload?.id,
        timestamp: payload?.timestamp,
      };
      setMessages((prev) => [...prev, formattedMessage]);
    };

    client.current.on("chat-on-message", handleIncomingMessages);

    return () => {
      client.current.off("chat-on-message", handleIncomingMessages);
    };
  }, [client]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    const chat = client.current.getChatClient();

    try {
      // Send the message to all participants
      await chat.sendToAll(message);

      // Get the chat history and update the messages state
      const history = await chat.getHistory();
      const formattedMessages = history.map((msg: any) => ({
        message: msg.message,
        sender: msg.sender.name,
        receiver: msg.receiver.name,
        timestamp: msg.timestamp,
        id: msg.id,
      }));

      setMessages(formattedMessages); // Set formatted message data

      // Clear the input field
      setMessage("");
      setError(null); // Clear any existing errors
    } catch (err) {
      setError("Failed to send the message. Please try again.");
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col w-1/4 bg-gray-200 p-4 justify-between">
      <h2 className="text-xl font-semibold mb-2">Messages</h2>
      <div className="flex-1 overflow-y-auto p-2">
        {isInSession ? (
          messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <p>
                  <strong>{msg.sender}</strong> to <strong>{msg.receiver}</strong>
                </p>
                <p>{msg.message}</p>
                <p className="text-xs text-gray-500">{msg.timestamp}</p>
              </div>
            ))
          ) : (
            <p>No messages yet</p>
          )
        ) : (
          <p>Join the session first</p>
        )}
      </div>

      {/* Display error message */}
      {error && <div className="text-red-500">{error}</div>}

      {/* Input field to type a message */}
      <Input
        placeholder="Send Message to All"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {/* Button to send the message */}
      <button
        onClick={handleSendMessage}
        className="mt-2 p-2 bg-blue-500 text-white rounded"
      >
        Send
      </button>
    </div>
  );
};

export default MessageBox;
