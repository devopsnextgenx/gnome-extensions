import React, { useState } from "react";
import { MessageProps } from "../../../models/message";
import { Message } from "./message";
import './chat.css';
import MessageInput from "./messageInput";

export interface ChatProps {
    messages: MessageProps[],
    onSendMessage: any,
    messageInput: {
        enabled: boolean,
        placeholder: string
    }
}
export const Chat = ({ messages, onSendMessage, messageInput, ...props }: ChatProps) => {
    
    return (
        <div className="chat-container">
            <div className="messages-container" id="message-container-id">
                {
                    messages.map((message) => {
                        return (<>
                            <div
                                key={message.id}
                                className={`message-wrapper ${message.sender}`}
                            >
                                <Message {...message} />
                            </div>
                        </>)
                    })
                }
            </div>
            <div>
            <MessageInput onSendMessage={onSendMessage} messageInput={messageInput} />
            </div>
        </div>
    );
}
