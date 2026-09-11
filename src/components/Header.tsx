"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Hamburger - mobile only */}
        <div className="relative md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-blue-700 rounded-md transition-colors"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {menuOpen && (
            <nav className="absolute top-full left-0 mt-1 w-56 bg-white text-gray-800 rounded-md shadow-lg z-50">
              <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100 rounded-t-md">Home</Link>
              <Link href="/wordle" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100">Wordle</Link>
              <Link href="/word-search" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100">Word Search</Link>
              <Link href="/word-lists" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100">Word Lists</Link>
              <Link href="/activities" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100">Activities</Link>
              <Link href="/about" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100">About</Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100 rounded-b-md">Settings</Link>
            </nav>
          )}
        </div>

        <h1 className="text-lg font-bold">Phoneme Activity Builder</h1>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/wordle" className="hover:underline">Wordle</Link>
          <Link href="/word-search" className="hover:underline">Word Search</Link>
          <Link href="/word-lists" className="hover:underline">Word Lists</Link>
          <Link href="/activities" className="hover:underline">Activities</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/settings" className="hover:underline">Settings</Link>
        </nav>
      </div>
    </header>
  );
}
