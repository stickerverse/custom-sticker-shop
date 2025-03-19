# Contributing to Custom Sticker Shop

Thank you for your interest in contributing to Custom Sticker Shop! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies with `npm install`
4. Set up required environment variables
5. Start the development server with `npm run dev`

## Project Structure

```
custom-sticker-shop/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Helper functions and utilities
│   │   ├── pages/          # Application pages/routes
│   │   └── App.tsx         # Main application component
│
├── server/                 # Backend Express API
│   ├── services/           # Service modules for external APIs
│   │   ├── ebay.ts         # eBay API integration
│   │   ├── ebay-settings.ts # eBay seller configuration
│   │   ├── ebay-token.ts   # eBay authentication
│   │   ├── ebay-sync.ts    # eBay synchronization services
│   │   └── replicate.ts    # Replicate API for image processing
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage interface
│   └── index.ts            # API entry point
│
└── shared/                 # Shared types and schemas
    └── schema.ts           # Database schema and types
```

## Code Style

- Follow TypeScript best practices
- Use functional components with hooks for React
- Write clear, descriptive comments
- Use meaningful variable and function names
- Apply appropriate error handling

## Development Workflow

1. Create a feature branch for your work
   ```
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test thoroughly

3. Commit your changes with a clear message
   ```
   git commit -m "Add feature: brief description"
   ```

4. Push your branch to your fork
   ```
   git push origin feature/your-feature-name
   ```

5. Create a pull request from your branch to the main repository

## API Integration

When working with external APIs (eBay, Etsy, Replicate):

1. Create a dedicated service file in `server/services/`
2. Implement proper error handling and logging
3. Use environment variables for API keys and tokens
4. Document the API endpoints and requirements

## Frontend Development

When building UI components:

1. Use existing Shadcn UI components when possible
2. Follow responsive design principles
3. Implement proper loading and error states
4. Use React Query for data fetching

## Testing

- Test your changes across different browsers and devices
- Verify all functionality works as expected
- Ensure proper error handling

## Documentation

- Update README.md with new features or changes
- Document new API endpoints or parameters
- Add comments to complex code sections

## Questions?

If you have questions or need help, please open an issue in the repository or reach out to the project maintainers.

Thank you for contributing to Custom Sticker Shop!