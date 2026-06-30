interface StatCardProps {
        label: string;
        value: number;
}
             
// Reusable stat display for followers, following, and daily streams.
// Keeps number formatting consistent in one place.
export default function StatCard({ label, value }: StatCardProps) {
       return (
               <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-center">
                   <p className="text-xl font-bold text-white sm:text-2xl">
                     {value.toLocaleString()}
                   </p>
                   <p className="mt-1 text-xs text-zinc-400">{label}</p>
               </div>
              );
}