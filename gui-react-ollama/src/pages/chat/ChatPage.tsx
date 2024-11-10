import { Chat } from '../../components/common/message/chat';
import { MessageProps } from '../../models/message';
import './ChatPage.css';

export const ChatPage = () => {
    const chatHistory: MessageProps[] = [{
        id: 2,
        content: [
            {
                type: "text",
                text: "For given string, find the last repeating character in it and return its total repeatation count in given string along with character.\n```typescript\nconst getLastRepeatingCharAndCount = (input:string) => {\n    # Add something\n    const xxx = {}\n}\n```\n"
            }
        ],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        sender: "user",
    }, {
        id: 1,
        content: [
            {
                type: "text",
                text: "```python\ndef nwfn(string):\n    # Add something\n    xxx = {}\n```\nI'll help you write a `Python` function to find the last repeating character and its count in a string.\n\n```python\ndef find_last_repeating(string):\n    # Create a dictionary to store character counts\n    char_count = {}\n    \n    # Count occurrences of each character\n    for char in string:\n        char_count[char] = char_count.get(char, 0) + 1\n    \n    # Find the last repeating character\n    last_repeating = None\n    for char in string:\n        if char_count[char] > 1:\n            last_repeating = char\n    \n    # Return result\n    if last_repeating:\n        return (last_repeating, char_count[last_repeating])\n    return None\n\n# Test cases\nprint(find_last_repeating(\"hello\"))  # ('l', 2)\nprint(find_last_repeating(\"world\"))  # None\nprint(find_last_repeating(\"mississippi\"))  # ('i', 4)\n```\n\nLet's break down how this works:\n\n1. We first create a dictionary to store the count of each character\n2. We iterate through the string to count occurrences of each character\n3. We then iterate through the string again to find the last character that has a count > 1\n4. Finally, we return a tuple with the character and its count, or None if no repeating character is found\n\nWould you like me to provide additional test cases or modify the function in any way?\n\n```python\ndef nwfn(string):\n    # Add something\n    xxx = {}\n```"
            }
        ],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        sender: "agent",
    }];
    return (
        <Chat messages={chatHistory}/>
    );
};
