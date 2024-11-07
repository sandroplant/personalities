// client/src/components/Chat.tsx

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client'; // Removed unused 'Socket' import
import axios from 'axios';
import '../../../server/src/config/env.js';
// Removed unused 'FormControl' import
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import {
  SendFill,
  StopFill,
  MicFill,
  CameraVideoFill,
} from 'react-bootstrap-icons';

// Define environment variable with a fallback
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:80';

// Initialize socket outside the component to prevent multiple connections
const socket = io(SERVER_URL);

interface Message {
  message?: string;
  mediaData?: string;
  mediaType?: 'audio' | 'video';
  sender: string;
}

interface ChatProps {
  roomId: string;
  currentUser: string;
}

const Chat: React.FC<ChatProps> = ({ roomId, currentUser }) => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [mediaChunks, setMediaChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Join the chat room
    socket.emit('joinRoom', { roomId });

    // Receive text messages
    const handleReceiveMessage = ({
      message,
      sender,
    }: {
      message: string;
      sender: string;
    }) => {
      setMessages((prevMessages) => [...prevMessages, { message, sender }]);
    };

    // Receive media messages
    const handleReceiveMedia = ({
      mediaData,
      mediaType,
      sender,
    }: {
      mediaData: string;
      mediaType: 'audio' | 'video';
      sender: string;
    }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { mediaData, mediaType, sender },
      ]);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('receiveMedia', handleReceiveMedia);

    // Cleanup on unmount
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('receiveMedia', handleReceiveMedia);
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (message.trim() !== '') {
      const newMessage: Message = {
        message,
        sender: currentUser,
      };
      socket.emit('sendMessage', { roomId, message, sender: currentUser });
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage('');
    }
  };

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const constraints =
        type === 'video'
          ? { audio: true, video: true }
          : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      setMediaChunks([]);

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          setMediaChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunks, { type: recorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
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

        // Stop all tracks to release resources
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      setError('');
    } catch (err: unknown) {
      console.error('Error accessing media devices:', err);
      setError(
        'Unable to access media devices. Please check your permissions.'
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // Function to get AI response
  const getAIResponse = async () => {
    const conversation = messages
      .filter((msg) => msg.message)
      .map((msg) => ({
        role:
          msg.sender === currentUser
            ? 'user'
            : msg.sender === 'AI'
              ? 'assistant'
              : 'system',
        content: msg.message ?? 'Default content',
      }));

    try {
      const response = await axios.post(
        `${SERVER_URL}/messaging/ai/get-response`,
        {
          messages: conversation,
        },
        {
          withCredentials: true,
        }
      );

      const data = response.data as {
        success: boolean;
        aiMessage: string;
        message?: string;
      };

      if (data.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { message: data.aiMessage, sender: 'AI' },
        ]);
        setError('');
      } else {
        const errorMessage = data.message || 'Failed to get AI response.';
        console.error('AI response error:', errorMessage);
        setError('Failed to get AI response.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching AI response:', err.message);
        setError('Error fetching AI response.');
      } else {
        console.error('Unknown error fetching AI response:', err);
        setError('Error fetching AI response due to an unknown error.');
      }
    }
  };

  // Handle Enter key press for sending message
  const handleKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <div className="d-flex flex-column vh-100">
        <Row className="bg-primary text-white text-center py-3">
          <Col>
            <h3>Chat Room</h3>
          </Col>
        </Row>
        <Row className="flex-grow-1 overflow-auto">
          <Col>
            <ListGroup>
              {messages.map((msg, index) => (
                <ListGroup.Item
                  key={index}
                  className={
                    msg.sender === currentUser ? 'text-end' : 'text-start'
                  }
                >
                  <strong>{msg.sender}:</strong>
                  {msg.mediaData ? (
                    msg.mediaType === 'video' ? (
                      <div>
                        <video
                          controls
                          width="250"
                          src={msg.mediaData}
                          className="mt-2"
                        />
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
        <Row className="p-3"></Row>
        <Col>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button variant="primary" className="ms-2" onClick={sendMessage}>
              <SendFill />
            </Button>
            <Button
              variant={isRecording ? 'danger' : 'secondary'}
              className="ms-2"
              onClick={
                isRecording ? stopRecording : () => startRecording('audio')
              }
            >
              {isRecording ? <StopFill /> : <MicFill />}
            </Button>
            <Button
              variant={isRecording ? 'danger' : 'secondary'}
              className="ms-2"
              onClick={
                isRecording ? stopRecording : () => startRecording('video')
              }
            >
              {isRecording ? <StopFill /> : <CameraVideoFill />}
            </Button>
            <Button variant="success" className="ms-2" onClick={getAIResponse}>
              Ask AI
            </Button>
          </Form>
        </Col>
      </div>
    </>
  );
};

export default Chat;
