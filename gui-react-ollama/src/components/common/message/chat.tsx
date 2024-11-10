import React, { useState } from "react";
import { MessageProps } from "../../../models/message";
import { Message } from "./message";
import './chat.css';
import MessageInput from "./messageInput";

export interface ChatProps {
    messages: MessageProps[],
    onSendMessage: any
}
export const Chat = ({ messages, onSendMessage, ...props }: ChatProps) => {
    
    return (
        <div className="chat-container">
            <div className="messages-container">
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
            <MessageInput onSendMessage={onSendMessage}/>
            </div>
        </div>
    );
}
