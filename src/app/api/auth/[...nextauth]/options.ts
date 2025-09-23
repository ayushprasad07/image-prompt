import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/model/Admin";
import redis from "@/lib/redis";

const SUPERADMIN_USERNAME = "superadmin";
// bcrypt hashed password for default superadmin
const SUPERADMIN_PASSWORD = "$2b$10$wWZlv6Q70mk118q17Ve.4OrQ8UC8O1RWm7CoJA/PvuFIh3TymRpEa";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();

        try {
          // ✅ Default hardcoded superadmin
          if (
            credentials.identifier === SUPERADMIN_USERNAME &&
            bcrypt.compareSync(credentials.password, SUPERADMIN_PASSWORD!)
          ) {
            return {
              _id: SUPERADMIN_USERNAME,
              username: SUPERADMIN_USERNAME,
              role: "superadmin",
            };
          }

          // ✅ Try Redis cache first
          const cachedUser = await redis.get(`admin:${credentials.identifier}`);
          if (cachedUser) {
            const user = JSON.parse(cachedUser);
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );
            if (isPasswordValid) {
              return {
                _id: user._id,
                username: user.username,
                role: user.role, // ✅ use role from DB (admin or superadmin)
              };
            }
          }

          // ✅ If not cached, query MongoDB
          const user = await Admin.findOne({ username: credentials.identifier });
          if (!user) throw new Error("Invalid credentials");

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordValid) throw new Error("Invalid credentials");

          // ✅ Cache user in Redis (TTL: 10 min)
          await redis.setex(
            `admin:${user.username}`,
            600,
            JSON.stringify({
              _id: user._id.toString(),
              username: user.username,
              password: user.password, // keep hashed password for compare
              role: user.role, // ✅ cache role as well
            })
          );

          return {
            _id: user._id.toString(),
            username: user.username,
            role: user.role, // ✅ role determines if they are admin or superadmin
          };
        } catch (error) {
          throw new Error("Authentication failed");
        }
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.username = token.username;
        session.user.role = token.role; // ✅ superadmin or admin
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id;
        token.username = user.username;
        token.role = user.role; // ✅ superadmin or admin
      }
      return token;
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
