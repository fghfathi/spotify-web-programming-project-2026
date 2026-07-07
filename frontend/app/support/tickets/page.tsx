"use client";

import { useState } from "react";
import { useSupportData } from "@/context/SupportDataContext";
import TicketQueue from "@/components/support/TicketQueue";
import TicketChatModal from "@/components/support/TicketChatModal";
import { SupportTicket } from "@/types/support";

export default function SupportTicketsPage() {
  const { tickets, sendTicketReply, closeTicket } = useSupportData();
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  // Re-derive the open ticket from live state each render so the chat modal
  // reflects new replies immediately after sending one.
  const openTicket: SupportTicket | undefined = tickets.find((t) => t.id === openTicketId);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Support Tickets</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {tickets.filter((t) => t.status !== "closed").length} pending of {tickets.length} total
        </p>
      </div>

      <TicketQueue tickets={tickets} onOpenTicket={(t) => setOpenTicketId(t.id)} />

      {openTicket && (
        <TicketChatModal
          ticket={openTicket}
          onSendReply={sendTicketReply}
          onCloseTicket={closeTicket}
          onDismiss={() => setOpenTicketId(null)}
        />
      )}
    </>
  );
}