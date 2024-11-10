import ReactMarkdown from 'react-markdown';
import { MessageProps } from '../../../models/message'
import { CodeBlock } from './code';

export const Message = ({
    sender = "system",
    content = [{ text: "Hello There!!!", type: "text" }],
    createdAt,
    updatedAt,
    id,
    ...props
}: MessageProps) => {
    const text = content[0].text;
    const isUser = sender === "user";

    const messageStyle = {
        backgroundColor: isUser ? '#0084ff' : '#f1f0f0',
        color: isUser ? 'white' : 'black',
        padding: '10px 15px',
        borderRadius: '10px',
        maxWidth: '70%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '10px',
    };
    return (
        <div className={`message ${sender}`}>
            <div className="message-header">
                <div className="avatar">
                    <span className="avatar-initial">
                        {sender === 'user' ? 'U' : 'A'}
                    </span>
                </div>
                <span className="sender-name">
                    {sender === 'user' ? 'User' : 'Agent'}
                </span>
            </div>
            <ReactMarkdown
                    children={text}
                    components={{
                        code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                                <CodeBlock code={children} language={match[1]} />
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        },
                    }}
                />
            <div className="timestamp">
                {updatedAt}
            </div>
        </div>
    )
}