"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="site-footer" id="about">
      <Link href="/" className="footer-wordmark">
        FIELDROOM<span>FURNITURE FOR LIVING</span>
      </Link>
      <p>Thoughtful pieces for everyday rituals.</p>
      <span>© {new Date().getFullYear()} Fieldroom</span>
    </footer>
  );
}
