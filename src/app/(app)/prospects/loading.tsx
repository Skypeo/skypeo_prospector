export default function ProspectsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-28 rounded-xl skeleton mb-2" />
          <div className="h-4 w-24 rounded-xl skeleton" />
        </div>
        <div className="h-10 w-36 rounded-xl skeleton" />
      </div>
      <div className="flex gap-2 mb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-xl skeleton" />
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden glass">
        <div className="px-5 py-3.5 flex gap-8 border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 w-16 rounded skeleton" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex gap-8 border-b border-white/5">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 w-20 rounded-lg skeleton" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
