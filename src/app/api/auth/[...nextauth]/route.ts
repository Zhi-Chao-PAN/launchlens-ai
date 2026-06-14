import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Pool } from "@neondatabase/serverless";
import NeonAdapter from "@auth/neon-adapter";

function getPool() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
  if (!url) return null;
  return new Pool({ connectionString: url });
}

const pool = getPool();

declare module "next-auth" {
  interface Session {
    ownerHash?: string;
  }
  interface User {
    ownerHash?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    ownerHash?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: pool ? NeonAdapter(pool) : undefined,
  providers: [
    Credentials({
      name: "Recovery key",
      credentials: {
        handle: { label: "Handle", type: "text" },
        recoveryKey: { label: "Recovery key", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials?.handle !== "string" ||
          typeof credentials?.recoveryKey !== "string"
        ) {
          return null;
        }
        const handle = credentials.handle.trim();
        const key = credentials.recoveryKey.trim();
        if (handle.length < 2 || key.length < 32) return null;
        const { createHash } = await import("node:crypto");
        const ownerToken = `owner_${key}`;
        const ownerHash = createHash("sha256").update(ownerToken, "utf8").digest("hex");
        return {
          id: ownerHash,
          name: handle,
          email: `${handle}@launchlens.local`,
          ownerHash,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.ownerHash) {
        token.ownerHash = user.ownerHash;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.ownerHash) {
        session.ownerHash = token.ownerHash;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  trustHost: true,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
