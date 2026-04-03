import type { Metadata } from "next";
import { ConvexProvider } from "@/components/ConvexProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindCraft Reader — Local News For Your Neighborhood",
  description:
    "Hyperlocal newspapers delivered weekly. Real journalism for your community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ConvexProvider>{children}</ConvexProvider>
      </body>
    </html>
  );
}
