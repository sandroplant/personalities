// client/src/components/Messenger.tsx

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import './Messenger.css'; // Ensure you have appropriate styles

// Define the structure of a message
interface Message {
  senderId: string;
  recipientId: string;
  content: string;
  aiResponse?: string;
  includeAI?: boolean;
}

// Define the props for the Messenger component
interface MessengerProps {
  userId: string;
}

// Define the structure of the response from the AI
interface SendMessageResponse {
  aiResponse?: string;
}

const Messenger: React.FC<MessengerProps> = ({ userId }) => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Use useRef to persist the socket instance across renders
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io('http://localhost:80');
    socketRef.current = socket;

    // Listen for incoming messages
    socket.on('receiveMessage', (messageData: Message) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages

    const newMessage: Message = {
      senderId: userId,
      recipientId: 'recipientUserId', // Replace with actual recipient ID or make it dynamic
      content: message.trim(),
      includeAI: true, // Indicates that this message should trigger an AI response
    };

    // Optimistically add the new message to the chat
    setMessages((prev) => [...prev, newMessage]);
    setMessage(''); // Clear the input field

    try {
      const response = await axios.post<SendMessageResponse>(
        'http://localhost:80/messaging/send', // Update with your backend endpoint
        newMessage
      );

      const { aiResponse } = response.data;

      if (aiResponse) {
        const aiMessage: Message = {
          senderId: 'AI', // Designate AI as the sender
          recipientId: userId,
          content: aiResponse,
        };

        // Add AI response to the chat
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally, you can display an error message to the user
    }
  };

  // Handle "Enter" key press to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="messenger-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${
              msg.senderId === userId ? 'sent' : 'received'
            }`}
          >
            <strong>{msg.senderId}:</strong> {msg.content}
            {msg.aiResponse && (
              <p className="ai-response">
                <em>AI Response:</em> {msg.aiResponse}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message"
          className="message-input"
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default Messenger;
