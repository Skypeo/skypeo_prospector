export default function CampagnesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-32 rounded-xl skeleton mb-2" />
          <div className="h-4 w-24 rounded-xl skeleton" />
        </div>
        <div className="h-10 w-44 rounded-xl skeleton" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 glass flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl skeleton" />
              <div>
                <div className="h-4 w-40 rounded-lg skeleton mb-2" />
                <div className="h-3 w-32 rounded-lg skeleton" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-16 rounded-full skeleton" />
              <div className="h-8 w-28 rounded-xl skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
