interface DetailField {
               label: string;
               value: string;
             }
             
interface DetailsModalProps {
               title: string;
               subtitle?: string;
               fields: DetailField[];
               onClose: () => void;
}
             
// Generic read-only details modal reused across Users, Artists, and
// Tickets. Callers supply the fields to display; this component only
// handles layout, keeping it reusable and free of domain-specific logic.
export default function DetailsModal({ title, subtitle, fields, onClose }: DetailsModalProps) {
         return (
                 <div
                   role="dialog"
                   aria-modal="true"
                   aria-labelledby="support-details-modal-title"
                   className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
                 >
                   <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                     <h2 id="support-details-modal-title" className="text-lg font-semibold text-white">
                       {title}
                     </h2>
                     {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
             
                     <dl className="mt-4 divide-y divide-zinc-800 border-t border-zinc-800">
                       {fields.map((field) => (
                         <div key={field.label} className="flex justify-between gap-4 py-2.5 text-sm">
                           <dt className="text-zinc-500">{field.label}</dt>
                           <dd className="text-right capitalize text-zinc-200">{field.value}</dd>
                         </div>
                       ))}
                     </dl>
             
                     <button
                       type="button"
                       onClick={onClose}
                       className="mt-5 w-full rounded-lg bg-white py-2 font-semibold text-black hover:bg-zinc-200"
                     >
                       Close
                     </button>
                   </div>
                 </div>
            );
}