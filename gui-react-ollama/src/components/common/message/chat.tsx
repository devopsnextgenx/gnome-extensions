import React, { useState } from "react";
import { MessageProps } from "../../../models/message";
import { Message } from "./message";
import './chat.css';
import MessageInput from "./messageInput";

export interface ChatProps {
    messages: MessageProps[]
}
export const Chat = ({ messages, ...props }: ChatProps) => {
    const onSendMessage = (message: string) => {
        console.log(`message: ${message}`);

        messages.push({
            content: [{text: message, type: "text"}],
            sender: "user"
        });
    }
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
