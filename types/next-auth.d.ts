import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    usertype?: string;
    id?: string;
  }

  interface Session {
    user?: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    usertype?: string;
    id?: string;
  }
}
