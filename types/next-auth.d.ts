import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "COMMERCIAL";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "COMMERCIAL";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "ADMIN" | "COMMERCIAL";
  }
}
