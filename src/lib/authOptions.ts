import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    loginTimeStamp?: number;
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, 
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

          if (credentials.username !== process.env.ADMIN_USERNAME) {
            throw new Error("Invalid username/password. Please try again");
          }

          if (credentials.password !== process.env.ADMIN_PASSWORD_HASH) {
            throw new Error("Invalid username/password. Please try again");
          }

          return {
            id: "1",
            name: "Admin",
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