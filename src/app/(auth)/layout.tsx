export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold">Mundial 2026</h1>
          <p className="text-muted-foreground text-sm mt-1">Polla Familiar</p>
        </div>
        {children}
      </div>
    </div>
  )
}
