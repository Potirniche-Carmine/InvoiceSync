import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials || {};
        console.log("ENV PASSWORD HASH:", process.env.ADMIN_PASSWORD_HASH);

      
        // Validate input
        if (!username || !password) {
          throw new Error("Missing username or password");
        }
      
        // Validate username
        if (username !== process.env.ADMIN_USERNAME) {
          throw new Error("Invalid username");
        }
      
        // Validate password
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
      }      
    }),
  ],
  pages: {
    signIn: "/admin", // Custom sign-in page
  },
};

export default NextAuth(authOptions);
