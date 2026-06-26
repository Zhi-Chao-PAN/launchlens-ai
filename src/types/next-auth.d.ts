import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    ownerHash?: string;
  }

  interface User {
    ownerHash?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    ownerHash?: string;
  }
}
