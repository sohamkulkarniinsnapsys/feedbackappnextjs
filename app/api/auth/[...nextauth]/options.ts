// app/api/auth/[...nextauth]/options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel, { User } from "@/model/User"; // assume IUser is your interface for the mongoose doc

// Ensure required env present early (helpful for logs)
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("NEXTAUTH_SECRET is not set — sessions may be insecure.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },

      // authorize should return the *user object* that will get stored on token/session.
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) {
            // NextAuth will handle an error; returning null means authentication failed.
            return null;
          }

          // ensure DB is connected
          await dbConnect();

          const identifier = credentials.identifier.trim();
          const password = credentials.password;

          // find user by email or username
          const userDoc = (await UserModel.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          }).lean()) as (User & { _id: any }) | null;

          if (!userDoc) {
            // return null to indicate failed sign-in (no user)
            return null;
          }

          if (!userDoc.isVerified) {
            // you can pass messages via error redirection; return null here
            return null;
          }

          const passwordMatches = await bcrypt.compare(password, userDoc.password);
          if (!passwordMatches) {
            return null;
          }

          // Build the public user object that will be available in callbacks
          const userForSession = {
            // NextAuth prefers `id` as a string
            id: userDoc._id.toString(),
            email: userDoc.email,
            username: userDoc.username,
            isVerified: Boolean(userDoc.isVerified),
            isAcceptingMessages: Boolean(userDoc.isAcceptingMessages),
          };

          return userForSession;
        } catch (err) {
          console.error("Error in CredentialsProvider.authorize:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // Called whenever a JWT is created (initial sign in) or updated.
    async jwt({ token, user }) {
      // On first sign-in, `user` is present — copy useful fields to the token.
      if (user) {
        const u = user as any;
        token.id = u.id ?? token.id;
        token.username = u.username ?? token.username;
        token.isVerified = u.isVerified ?? token.isVerified;
        token.isAcceptingMessages = u.isAcceptingMessages ?? token.isAcceptingMessages;
      }
      return token;
    },

    // Called when session object is created (client or server getSession/getServerSession)
    async session({ session, token }) {
      // ensure session.user exists
      session.user = session.user || ({} as any);
      const sUser: any = session.user;

      // copy the properties from token into session.user so server APIs can read them
      if (token?.id) {
        sUser.id = token.id;
        sUser._id = token.id; // Add _id for backward compatibility
      }
      if (token?.username) sUser.username = token.username;
      if (typeof token?.isVerified !== "undefined") sUser.isVerified = token.isVerified;
      if (typeof token?.isAcceptingMessages !== "undefined")
        sUser.isAcceptingMessages = token.isAcceptingMessages;

      return session;
    },
  },

  // We use JWT sessions (no DB session storage)
  session: {
    strategy: "jwt",
    // optional: you can set maxAge, updateAge here
    // maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  // custom pages
  pages: {
    signIn: "/sign-in",
    // error: '/auth/error', // optional custom error page
  },

  // optional debug logging (enable if troubleshooting)
  // debug: process.env.NODE_ENV === 'development',
};
