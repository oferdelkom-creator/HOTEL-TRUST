export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-2xl font-bold tracking-tight text-brand ${className}`}>Гриша</span>
  );
}
