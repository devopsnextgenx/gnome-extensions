import React, { useState } from "react";
import { MessageProps } from "../../../models/message";
import { Message } from "./message";
export interface ChatProps {
    messages:MessageProps[]
}
export const Chat = ({messages, ...props}: ChatProps) => {
    return (
        <div>
            {
                messages.map((message)=> <Message {...message} />)
            }
        </div>
    );
}
