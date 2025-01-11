import { AuthOptions, Session } from "next-auth";
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
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("No credentials");
        }

        const { username, password } = credentials;

        if (username !== process.env.ADMIN_USERNAME) {
          throw new Error("Invalid username");
        }

        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!passwordHash) {
          throw new Error("Password hash is not defined");
        }

        const isValid = await bcrypt.compare(password, passwordHash);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Return user object on successful authentication
        return { id: "1", name: "Iulian" };
      },
    }),
  ],
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.loginTimeStamp = Date.now();
      }
      return token;
    },
    async session({session, token}) {
      session.loginTimeStamp = token.loginTimeStamp as number;
      return session;
    },
  },
};