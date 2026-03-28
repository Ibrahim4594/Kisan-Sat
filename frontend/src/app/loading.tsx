export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-base-black">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-satellite-green/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-satellite-green animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-electric-blue animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
        </div>
        <p className="text-sm text-muted-foreground font-mono animate-pulse">
          Initializing satellite link...
        </p>
      </div>
    </div>
  );
}
