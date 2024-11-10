import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { CopyToClipboard } from 'react-copy-to-clipboard';

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

export interface CodeBlockProps {
    code: any
    style?: {
        [key: string]: React.CSSProperties;
    } | undefined
    language: string
}

export const CodeBlock = ({ language, code, style = atomDark }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); // Reset after 1.5 seconds
    };

    return (
        <div key={uuidv4()}>
            <CopyToClipboard text={code} onCopy={handleCopy}>
                <button>{copied ? "Copied!" : "Copy"}</button>
            </CopyToClipboard>

            <SyntaxHighlighter language={language} style={style}>
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
