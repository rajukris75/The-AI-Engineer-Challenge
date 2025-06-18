import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  Button,
  Text,
  useToast,
  Flex,
  Textarea,
  Input,
  Heading,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react'
import axios, { AxiosError } from 'axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  detail?: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const userMessageBg = useColorModeValue('blue.50', 'blue.900')
  const assistantMessageBg = useColorModeValue('gray.50', 'gray.700')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!input.trim() || !apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both a message and an API key.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: 'You are a helpful AI assistant.',
          user_message: userMessage,
          model: 'gpt-4.1-mini',
          api_key: apiKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json() as ChatResponse
        throw new Error(errorData.detail || 'Failed to get response from the AI')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to initialize response stream')
      }

      let assistantMessage = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        try {
          const chunk = decoder.decode(value)
          assistantMessage += chunk
          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = assistantMessage
              return [...newMessages]
            } else {
              return [...newMessages, { role: 'assistant', content: assistantMessage }]
            }
          })
        } catch (decodeError) {
          console.error('Error decoding chunk:', decodeError)
          setError('Error processing AI response')
          break
        }
      }
    } catch (error) {
      console.error('API Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response from the AI'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={4} align="stretch" h="100vh">
        <Heading as="h1" size="lg" textAlign="center" mb={4}>
          AI Chat Assistant
        </Heading>
        
        <Box>
          <Input
            type="password"
            placeholder="Enter your OpenAI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            mb={4}
            bg={bgColor}
          />
        </Box>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box 
          flex={1} 
          overflowY="auto" 
          p={4} 
          borderWidth={1} 
          borderRadius="md"
          bg={bgColor}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              mb={4}
              p={3}
              borderRadius="md"
              bg={message.role === 'user' ? userMessageBg : assistantMessageBg}
              alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
              maxW="80%"
              ml={message.role === 'user' ? 'auto' : 0}
            >
              <Text whiteSpace="pre-wrap">{message.content}</Text>
            </Box>
          ))}
          {isLoading && (
            <Flex justify="center" my={4}>
              <Spinner color="blue.500" />
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <form onSubmit={handleSubmit}>
          <Flex gap={2}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              bg={bgColor}
              resize="none"
              rows={3}
            />
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              alignSelf="flex-end"
              px={8}
            >
              Send
            </Button>
          </Flex>
        </form>
      </VStack>
    </Container>
  )
}

export default App 