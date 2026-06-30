interface EditButtonProps {
          label: string; // accessible label, e.g. "Edit email"
          onClick: () => void;
}
             
// Generic small edit-action button reused across any editable profile field.
// Phase 1: only logs the intent. Phase 2: wire onClick to an actual edit form.
export default function EditButton({ label, onClick }: EditButtonProps) {
       return (
               <button
                   type="button"
                   onClick={onClick}
                   aria-label={label}
                   className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
               >
                   <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                     <path
                       d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
                       strokeLinecap="round"
                       strokeLinejoin="round"
                     />
                   </svg>
               </button>
              );
}