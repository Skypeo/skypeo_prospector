export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-7 w-32 rounded-xl skeleton mb-2" />
        <div className="h-4 w-48 rounded-xl skeleton" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 glass">
            <div className="w-10 h-10 rounded-xl skeleton mb-4" />
            <div className="h-8 w-16 rounded-xl skeleton mb-2" />
            <div className="h-4 w-32 rounded-xl skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
