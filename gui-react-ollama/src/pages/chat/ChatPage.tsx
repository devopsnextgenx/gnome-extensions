import { useState } from 'react';
import { Chat } from '../../components/common/message/chat';
import { MessageProps } from '../../models/message';
import './ChatPage.css';
export const ChatPage = () => {
    const messages: MessageProps[] = [{
        id: 1,
        content: [
            {
                type: "text",
                text: "Hello, `world`"
            }
        ],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        sender: "agent"
    }];

    const messageInputDefault = {
        enabled: true,
        placeholder: "Type your message... (Ctrl+Enter to send)"
    }
    const [messageInput, setMessageInput] = useState(messageInputDefault);

    const fetchData = async (chatHistory: MessageProps[]) => {
        try {
            setMessageInput({ enabled: false, placeholder: "Asking llm model and waiting for response..." });
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "model": "llama3.2",
                    "messages": chatHistory.map(msg => {
                        return { role: msg.sender == 'agent' ? 'assistant' : 'user', content: msg.content[0].text }
                    }),
                    "stream": false
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            // Handle errors
            console.error(error);
        }
    };
    const onSendMessage = (message: string) => {
        console.log(`message: ${message}`)
        const newMsg = {
            content: [{ text: message, type: "text" }],
            sender: "user"
        };
        setChatHistory((oldChatHistory) => [...oldChatHistory, newMsg as MessageProps]);

        fetchData([newMsg as MessageProps]).then((response: any) => {
            console.log(response.message);
            setChatHistory((oldChatHistory) => [...oldChatHistory, {
                sender: response.message.role === 'assistant' ? 'agent' : 'user',
                content: [{ type: 'text', text: response.message.content }]
            } as MessageProps]);
            setMessageInput(messageInputDefault);
        });
    }
    const [chatHistory, setChatHistory] = useState(messages);

    const [isDisabled, setIsDisabled] = useState(true);
    const [endpoint, setEndpoint] = useState('http://localhost:11434');

    const handleDoubleClick = () => {
        setIsDisabled(false);
        console.log('Double click detected');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndpoint(e.target.value);
    };

    const handleBlur = () => {
        setIsDisabled(true);
    };

    return (
        <>

            <div className="input-group mb-3"
                style={{
                    width: '100%'
                }}>
                <div className="input-group-prepend" style={{
                    backgroundColor: 'gray',
                }}>
                    <span className="input-group-text"
                        style={{
                            backgroundColor: 'BLACK',
                            border: '2px solid #000000',
                            color: '#0000FF',
                            fontWeight: 'bold'
                        }}
                        id="llmApiEndpoint">LLM API EndPoint</span>
                </div>
                <input
                    type="text"
                    value={endpoint}
                    onChange={handleChange}
                    onDoubleClick={handleDoubleClick}
                    onClick={handleDoubleClick}
                    readOnly={isDisabled}
                    onBlur={handleBlur}
                    style={{
                        height: '100%',
                        flexGrow: 1,
                        padding: '8px',
                        border: '2px solid #000000',
                        color: '#000000',
                        borderRadius: '4px'
                    }}
                    className={isDisabled ? 'input-disabled' : 'input-enabled'}
                    aria-label="Default"
                    aria-describedby="llmApiEndpoint"
                />
            </div>
            <Chat messages={chatHistory} onSendMessage={onSendMessage} messageInput={messageInput} />
        </>
    );
};
