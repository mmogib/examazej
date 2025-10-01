# Exam Shuffler - Academic Assessment Tool

A professional exam generation tool that creates multiple randomized versions of exams from LaTeX templates. Perfect for educators and academic institutions seeking to maintain exam integrity through intelligent question and answer randomization.

![Exam Shuffler](https://img.shields.io/badge/Status-Production-green) ![LaTeX](https://img.shields.io/badge/LaTeX-Supported-blue) ![React](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 🎯 Key Features

- **Smart Randomization**: Generate unlimited exam versions with shuffled questions and options
- **LaTeX Integration**: Professional typesetting with full LaTeX support including mathematical notation
- **Answer Keys**: Automatic generation of answer keys for each version
- **Question Groups**: Organize questions into balanced groups for structured randomization
- **Multiple Question Types**: Support for regular, fixed, fixed-options, open-ended, separate-page, and image questions
- **Cover Pages**: Optional individual or master cover pages
- **Version Tracking**: CSV mapping of question distribution across versions
- **Airtable Integration**: Secure user authentication and access control
- **Overleaf Compatible**: Direct import to Overleaf for compilation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for backend)
- Airtable account (for user management)

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

### Required Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Supabase Secrets

The following secrets must be configured in your Supabase project:

- `AIRTABLE_API_KEY` - Your Airtable API key
- `AIRTABLE_BASE_ID` - Your Airtable base ID
- `AIRTABLE_TABLE_NAME` - Name of the users table (default: "users")
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Airtable Setup

Your Airtable base should have a "users" table with the following fields:
- `Code` - Unique access code for each user
- `Email` - User's email address
- `FullName` - User's full name
- `Status` - User status (should be "active" for access)
- `ExpirationDate` - Optional expiration date

## 📖 How to Use

1. **Sign In**: Use your access code to authenticate
2. **Upload Template**: Upload a LaTeX template file with specially formatted questions
3. **Configure Settings**: Set exam details (course name, date, number of versions, etc.)
4. **Generate Exams**: Click generate to create randomized versions
5. **Download**: Get a complete LaTeX document with all versions and answer keys
6. **Compile**: Open in Overleaf or compile locally with LaTeX

### Template Format

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

See the in-app documentation for complete template format details.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (Auth, Edge Functions)
- **User Management**: Airtable API
- **Document Processing**: Custom LaTeX parser
- **Routing**: React Router v6

## 📁 Project Structure

```
exam-shuffler/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components (Landing, Auth, Start, etc.)
│   ├── lib/              # Core logic (parser, LaTeX, RNG)
│   ├── hooks/            # Custom React hooks
│   └── integrations/     # Supabase client
├── supabase/
│   ├── functions/        # Edge functions (user verification)
│   └── config.toml       # Supabase configuration
└── public/               # Static assets
```

## 🔐 Security Features

- Airtable-based access control
- User status and expiration validation
- Supabase authentication
- Service-role key protection in edge functions
- CORS-enabled API endpoints

## 🚀 Deployment

### Via Lovable

1. Open [Lovable Project](https://lovable.dev/projects/fd004b8b-7165-467a-a9d1-1f1e593e64c0)
2. Click Share → Publish
3. Configure custom domain if needed

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

### With Lovable

- Changes made in Lovable automatically sync to GitHub
- Changes pushed to GitHub automatically sync to Lovable
- Use Lovable's visual editor for rapid UI development
- Use your IDE for complex logic and refactoring

## 📄 License

This project is proprietary software for academic use.

## 🆘 Support

For technical support or questions:
- Review the in-app Documentation page
- Check the troubleshooting section
- Contact your administrator

---

**Built with ❤️ for educators worldwide**
