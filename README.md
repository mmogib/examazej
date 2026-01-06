# Exam Shuffler - Academic Assessment Tool

A professional exam generation tool that creates multiple randomized versions of exams from LaTeX templates. Perfect for educators and academic institutions seeking to maintain exam integrity through intelligent question and answer randomization.

![Exam Shuffler](https://img.shields.io/badge/Status-Production-green) ![LaTeX](https://img.shields.io/badge/LaTeX-Supported-blue) ![React](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 🎯 Key Features

- **Multiple Input Formats**: Support for LaTeX, Excel (.xlsx), and CSV formats - choose what works best for you
- **Smart Randomization**: Generate unlimited exam versions with shuffled questions and options
- **LaTeX Integration**: Professional typesetting with full LaTeX support including mathematical notation
- **Excel/CSV Support**: Easy-to-use templates with LaTeX math ($...$) support in cells
- **Answer Keys**: Automatic generation of answer keys for each version
- **Question Groups**: Organize questions into balanced groups for structured randomization
- **Three Grouping Modes**: Standard, Parentheses (dependent questions), and Square Brackets (topic-based shuffling)
- **Multiple Question Types**: Support for regular, fixed, fixed-options, open-ended, separate-page, and image questions
- **Page Count Variation Warnings**: Smart detection and warnings when different exam versions have different page counts, preventing exam hall confusion
- **Cover Pages**: Optional individual or master cover pages
- **Version Tracking**: CSV mapping of question distribution across versions
- **Secure Authentication**: JWT-based access control via custom auth API
- **Overleaf Compatible**: Direct import to Overleaf for compilation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Access to auth API (https://shuffler-auth.mshahrani.website)
- Valid access code from administrator

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd exam-shuffler

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:8080` to access the application.

## ⚙️ Configuration

### Authentication

The application uses a custom JWT-based authentication system:

- **Auth API**: `https://shuffler-auth.mshahrani.website`
- **Storage**: JWT tokens stored in browser localStorage
- **Access Control**: User validation via Airtable backend
- **No Environment Variables Required**: Auth API URL is built into the application

### User Access

Users need a valid access code provided by the administrator. Access codes are managed through:

- Airtable base with user records
- Fields: Code, Email, FullName, Status, ExpirationDate
- Only users with `Status: "active"` and valid (non-expired) codes can access the application

## 📖 How to Use

1. **Sign In**: Use your access code to authenticate
2. **Choose Format & Download Template**: Select LaTeX, Excel, or CSV format and download a pre-filled template
3. **Edit Template**: Add your questions using your preferred editor (Overleaf, Excel, VS Code, etc.)
4. **Upload Template**: Upload your completed template file (.tex, .xlsx, or .csv)
5. **Configure Settings**: Set exam details (course name, date, number of versions, etc.)
6. **Generate Exams**: Click generate to create randomized versions
7. **Download**: Get a complete LaTeX document with all versions and answer keys
8. **Compile**: Open in Overleaf or compile locally with LaTeX

### Template Formats

#### LaTeX Format (Advanced)
Questions should be marked with special tags:

```latex
%% Question: Regular
What is 2 + 2?
%% Option:
Three
%% Option: *
Four
%% Option:
Five
%% End Question
```

#### Excel Format
Four sheets: Settings, Instructions, Preamble, Questions
- Easy to edit in Excel or Google Sheets
- Supports LaTeX math in cells: `$x^2 + y^2 = z^2$`
- Questions sheet has columns: Question Text, Option A-E, Correct, Type, Tags

#### CSV Format
Four sections marked with `# settings`, `# instructions`, `# preamble`, `# questions`
- Plain text format for version control
- Supports LaTeX math: `$\int x dx$`
- Easy to edit in any text editor

See the in-app documentation for complete template format details.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Authentication**: Custom JWT-based auth via Hono API
- **User Management**: Airtable API
- **Document Processing**: Custom LaTeX/CSV/Excel parsers (xlsx library)
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **Rich Text**: TipTap editor with KaTeX math rendering
- **Routing**: React Router v6

## 📁 Project Structure

```
exam-shuffler/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── layout/       # Header, Footer
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Page components (Landing, Auth, Start, etc.)
│   ├── lib/              # Core logic
│   │   ├── core/         # Exam generation (parser, LaTeX, RNG)
│   │   ├── parsers/      # CSV & Excel parsers
│   │   ├── generators/   # Template generators (LaTeX, CSV, Excel)
│   │   ├── auth.ts       # JWT authentication client
│   │   ├── types.ts      # TypeScript definitions
│   │   └── utils/        # Utility functions (logger, etc.)
│   ├── hooks/            # Custom React hooks
│   └── assets/           # Bundled static assets
└── public/               # Static files (served at /)
```

## 🔐 Security Features

- **JWT-based Authentication**: Secure token-based auth system
- **Access Control**: Airtable-based user management
- **User Validation**: Status and expiration date checking
- **Client-side Processing**: All exam generation happens in browser (privacy-focused)
- **HTTPS Only**: Secure communication with auth API
- **Token Expiration**: 30-day JWT token lifetime

## 🚀 Deployment

### Manual Deployment

```sh
# Build production bundle
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder to your hosting service
```

## 🤝 Contributing

This project is actively maintained. For questions or suggestions:

1. Open an issue in the repository
2. Contact the development team
3. Submit a pull request with improvements

## 📝 Development Workflow

### Local Development

```sh
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📄 License

This project is proprietary software for academic use.

## 🆘 Support

For technical support or questions:

- Review the in-app Documentation page
- Check the troubleshooting section
- Contact your administrator

---

**Built with ❤️ for educators worldwide**
