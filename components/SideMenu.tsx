'use client';
import { usePathname } from 'next/navigation';

export default function SideMenu({admin=false}:{admin?:boolean}){
 const pathname=usePathname();
 const items=admin?[
  ['/admin','Dashboard'],['/admin/customers','Customers'],['/admin/funding','Funding & Receipts'],['/admin/orders','Orders'],['/admin/products','Products'],['/admin/manual-payment','Manual Payment Account'],['/admin/site-contact','Site Contact']
 ]:[
  ['/account','Dashboard'],['/account/orders','Orders'],['/account/add-funds','Add Funds'],['/account/funding-history','Funding History'],['/account/profile','Account'],['/account/security','Security']
 ];
 return <details className="side-menu"><summary aria-label="Open menu">☰</summary><aside><div className="side-title">{admin?'Admin menu':'Customer menu'}</div>{items.map(([href,label])=><a className={pathname===href?'active':''} key={href} href={href}>{label}</a>)}<form action="/auth/signout" method="post"><button>Sign out</button></form></aside></details>;
}
