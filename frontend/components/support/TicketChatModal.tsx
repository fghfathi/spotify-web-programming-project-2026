"use client";

import { useState } from "react";
import { SupportTicket } from "@/types/support";
import StatusBadge from "./StatusBadge";

interface TicketChatModalProps {
  ticket: SupportTicket;
  onSendReply: (ticketId: string, message: string) => void;
  onCloseTicket: (ticketId: string) => void;
  onDismiss: () => void;
}

// 11.2.1 — chat-like detail panel for a single ticket: shows the original
// message plus the reply thread, and lets staff type + send a new reply.
export default function TicketChatModal({ ticket, onSendReply, onCloseTicket, onDismiss }: TicketChatModalProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSendReply(ticket.id, message.trim());
    setMessage("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-chat-modal-title"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="ticket-chat-modal-title" className="text-lg font-semibold text-white">
              {ticket.subject}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {ticket.submittedByName} ({ticket.submittedByRole}) · {ticket.createdDate} · {ticket.id}
            </p>
          </div>
          <StatusBadge
            label={ticket.status}
            tone={ticket.status === "open" ? "amber" : ticket.status === "answered" ? "blue" : "green"}
          />
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          {/* Original message, rendered as the first "user" bubble */}
          <div className="flex flex-col items-start">
            <span className="mb-1 text-xs text-zinc-500">{ticket.submittedByName}</span>
            <p className="max-w-[85%] rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100">
              {ticket.description}
            </p>
          </div>

          {ticket.replies.map((reply) => (
            <div key={reply.id} className="flex flex-col items-end">
              <span className="mb-1 text-xs text-zinc-500">{reply.authorName} (staff)</span>
              <p className="max-w-[85%] rounded-lg bg-emerald-500/90 px-3 py-2 text-sm text-black">
                {reply.message}
              </p>
            </div>
          ))}
        </div>

        {ticket.status !== "closed" && (
          <div className="mt-4">
            <label htmlFor="ticket-reply" className="sr-only">
              Type a reply
            </label>
            <textarea
              id="ticket-reply"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Type a reply..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-white"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex-1 rounded-lg bg-white py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send Reply
              </button>
              <button
                type="button"
                onClick={() => onCloseTicket(ticket.id)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Close Ticket
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}