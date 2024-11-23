"use client"

import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <header className="p-6 bg-backgroundSlight">
      <div className="flex-1 flex items-start">
        <Link href="/admin/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Locksmith4U Logo"
            width={150}
            height={40}
            className="mr-3"
          />
        </Link>
      </div>
    </header>
  );
};

export default Header;
