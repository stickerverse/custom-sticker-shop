# Custom Sticker Shop

A cutting-edge sticker e-commerce platform that revolutionizes custom sticker design through advanced customization tools and interactive user experiences.

## Features

- **Advanced Customization Engine**: Create and personalize stickers with powerful design tools
- **Real-time Design Interaction**: See your changes instantly as you customize your stickers
- **eBay Store Integration**: Sync products with your eBay store for seamless inventory management
- **Image Processing**: Background removal and border detection using AI technology
- **Interactive Chat System**: Communicate with customers about their custom orders
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Tech Stack

- **Frontend**: React with TypeScript, Shadcn UI components, TailwindCSS
- **Backend**: Express.js API with in-memory storage
- **APIs**: Replicate API for image processing, eBay API for store synchronization
- **Authentication**: Custom authentication system with secure sessions
- **Real-time Communication**: WebSocket for chat functionality

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up required environment variables
4. Start the development server with `npm run dev`

## Environment Variables

The following environment variables are required:

- `REPLICATE_API_TOKEN`: For image processing features
- `EBAY_APP_ID`: For eBay store integration
- `EBAY_CERT_ID`: For eBay store integration
- `EBAY_DEV_ID`: For eBay store integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.