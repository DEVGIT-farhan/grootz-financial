import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grootz | We Set The Standard of Excellence",
  description: "A modern financial guidance platform for investors, families, businesses and global Indians.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
