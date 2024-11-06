import React, { MutableRefObject, useEffect, useState } from "react";
import { Input } from "./ui/input";
import ZoomVideo, { VideoClient } from "@zoom/videosdk";

interface Props {
  isInSession: boolean;
  client: MutableRefObject<typeof VideoClient>;
}

const MessageBox: React.FC<Props> = ({ isInSession, client }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  // Get the chat client from Zoom SDK
  const chat = client.current?.getChatClient();

  useEffect(() => {
    if (chat) {
      // Listen for incoming chat messages
      client.current.on('chat-on-message', (payload) => {
        console.log(payload);
        setMessages((prevMessages) => [
          ...prevMessages,
          `${payload.sender.name}: ${payload.message}`,
        ]);
      });
    }

    return () => {
      // Cleanup: remove event listener when component unmounts
    //   if (chat) {
    //     chat.off('chat-on-message');
    //   }
    };
  }, [chat]);

  const handleSendMessage = async () => {
    if (isInSession && chat) {
      if (message.trim()) {
        try {
          // Send the message to all participants in the session
          await chat.sendToAll(message);
          setMessages((prevMessages) => [...prevMessages, `You: ${message}`]); // Update local message state
          setMessage(''); // Clear the input field
        } catch (err) {
          console.error("Error sending message:", err);
          setError('Failed to send message. Please try again.');
        }
      }
    } else {
      setError('Chat client is not available or not in session.');
    }
  };

  return (
    <div className="flex flex-col w-1/4 bg-gray-200 p-4 justify-between">
      <h2 className="text-xl font-semibold mb-2">Messages</h2>
      <div className="flex-1 overflow-y-auto p-2">
        {isInSession ? (
          messages.length > 0 ? (
            messages.map((msg, index) => <p key={index}>{msg}</p>)
          ) : (
            <p>No messages yet</p>
          )
        ) : (
          <p>Join the session first</p>
        )}
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <Input
        placeholder="Send Message to All"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSendMessage} className="mt-2 p-2 bg-blue-500 text-white rounded">
        Send
      </button>
    </div>
  );
};

export default MessageBox;
