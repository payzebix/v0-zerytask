import { Loader2 } from 'lucide-react'

export default function SignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading signup...</p>
      </div>
    </div>
  )
}
