# Custom Sticker Shop

A cutting-edge sticker e-commerce platform that revolutionizes custom sticker design through advanced customization tools and interactive user experiences.

## Features

- **Advanced Customization Engine**: Create and personalize stickers with powerful design tools
- **Real-time Design Interaction**: See your changes instantly as you customize your stickers
- **eBay Store Integration**: Sync products with your eBay store for seamless inventory management
  - Seller-specific filtering to focus on your own products
  - Browse API integration for comprehensive product search
  - Import selected products with customization options
- **Image Processing**: Background removal and border detection using AI technology
- **Interactive Chat System**: Communicate with customers about their custom orders
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Tech Stack

- **Frontend**: React with TypeScript, Shadcn UI components, TailwindCSS
- **Backend**: Express.js API with in-memory storage
- **APIs**: 
  - Replicate API for image processing
  - eBay API for store synchronization
  - WebSocket for real-time chat
- **Authentication**: Custom authentication system with secure sessions
- **Real-time Communication**: WebSocket for chat functionality

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up required environment variables
4. Start the development server with `npm run dev`

## Environment Variables

The following environment variables are required:

- `REPLICATE_API_TOKEN`: For image processing features (background removal, border detection)
- `EBAY_TOKEN`: OAuth token for eBay API access
- `EBAY_SELLER_ID` (optional): Your eBay seller ID for filtering products

You can also set the seller ID through the application settings interface.

## eBay Integration

The application supports importing products from your eBay store through multiple methods:

1. **Seller ID Configuration**: Filter products by specific seller ID
   - Can be set via environment variable or through the UI
   - Settings are persisted across application restarts

2. **Browse API Integration**: Search and filter products with advanced criteria
   - Supports pagination and sorting
   - Handles product details and images

3. **Export Capabilities**: Save eBay product data in various formats
   - JSON export with complete product details
   - CSV export for spreadsheet compatibility

## Project Structure

- `client/`: React frontend application
- `server/`: Express.js backend API
- `shared/`: Types and schemas shared between frontend and backend
- `server/services/`: Individual service modules:
  - `ebay.ts`: Core eBay API integration
  - `ebay-settings.ts`: eBay seller configuration management
  - `ebay-token.ts`: eBay authorization management
  - `ebay-sync.ts`: Product synchronization services
  - `replicate.ts`: Image processing with Replicate API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.