export interface MessageContent {
  type: string
  text: string
}

export interface MessageProps {
  id?: number
  content: [MessageContent]
  createdAt?: string
  updatedAt?: string
  sender: string
}