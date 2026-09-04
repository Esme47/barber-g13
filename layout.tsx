import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"BARBER G13",description:"Sistema profesional para barbería"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
