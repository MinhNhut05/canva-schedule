import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SileTravel",
  description: "SOHA Travel - Tour Program to Canva Design",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
