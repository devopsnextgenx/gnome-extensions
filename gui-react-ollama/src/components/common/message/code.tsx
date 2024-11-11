import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaRegCopy, FaRegClipboard } from 'react-icons/fa';
import "./code.css";

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
    const [isCopied, setIsCopied] = useState(false);

    return (
        <div key={uuidv4()} className="parentDiv">
            <CopyToClipboard
                text={code}
                onCopy={() => setIsCopied(true)}
                >
                <button type="button" className="copy-button" aria-label="Copy to Clipboard Button">
                    {isCopied ? <FaRegClipboard /> : <FaRegCopy />}
                </button>
            </CopyToClipboard>
            <SyntaxHighlighter language={language} style={style}>
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
