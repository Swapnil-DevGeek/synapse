import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// MongoDB client for NextAuth adapter
const client = new MongoClient(process.env.MONGODB_URI!);

const handler = NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Credentials Provider for email/password login
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "text" } // "signin" or "signup"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await dbConnect();

        const { email, password, action } = credentials;

        if (action === "signup") {
          // Sign up flow
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            throw new Error("User already exists with this email");
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 12);

          // Create new user
          const newUser = await User.create({
            email,
            password: hashedPassword,
            name: email.split("@")[0], // Default name from email
            provider: "credentials",
          });

          return {
            id: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
            image: newUser.image,
          };
        } else {
          // Sign in flow
          const user = await User.findOne({ email, provider: "credentials" });
          if (!user) {
            throw new Error("No user found with this email");
          }

          // Check password
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }
      },
    }),
  ],
  
  session: {
    strategy: "jwt",
  },
  
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Include user ID in token
      if (user) {
        token.userId = user.id;
      }
      
      // Handle Google OAuth user creation
      if (account?.provider === "google" && profile) {
        await dbConnect();
        
        // Check if user exists in our User model
        let existingUser = await User.findOne({ email: profile.email });
        
        if (!existingUser) {
          // Create user in our User model for Google OAuth
          existingUser = await User.create({
            email: profile.email,
            name: profile.name,
            image: profile.picture,
            provider: "google",
            emailVerified: new Date(),
          });
        }
        
        token.userId = existingUser._id.toString();
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Include user ID in session
      if (token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
    
    async signIn({ user, account, profile }) {
      // Allow all sign ins
      return true;
    },
  },
  
  pages: {
    signIn: "/login",
    signUp: "/signup",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 