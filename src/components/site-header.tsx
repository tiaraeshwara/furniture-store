"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function SiteHeader() {
  const { count } = useCart();
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Fieldroom home">
        <span className="wordmark-symbol" aria-hidden="true">
          f.
        </span>
        <span>
          FIELDROOM<small>FURNITURE FOR LIVING</small>
        </span>
      </Link>
      <nav className="header-nav" aria-label="Main navigation">
        <Link href="/#collection">Shop</Link>
        <Link href="/#about">Our approach</Link>
      </nav>
      <Link
        className="cart-link"
        href="/cart"
        aria-label={`Shopping bag, ${count} items`}
      >
        <ShoppingBag size={19} strokeWidth={1.7} />
        <span>Bag</span>
        <span className="cart-count">{count}</span>
      </Link>
    </header>
  );
}
