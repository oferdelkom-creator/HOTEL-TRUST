import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Hotel Trust"
      width={736}
      height={474}
      priority
      className={`h-10 w-auto ${className}`}
    />
  );
}
