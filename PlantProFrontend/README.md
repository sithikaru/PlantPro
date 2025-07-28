# 🌱 PlantPro Frontend

Modern web interface for the Zijja Plantation Management System built with Next.js 14.

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **QR Scanner**: qr-scanner

## 🏗️ Project Structure

```
src/
├── app/               # Next.js app router pages
│   ├── dashboard/     # Dashboard pages
│   ├── plants/        # Plant management
│   ├── auth/          # Authentication pages
│   └── reports/       # Analytics & reports
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components
│   ├── forms/        # Form components
│   └── charts/       # Chart components
├── lib/              # Utilities & configurations
├── hooks/            # Custom React hooks
└── types/            # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env.local
```

Configure your `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=PlantPro
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3001
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔐 Authentication

The application supports role-based authentication with the following roles:
- **Manager**: Full system access
- **Field Staff**: Field operations and data entry
- **Analytics**: Read-only reporting access

## 📱 Features

### Dashboard
- Real-time plantation overview
- Key performance indicators
- Recent activities feed
- Quick action buttons

### Plant Management
- Plant lot listing and search
- Detailed plant information
- QR code generation and scanning
- Health status tracking

### Field Operations
- Mobile-friendly interface
- Camera integration for photos
- Quick health status updates
- Offline capability (planned)

### Analytics & Reporting
- Interactive charts and graphs
- Export functionality
- Customizable date ranges
- Performance metrics

## 🎨 UI Components

Built with Radix UI primitives and styled with Tailwind CSS:
- Responsive design
- Accessibility-first approach
- Dark/light mode support
- Consistent design system

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- PWA capabilities (planned)
- Offline functionality (planned)

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🔧 Development

### Code Style
- ESLint + Prettier for formatting
- TypeScript strict mode
- Conventional commits
- Husky pre-commit hooks

### Component Development
- Use TypeScript for all components
- Follow naming conventions
- Include proper prop types
- Add JSDoc comments for complex components

## 📦 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Docker
```bash
# Build image
docker build -t plantpro-frontend .

# Run container
docker run -p 3000:3000 plantpro-frontend
```

### Static Export
```bash
npm run build
npm run export
```

## 🌐 Environment Variables

### Required
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - Application URL

### Optional
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_VERSION` - Application version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
