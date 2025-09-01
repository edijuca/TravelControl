# Overview

TravelControl is a modern web application designed to manage business travel expenses and mileage tracking. The application allows users to register trips, manage routes, calculate fuel costs and reimbursements, and generate comprehensive reports. Built with a focus on Brazilian market requirements, it includes features for tracking fuel costs, parking fees, tolls, and other travel-related expenses.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built as a React Single Page Application (SPA) using modern React patterns:
- **Framework**: React 18+ with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation schemas
- **Theme Support**: Custom theme provider with dark/light mode support
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
The server-side follows a REST API architecture with Express.js:
- **Framework**: Express.js with TypeScript for the API layer
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Architecture Pattern**: Storage interface pattern for data access abstraction
- **API Design**: RESTful endpoints organized by resource (users, routes, trips)
- **Error Handling**: Centralized error handling middleware
- **Logging**: Custom request/response logging for API endpoints

## Database Design
PostgreSQL database with three main entities:
- **Users**: Store user preferences including fuel pricing and UI settings
- **Routes**: Predefined routes between locations with known distances
- **Trips**: Individual trip records with costs, dates, and route references
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Relationships**: Foreign key relationships between users, routes, and trips

## Development Environment
Structured monorepo approach with clear separation:
- **Client Directory**: React frontend application
- **Server Directory**: Express.js backend application  
- **Shared Directory**: Common TypeScript types and schemas
- **Hot Reload**: Vite development server with HMR support
- **Type Safety**: Shared Zod schemas ensure consistency between frontend and backend

## UI/UX Design System
Modern, responsive design following current best practices:
- **Design Language**: Shadcn/ui "New York" style with neutral color palette
- **Responsive Design**: Mobile-first approach with collapsible sidebar navigation
- **Accessibility**: Radix UI primitives ensure ARIA compliance and keyboard navigation
- **Theming**: CSS custom properties for consistent styling and theme switching
- **Charts**: Recharts integration for data visualization and analytics

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with schema management
- **PostgreSQL**: Primary database engine with UUID generation

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Unstyled, accessible component primitives
- **Shadcn/ui**: Pre-built component library based on Radix UI
- **Recharts**: React charting library for data visualization
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **TypeScript**: Static type checking across the entire stack
- **Vite**: Build tool and development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## Routing and State
- **Wouter**: Minimalist routing library for React
- **TanStack Query**: Server state management with caching and synchronization

## Utility Libraries
- **clsx & Tailwind Merge**: Conditional CSS class composition
- **date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe CSS variant management