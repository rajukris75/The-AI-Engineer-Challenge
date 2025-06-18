# AI Chat Frontend

A modern React TypeScript frontend for the AI Chat API.

## Features

- Real-time streaming chat interface
- Secure API key handling
- Modern UI with Chakra UI
- Responsive design
- TypeScript support

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- OpenAI API key

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Start the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Enter your OpenAI API key in the input field at the top of the page
2. Type your message in the text area at the bottom
3. Click "Send" or press Enter to send your message
4. The AI's response will stream in real-time

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Security Note

The API key is stored only in memory and is never persisted to disk or sent to any server other than the OpenAI API through our backend.