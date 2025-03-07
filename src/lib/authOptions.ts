import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

declare module "next-auth" {
  interface Session {
    loginTimeStamp?: number;
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("Invalid username/password. Please try again");
          }

          const encodedHash = process.env.ADMIN_PASSWORD_HASH;
          if (!encodedHash || credentials.username.toLowerCase() !== process.env.ADMIN_USERNAME?.toLowerCase()) {
            throw new Error("Invalid username/password. Please try again");
          }
          const decodedHash = Buffer.from(encodedHash, 'base64').toString();
          const isValid = await bcrypt.compare(credentials.password, decodedHash);

          if (!isValid) {
            throw new Error("Invalid username/password. Please try again");
          }

          return {
            id: "1",
            name: "Iulian"
          };
        } catch (error) {
          if (error instanceof Error && !error.message.includes("Invalid username/password")) {
            throw new Error("Invalid username/password. Please try again");
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.loginTimeStamp = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      session.loginTimeStamp = token.loginTimeStamp as number;
      return session;
    },
  },
};