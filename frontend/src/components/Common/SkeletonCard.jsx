// Carte squelette
// - État de chargement pour remplacer une carte de challenge
export default function SkeletonCard() {
  return (
    <div className="card bg-base-100 shadow w-full">
      <div className="px-4 pt-4">
        <div className="skeleton h-40 w-full"></div>
      </div>
      <div className="card-body">
        <div className="skeleton h-4 w-2/3"></div>
        <div className="skeleton h-4 w-1/3"></div>
        <div className="skeleton h-4 w-full"></div>
      </div>
    </div>
  );
}
