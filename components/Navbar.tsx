import Link from "next/link";
import MaxWidthWrapper from "./MaxWidthWrapper";
import Image from "next/image";
import { buttonVariants } from "./ui/button";
import {
  LoginLink,
  RegisterLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight, LogOut } from "lucide-react";

const Navbar = () => {
  return (
    <nav
      className="sticky h-14 inset-x-0 top-0 z-30 w-full
     border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all"
    >
      <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 z-40"
          >
            <Image
              src={"/logoipsum-245.svg"}
              width={40}
              height={40}
              alt="logo"
            />
            <span className="font-bold text-xl  text-blue-900">DocInsight</span>
          </Link>

          {/* add mobile navbar  */}
          <div className="hidden items-center space-x-4 sm:flex">
            <>
              <Link
                href="/pricing"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}
              >
                Pricing
              </Link>
              <LoginLink
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}
              >
                Sign in
              </LoginLink>
              <RegisterLink
                className={buttonVariants({
                  size: "sm",
                })}
              >
                Sign Up <ArrowRight className="h-5 w-5 ml-1.5" />
              </RegisterLink>

              <LogoutLink
                className={buttonVariants({
                  size: "sm",
                })}
              >
                Logout <LogOut className="h-5 w-5 ml-1.5" />
              </LogoutLink>
            </>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
