import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

interface Message {
  senderId: string;
  recipientId: string;
  content: string;
  aiResponse?: string;
  includeAI?: boolean;
}

interface MessengerProps {
  userId: string;
}

const socket = io('http://localhost:5001'); // Update with your backend URL if needed

const Messenger: React.FC<MessengerProps> = ({ userId }) => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');

  useEffect(() => {
    socket.on('receiveMessage', (messageData: Message) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const sendMessage = async () => {
    if (!message) return;

    const newMessage: Message = {
      senderId: userId,
      recipientId: 'recipientUserId', // Replace with actual recipient ID
      content: message,
      includeAI: true, // Send to AI for response
    };

    // Send message to server
    try {
      interface SendMessageResponse {
        aiResponse?: string;
      }

      const response = await axios.post<SendMessageResponse>(
        'http://localhost:5001/messaging/send',
        newMessage
      );
      const { aiResponse } = response.data;
      setAiResponse(aiResponse || ''); // Update with AI response if available
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.senderId}</strong>: {msg.content}
            {msg.aiResponse && (
              <p>
                <em>AI Response:</em> {msg.aiResponse}
              </p>
            )}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
      {aiResponse && (
        <div>
          <strong>AI Response:</strong> {aiResponse}
        </div>
      )}
    </div>
  );
};

export default Messenger;
