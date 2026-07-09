import Link from "next/link";
import { brand } from "@/lib/brand";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label={`${brand.name} home`}>
      <span className="logo-mark" aria-hidden="true"><i /><i /><b /></span>
      <span>{brand.name.toUpperCase()} <sup>®26</sup></span>
    </Link>
  );
}
