# Custom Sticker Shop and Messaging Platform

A cutting-edge sticker e-commerce platform that revolutionizes custom sticker design through advanced customization tools and interactive user experiences.

## Features

- Custom sticker design and ordering
- Real-time chat interface for customer support
- eBay store integration for product management
- Advanced image processing with background removal
- Secure checkout with payment integration
- Responsive layout for all devices

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Node.js, Express
- **Database:** PostgreSQL with Drizzle ORM
- **APIs:** eBay API, Replicate API (for image processing)
- **Authentication:** Custom auth system with session management
- **Real-time:** WebSockets for chat functionality

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL (optional, uses in-memory storage by default)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/custom-sticker-shop.git
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:5000

## Project Structure

```
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   └── pages/      # Page components
├── server/             # Express backend
│   ├── ebay/           # eBay integration
│   ├── services/       # Backend services
│   └── routes.ts       # API routes
└── shared/             # Shared code between client and server
    └── schema.ts       # Database schema and types
```

## Key Features

### Custom Sticker Design
Upload images, remove backgrounds, and customize stickers with various options including size, shape, and material.

### eBay Integration
Import and manage products from eBay store, with synchronization capabilities and export options.

### Real-time Chat
Built-in messaging system for customer support and order-related communications.

## License

This project is licensed under the MIT License - see the LICENSE file for details.