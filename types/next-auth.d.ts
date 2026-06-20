import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "COMMERCIAL";
      salesRepId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "COMMERCIAL";
    salesRepId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "ADMIN" | "COMMERCIAL";
    salesRepId: string | null;
  }
}
