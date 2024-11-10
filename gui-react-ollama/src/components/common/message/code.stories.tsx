import type { Meta, StoryObj } from "@storybook/react";

import { CodeBlock } from "./code";
import { vs, vsDark, prism } from "react-syntax-highlighter/dist/cjs/styles/prism";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "component/Message",
  component: CodeBlock,
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
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const typeScriptCodeDefault: Story = {
  args: {
    language: "typescript",
    code: "const getLastRepeatingCharAndCount = (input:string) => {\n    # Add something\n    const xxx = {}\n}"
  },
};

export const pythonCodeDefault: Story = {
  args: {
    language: "python",
    code: "def getLastRepeatingCharAndCount(string):\n    # Add something\n    def xxx = {}\n"
  },
};

export const pythonLongCode: Story = {
  args: {
    language: "python",
    code: "def find_last_repeating(string):\n    # Create a dictionary to store character counts\n    char_count = {}\n    \n    # Count occurrences of each character\n    for char in string:\n        char_count[char] = char_count.get(char, 0) + 1\n    \n    # Find the last repeating character\n    last_repeating = None\n    for char in string:\n        if char_count[char] > 1:\n            last_repeating = char\n    \n    # Return result\n    if last_repeating:\n        return (last_repeating, char_count[last_repeating])\n    return None\n\n# Test cases\nprint(find_last_repeating(\"hello\"))  # ('l', 2)\nprint(find_last_repeating(\"world\"))  # None\nprint(find_last_repeating(\"mississippi\"))  # ('i', 4)\n"
  },
};

export const typeScriptCodeVs: Story = {
  args: {
    language: "typescript",
    code: "const getLastRepeatingCharAndCount = (input:string) => {\n    # Add something\n    const xxx = {}\n}",
    style: vs
  },
};

export const typeScriptCodePrism: Story = {
  args: {
    language: "typescript",
    code: "const getLastRepeatingCharAndCount = (input:string) => {\n    # Add something\n    const xxx = {}\n}",
    style: prism
  },
};

export const pythonCodeVsDark: Story = {
  args: {
    language: "python",
    code: "def getLastRepeatingCharAndCount(string):\n    # Add something\n    def xxx = {}\n",
    style: vsDark
  },
};
