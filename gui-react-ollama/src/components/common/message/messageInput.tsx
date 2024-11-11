import React, { useState, useRef, useEffect } from 'react';
import './message-input.css'; // The CSS file above

const MessageInput = ({ onSendMessage, messageInput }: { onSendMessage: (message: string) => void, messageInput: { enabled: boolean, placeholder: string } }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust textarea height based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Handle Ctrl+Enter key combination
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="message-input-container">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={messageInput.placeholder}
          className="message-textarea"
          rows={1}
          disabled={!messageInput.enabled} 
        />
        <button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className={`send-button ${message.trim() ? 'active' : 'disabled'}`}
        >
          Send
        </button>
      </div>
      <div className="helper-text">
        Press Ctrl+Enter to send
      </div>
    </div>
  );
};

export default MessageInput;