import { SupportTicket, TicketStatus } from "@/types/support";
import StatusBadge from "./StatusBadge";

interface TicketQueueProps {
  tickets: SupportTicket[];
  onOpenTicket: (ticket: SupportTicket) => void;
}

const STATUS_TONE: Record<TicketStatus, "amber" | "blue" | "green"> = {
  open: "amber",
  answered: "blue",
  closed: "green",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  answered: "Answered",
  closed: "Closed",
};

// 11.2.1 — support tickets table. Clicking any row opens the chat-style
// reply panel (TicketChatModal) rather than a read-only details view, since
// staff need to be able to respond, not just inspect.
export default function TicketQueue({ tickets, onOpenTicket }: TicketQueueProps) {
  if (tickets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No support tickets in the queue right now.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Ticket ID</th>
            <th scope="col" className="px-4 py-3 font-medium">User</th>
            <th scope="col" className="px-4 py-3 font-medium">Subject</th>
            <th scope="col" className="px-4 py-3 font-medium">Sent Date</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => onOpenTicket(ticket)}
              className="cursor-pointer bg-zinc-950/40 hover:bg-zinc-900/60"
            >
              <td className="px-4 py-3 font-mono text-xs text-zinc-400">{ticket.id}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-white">{ticket.submittedByName}</p>
                <p className="text-xs capitalize text-zinc-500">{ticket.submittedByRole}</p>
              </td>
              <td className="px-4 py-3 text-zinc-200">{ticket.subject}</td>
              <td className="px-4 py-3 text-zinc-400">{ticket.createdDate}</td>
              <td className="px-4 py-3">
                <StatusBadge label={STATUS_LABEL[ticket.status]} tone={STATUS_TONE[ticket.status]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}