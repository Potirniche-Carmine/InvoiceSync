"use client"
const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="w-full p-4 flex justify-center border-t border-gray-300">
        <div className="">
          <p>&copy; {currentYear} Your Company Name. All rights reserved.</p>
        </div>
    </footer>
  );
};