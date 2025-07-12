
# Synapse

Synapse is an intelligent, all-in-one application for knowledge management and productivity. It combines note-taking, task management, and knowledge visualization to help you connect your ideas and stay organized.

## ✨ Features

- **📝 Rich Note-Taking**: A powerful, block-based editor for creating and organizing notes.
- **✅ Task Management**: Keep track of your to-dos with priorities and deadlines.
- **🧠 Knowledge Graph**: Visualize the connections between your notes to uncover new insights.
- **🤖 AI-Powered Features**: Leverage AI to chat with your notes and generate summaries.
- **🔒 Secure Authentication**: Sign in with your Google account or via one-time password (OTP).
- **📊 Dashboard**: Get a quick overview of your upcoming tasks, recent notes, and key stats.
- **🎨 Themable**: Switch between light and dark modes.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Editor**: [Tiptap](https://tiptap.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

Follow these instructions to set up the project on your local machine.

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or later)
- [pnpm](https://pnpm.io/installation)
- [MongoDB](https://www.mongodb.com/try/download/community) (or a MongoDB Atlas account)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/synapse.git
    cd synapse
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp example.env .env
    ```
    
    Now, open `.env` and fill in the required values:

    - `MONGODB_URI`: Your MongoDB connection string.
    - `NEXTAUTH_SECRET`: A secret key for NextAuth.js. You can generate one with `openssl rand -base64 32`.
    - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Your Google OAuth credentials.
    - `SMTP_*`: Your SMTP server details for sending OTP emails.
    - `GOOGLE_GEMINI_API_KEY`: API key for Google Gemini.

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📜 Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Creates a production build.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Lints the codebase.

