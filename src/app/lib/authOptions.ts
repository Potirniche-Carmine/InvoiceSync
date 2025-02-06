import { AuthOptions} from "next-auth";
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
        console.log('Auth attempt starting');
        if (!credentials) {
          console.error('No credentials provided');
          throw new Error("No credentials");
        }
        const { username, password } = credentials;
        
        console.log('Checking username match');
        console.log('Provided username:', username);
        console.log('Expected username:', process.env.ADMIN_USERNAME);
        
        if (username !== process.env.ADMIN_USERNAME) {
          console.error('Username mismatch');
          throw new Error("Invalid username");
        }
      
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!passwordHash) {
          console.error('Password hash not found in env');
          throw new Error("Password hash is not defined");
        }
      
        console.log('Comparing passwords');
        try {
          const isValid = await bcrypt.compare(password, passwordHash);
          console.log('Password validation result:', isValid);
          if (!isValid) {
            throw new Error("Invalid password");
          }
        } catch (error) {
          console.error('Error during password comparison:', error);
          throw error;
        }
      
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