import type { Metadata } from "next";
import { CartDrawer } from "../components/cart/cart-drawer";
import { CartProvider } from "../components/cart/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crossing",
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
