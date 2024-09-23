import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5001'); // Update with your backend URL if needed

const Messenger = ({ userId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    socket.on('receiveMessage', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const sendMessage = async () => {
    if (!message) return;

    const newMessage = {
      senderId: userId,
      recipientId: 'recipientUserId', // Replace with actual recipient ID
      content: message,
      includeAI: true, // Send to AI for response
    };

    // Send message to server
    try {
      const response = await axios.post('http://localhost:5001/messaging/send', newMessage);
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
            {msg.aiResponse && <p><em>AI Response:</em> {msg.aiResponse}</p>}
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
      {aiResponse && <div><strong>AI Response:</strong> {aiResponse}</div>}
    </div>
  );
};

export default Messenger;
