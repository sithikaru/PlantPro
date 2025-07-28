# 🌱 Zijja Plantation Management System

A comprehensive full-stack application for managing plantation operations, plant health monitoring, and analytics.

## 🏗️ Project Structure

```
├── PlantProBackend/          # NestJS API server
├── PlantProFrontend/         # Next.js web application
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   └── prompts/            # Development prompts
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Backend Setup
```bash
cd PlantProBackend
npm install
cp .env.example .env
# Configure your database settings in .env
npm run start:dev
```

### Frontend Setup
```bash
cd PlantProFrontend
npm install
npm run dev
```

## 🔧 Technology Stack

### Backend
- **Framework**: NestJS
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **File Upload**: Multer
- **QR Codes**: qrcode

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **HTTP Client**: Axios
- **QR Scanner**: qr-scanner

## 📋 Features

- 🔐 **Authentication & RBAC**: Multi-role access control
- 🌱 **Plant Management**: Comprehensive plant lot tracking
- 📱 **QR Code Integration**: Quick scanning for field updates
- 📸 **Image Analysis**: AI-powered plant health assessment
- 📊 **Dashboard & Analytics**: Real-time reporting
- 📱 **Mobile-Responsive**: Works on all devices
- 🔄 **Real-time Updates**: Live data synchronization

## 🏗️ Development Workflow

This project follows the step-by-step development process outlined in `.github/prompts/plantProPrompts.prompt.md`.

## 📝 License

MIT License - see LICENSE file for details.
