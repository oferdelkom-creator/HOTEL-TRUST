import Link from 'next/link';
import Logo from './Logo';
export default function Navbar(){return <header className="ht-header"><div className="ht-wrap"><Link href="/" aria-label="HotelTrust home"><Logo/></Link><nav aria-label="Main navigation"><Link href="/#how">How it works</Link><Link href="/demo">Workspace preview</Link><Link href="/owner">My hotel</Link><Link href="/login" className="ht-button">Sign in →</Link></nav></div></header>;}
