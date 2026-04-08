import Link from "next/link";
import Image from "next/image";
import { HeaderCartLink } from "../cart/header-cart-link";
import { HeaderAccountSlot } from "./header-account-slot";
import { HeaderSearchTrigger } from "./header-search-trigger";

type SiteHeaderProps = {
  activePath?: "/" | "/catalog" | "/contact" | "/open-account";
  searchPlaceholder?: string;
  searchDefaultValue?: string;
};

export function SiteHeader({
  activePath,
  searchPlaceholder = "Search by Product Name / SKU / UPC",
  searchDefaultValue = "",
}: SiteHeaderProps) {
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/catalog", label: "Catalog" },
    { href: "/contact", label: "Contact" },
    { href: "/open-account", label: "Open an Account" },
  ] as const;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark">
            <Image
              alt="Crossing logo"
              className="brand-logo-image"
              height={48}
              priority
              src="/logo.png"
              width={48}
            />
          </div>
          <div>
            <div className="brand-title">Crossing</div>
          </div>
        </div>

        <div className="masthead">
          <nav aria-label="Primary" className="nav">
            {navItems.map((item) => (
              <Link
                className={item.href === activePath ? "nav-link active" : "nav-link"}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="topbar-actions">
          <HeaderSearchTrigger
            defaultValue={searchDefaultValue}
            placeholder={searchPlaceholder}
          />
          <HeaderAccountSlot />
          <HeaderCartLink />
        </div>
      </div>
    </header>
  );
}
