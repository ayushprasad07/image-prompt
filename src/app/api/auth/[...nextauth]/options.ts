// src/app/api/auth/[...nextauth]/options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/model/Admin";
import SuperAdmin from "@/model/SuperAdmin";
import redis from "@/lib/redis";

const DEFAULT_SUPERADMIN_USERNAME = "superadmin";
const DEFAULT_SUPERADMIN_PASSWORD = "$2b$10$wWZlv6Q70mk118q17Ve.4OrQ8UC8O1RWm7CoJA/PvuFIh3TymRpEa"; // bcrypt hashed

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
        const { identifier, password } = credentials;
        await dbConnect();

        // ✅ Try Redis cache first
        const cached = await redis.get(`user:${identifier}`);
        if (cached) {
          const cachedUser = JSON.parse(cached);
          const isValid = await bcrypt.compare(password, cachedUser.password);
          if (isValid) return cachedUser;
        }

        // ✅ Try SuperAdmin collection (username may have changed)
        const superAdmin = await SuperAdmin.findOne({ username: identifier });
        if (superAdmin) {
          const isValid = await bcrypt.compare(password, superAdmin.password);
          if (isValid) {
            const userData = {
              _id: superAdmin._id.toString(),
              username: superAdmin.username,
              role: "superadmin",
              password: superAdmin.password, // hashed
            };
            // Cache for 10 min
            await redis.setex(`user:${superAdmin.username}`, 600, JSON.stringify(userData));
            return userData;
          }
        }

        // ✅ Fallback: default hardcoded superadmin (if DB not updated yet)
        if (
          identifier === DEFAULT_SUPERADMIN_USERNAME &&
          bcrypt.compareSync(password, DEFAULT_SUPERADMIN_PASSWORD)
        ) {
          const userData = {
            _id: "default-superadmin",
            username: DEFAULT_SUPERADMIN_USERNAME,
            role: "superadmin",
            password: DEFAULT_SUPERADMIN_PASSWORD,
          };
          await redis.setex(`user:${DEFAULT_SUPERADMIN_USERNAME}`, 600, JSON.stringify(userData));
          return userData;
        }

        // ✅ Finally, check Admin collection
        const admin = await Admin.findOne({ username: identifier });
        if (admin) {
          const isValid = await bcrypt.compare(password, admin.password);
          if (isValid) {
            const userData = {
              _id: admin._id.toString(),
              username: admin.username,
              role: admin.role,
              password: admin.password,
            };
            await redis.setex(`user:${admin.username}`, 600, JSON.stringify(userData));
            return userData;
          }
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id;
        token.username = user.username;
        token.role = user.role;
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
