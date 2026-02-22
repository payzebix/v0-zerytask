export default function LoadingProfileMissions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-4 py-4 flex items-center justify-between z-10">
        <div className="w-8 h-8 rounded-lg bg-slate-700 animate-pulse" />
        <div className="flex-1 mx-4 h-6 bg-slate-700 rounded animate-pulse w-48" />
        <div className="w-8" />
      </div>

      {/* Profile Info Skeleton */}
      <div className="px-4 py-4 bg-slate-800/30 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-lg bg-slate-700 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-6 w-32 bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Missions Skeletons */}
      <div className="px-4 py-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse mb-2" />
                <div className="h-5 w-48 bg-slate-700 rounded animate-pulse mb-2" />
                <div className="h-3 w-full bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-700">
              <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
