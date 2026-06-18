import "./globals.css";

export const metadata = {
  title: "SPELL — Socratic Programming Lab",
  description: "Socratic Programming & Educational Learning Lab",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#020204",
          color: "#e0e0e0",
        }}
      >
        {children}
      </body>
    </html>
  );
}
