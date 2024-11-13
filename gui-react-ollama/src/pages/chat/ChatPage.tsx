import { useState } from 'react';
import { Chat } from '../../components/common/message/chat';
import { MessageProps } from '../../models/message';
import './ChatPage.css';

export const ChatPage = () => {
    const messages: MessageProps[] = [];

    const messageInputDefault = {
        enabled: true,
        placeholder: "Type your message... (Ctrl+Enter to send)"
    }
    const modelSpec = {
        model: process.env.REACT_APP_LLM_MODEL || 'llama3.2',
        endpoint: process.env.REACT_APP_LLM_API_ENDPOINT ||'http://localhost:11434'
    }
    const [messageInput, setMessageInput] = useState(messageInputDefault);
    const [endpoint, setEndpoint] = useState(modelSpec.endpoint);
    const [llmModel, setLlmModel] = useState(modelSpec.model);

    const fetchData = async (newMsg: MessageProps) => {
        try {
            setMessageInput({ enabled: false, placeholder: "Asking llm model and waiting for response..." });
            const chatHistoryTmp = [...chatHistory, newMsg];
            const response = await fetch(`${endpoint}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "model": llmModel,
                    "messages": chatHistoryTmp.map(msg => {
                        return { role: msg.sender == 'agent' ? 'assistant' : 'user', content: msg.content[0].text }
                    }),
                    "stream": false
                })
            });
            const data = await response.json();
            return { data, status: response.status };
        } catch (error: any) {
            // Handle errors
            console.error(error);
            const message = {message: error.message, resolution: 'Check if ollama api is running and model is pulled'}
            return { data: message, status: 500 };
        }
    };
    const onSendMessage = (message: string) => {
        const newMsg = {
            content: [{ text: message, type: "text" }],
            sender: "user"
        };
        setChatHistory((oldChatHistory) => [...oldChatHistory, newMsg as MessageProps]);

        fetchData(newMsg as MessageProps).then((response: any) => {
            if (response.status === 200) {
                setChatHistory((oldChatHistory) => [...oldChatHistory, {
                    sender: response.data.message.role === 'assistant' ? 'agent' : 'user',
                    content: [{ type: 'text', text: response.data.message.content }]
                } as MessageProps]);
            } else {
                const errorMessage = JSON.stringify(response.data, null, '\t').replace(/\\"/g, "'").replace(/\\n/g, '\n');
                const messageString = `### Error Response:\n\nstatus: \`${response.status}\`\n\nmessage: \`\`\`${errorMessage}\`\`\`\n`;
                setChatHistory((oldChatHistory) => [...oldChatHistory, {
                    sender: 'system',
                    content: [{
                        type: 'text', text: messageString
                    }]
                } as MessageProps]);
            }
            setMessageInput(messageInputDefault);
        });
    }
    const [chatHistory, setChatHistory] = useState(messages);

    const [isDisabled, setIsDisabled] = useState(true);

    const handleDoubleClick = () => {
        setIsDisabled(false);
    };

    const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndpoint(e.target.value);
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLlmModel(e.target.value);
    };

    const handleBlur = () => {
        setIsDisabled(true);
    };

    return (
        <>

            <div className="input-group mb-3"
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                <div className="input-group-prepend" style={{
                    backgroundColor: 'gray'
                }}>
                    <span className="input-group-text"
                        style={{
                            backgroundColor: 'BLACK',
                            border: '2px solid #000000',
                            color: '#0000FF',
                            fontWeight: 'bold',
                            alignContent: 'center',
                        }}
                        id="llmApiEndpoint">API EndPoint</span>
                </div>
                <input
                    type="text"
                    value={endpoint}
                    onChange={handleEndpointChange}
                    onDoubleClick={handleDoubleClick}
                    onClick={handleDoubleClick}
                    readOnly={isDisabled}
                    onBlur={handleBlur}
                    placeholder='http://localhost:11434'
                    style={{
                        height: '100%',
                        flexGrow: 1,
                        width: '30%',
                        padding: '8px',
                        border: '2px solid #000000',
                        color: '#000000',
                        borderRadius: '4px',
                        marginLeft: '10px'
                    }}
                    className={isDisabled ? 'input-disabled' : 'input-enabled'}
                    aria-label="Default"
                    aria-describedby="llmApiEndpoint"
                />
                <input
                    type="text"
                    value={llmModel}
                    onChange={handleModelChange}
                    onDoubleClick={handleDoubleClick}
                    onClick={handleDoubleClick}
                    readOnly={isDisabled}
                    onBlur={handleBlur}
                    placeholder='llama3.2'
                    style={{
                        height: '100%',
                        flexGrow: 1,
                        width: '20%',
                        padding: '8px',
                        border: '2px solid #000000',
                        color: '#000000',
                        borderRadius: '4px',
                        marginLeft: '10px'
                    }}
                    className={isDisabled ? 'input-disabled' : 'input-enabled'}
                />
                <button className="btn btn-danger"
                    style={{
                        marginLeft: '10px',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        width: '20%',
                    }}
                    onClick={() => {
                        setChatHistory([]);
                        setMessageInput(messageInputDefault);
                    }}
                    type="button"
                    id="button-reset">Reset</button>
            </div >
            <Chat messages={chatHistory} onSendMessage={onSendMessage} messageInput={messageInput} />
        </>
    );
};
