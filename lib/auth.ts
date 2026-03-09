import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Invalid credentials");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        throw new Error("No user found with this email");
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }
      return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        usertype: user.usertype,
      };
    },
  }),
];

if (isGoogleConfigured) {
  providers.unshift(
    GoogleProvider({
      clientId: googleClientId as string,
      clientSecret: googleClientSecret as string,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        user.id = existingUser.id.toString();
        user.usertype = existingUser.usertype;
        user.name = existingUser.name;
        return true;
      }

      const generatedPassword = await bcrypt.hash(`google-oauth-${randomUUID()}`, 12);
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name || "Google User",
          password: generatedPassword,
          usertype: "user",
          emailVerifiedAt: new Date(),
        },
      });

      user.id = createdUser.id.toString();
      user.usertype = createdUser.usertype;
      user.name = createdUser.name;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.usertype = user.usertype || "user";
        token.id = user.id;
      }

      if ((!token.id || !token.usertype) && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id.toString();
          token.usertype = dbUser.usertype;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.usertype = token.usertype as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
};
