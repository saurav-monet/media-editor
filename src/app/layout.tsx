import type { Metadata } from "next";
import './globals.css';

export const metadata: Metadata = {
    title: "Media Editor",
    description:
        "Edit videos, images, and GIFs with ease. Adjust bitrate, orientation, and more.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-gray-50 text-gray-900">
                {children}
            </body>
        </html>
    );
}
