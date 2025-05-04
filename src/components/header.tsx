"use client"

import Image from "next/image";
import Link from "next/link";

export function Header(){
  return (
    <header className="p-6 border-b border-gray-300">
      <div className="flex-1 flex items-start">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Your Logo here"
            width={150}
            height={25}
            priority
            style = {{height: 'auto', width: 'auto'}}
            className="mr-3"
          />
        </Link>
      </div>
    </header>
  );
};

