import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",          type: "email" },
        password: { label: "Mot de passe",   type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            salesRepId: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) return null;

        const passwordOk = await compare(credentials.password, user.passwordHash);
        if (!passwordOk) return null;

        // Mise à jour asynchrone non-bloquante
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {});

        return {
          id:         user.id,
          email:      user.email,
          name:       user.name,
          role:       user.role,
          salesRepId: user.salesRepId,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role       = (user as { role: "ADMIN" | "COMMERCIAL" }).role;
        token.salesRepId = (user as { salesRepId: string | null }).salesRepId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id         = token.sub!;
        session.user.role       = token.role;
        session.user.salesRepId = token.salesRepId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/login",
    error:  "/admin/login",
  },
};
