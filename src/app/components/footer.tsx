"use client"

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full p-4 flex justify-center bg-backgroundSlight">
      <Link href='/policy' className= "flex-1 flex justify-center">
        <div className="">
          <p>&copy; 2024 Locksmith4U. All rights reserved.</p>
        </div>
      </Link>
    </footer>
  );
};

