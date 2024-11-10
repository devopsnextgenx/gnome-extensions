import type { Meta, StoryObj } from "@storybook/react";

import { Message } from "./message";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "component/Message",
  component: Message,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {  createdAt: "", updatedAt: "" },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const user: Story = {
  args: {
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
  },
};

export const llm: Story = {
  args: {
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
  },
};
