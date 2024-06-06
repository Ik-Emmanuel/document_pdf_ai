import Link from "next/link";
import MaxWidthWrapper from "./MaxWidthWrapper";
import Image from "next/image";

const Navbar = () => {
  return (
    <nav
      className="sticky h-14 inset-x-0 top-0 z-30 w-full
     border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all"
    >
      <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image
              src={"/logoipsum-245.svg"}
              width={40}
              height={40}
              alt="logo"
            />
            <span className="font-bold text-xl  text-blue-900">DocInsight</span>
          </Link>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
