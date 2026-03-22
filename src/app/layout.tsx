import type { Metadata } from "next";
import { Toaster } from "sonner";

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
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
