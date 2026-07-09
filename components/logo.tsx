import Link from "next/link";
import { brand } from "@/lib/brand";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label={`${brand.name} home`}>
      <span className="logo-mark" aria-hidden="true"><img src="/brand/studio-booth-icon.svg" alt="" /></span>
      <span>{brand.name.toUpperCase()} <sup>®26</sup></span>
    </Link>
  );
}
