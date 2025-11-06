// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import { authOptions } from "./options";

export const runtime = "nodejs"; // ensure Node runtime for NextAuth (and compatibility with mongoose elsewhere)

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
