import type { Metadata } from "next";
import { CartDrawer } from "../components/cart/cart-drawer";
import { CartProvider } from "../components/cart/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CrossingTCG",
    template: "%s | CrossingTCG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
