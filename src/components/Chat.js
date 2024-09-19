// /src/components/Chat.js

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  ListGroup, 
  Image, 
  Alert 
} from 'react-bootstrap';
import { 
  SendFill, 
  MicFill, 
  CameraVideoFill, 
  StopFill 
} from 'react-bootstrap-icons';

const socket = io.connect(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', { withCredentials: true });

function Chat({ roomId, currentUser }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [mediaChunks, setMediaChunks] = useState([]);
  const [mediaType, setMediaType] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Join the chat room
    socket.emit('joinRoom', { roomId });

    // Receive text messages
    socket.on('receiveMessage', ({ message, sender }) => {
      setMessages((prevMessages) => [...prevMessages, { message, sender }]);
    });

    // Receive media messages
    socket.on('receiveMedia', ({ mediaData, mediaType, sender }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { mediaData, mediaType, sender },
      ]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, mediaStream]);

  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('sendMessage', { roomId, message, sender: currentUser });
      setMessages((prevMessages) => [...prevMessages, { message, sender: currentUser }]);
      setMessage('');
    }
  };

  const startRecording = async (type) => {
    try {
      const constraints = type === 'video'
        ? { audio: true, video: true }
        : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setMediaChunks([]);
      setMediaType(type);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setMediaChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunks, { type: recorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          socket.emit('sendMedia', {
            roomId,
            mediaData: base64data,
            mediaType: type,
            sender: currentUser,
          });
          setMessages((prevMessages) => [
            ...prevMessages,
            { mediaData: base64data, mediaType: type, sender: currentUser },
          ]);
        };
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      };

      recorder.start();
      setIsRecording(true);
      setError('');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Unable to access media devices. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Function to get AI response
  const getAIResponse = async () => {
    // Prepare conversation history in the format required by OpenAI
    const conversation = messages.map((msg) => ({
      role: msg.sender === currentUser ? 'user' : (msg.sender === 'AI' ? 'assistant' : 'system'),
      content: msg.message,
    }));

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_URL}/messaging/ai/get-response`, {
        messages: conversation,
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { message: response.data.aiMessage, sender: 'AI' },
        ]);
        setError('');
      } else {
        console.error('AI response error:', response.data.message);
        setError('Failed to get AI response.');
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setError('Error fetching AI response.');
    }
  };

  return (
    <Container fluid className="d-flex flex-column vh-100">
      <Row className="bg-primary text-white text-center py-3">
        <Col>
          <h3>Chat Room</h3>
        </Col>
      </Row>
      <Row className="flex-grow-1 overflow-auto">
        <Col>
          <ListGroup variant="flush">
            {messages.map((msg, index) => (
              <ListGroup.Item key={index} className={msg.sender === currentUser ? 'text-end' : 'text-start'}>
                <strong>{msg.sender}:</strong>
                {msg.mediaData ? (
                  msg.mediaType === 'video' ? (
                    <div>
                      <video controls width="250" src={msg.mediaData} className="mt-2" />
                    </div>
                  ) : (
                    <div>
                      <audio controls src={msg.mediaData} className="mt-2" />
                    </div>
                  )
                ) : (
                  <p className="mb-1">{msg.message}</p>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
      <Row className="p-3">
        <Col>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
            />
            <Button variant="primary" className="ms-2" onClick={sendMessage}>
              <SendFill />
            </Button>
            <Button variant={isRecording ? "danger" : "secondary"} className="ms-2" onClick={isRecording ? stopRecording : () => startRecording('audio')}>
              {isRecording ? <StopFill /> : <MicFill />}
            </Button>
            <Button variant={isRecording ? "danger" : "secondary"} className="ms-2" onClick={isRecording ? stopRecording : () => startRecording('video')}>
              {isRecording ? <StopFill /> : <CameraVideoFill />}
            </Button>
            <Button variant="success" className="ms-2" onClick={getAIResponse}>
              Ask AI
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default Chat;
