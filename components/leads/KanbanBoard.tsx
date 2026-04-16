"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "./ScoreBadge";
import { formatILS } from "@/lib/formatters/currency";
import { timeAgo } from "@/lib/formatters/date";
import { updateLeadStatus } from "@/app/(app)/leads/actions";
import type { Lead, LeadStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const columns: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "חדש" },
  { id: "contacted", label: "נוצר קשר" },
  { id: "qualified", label: "עבר סינון" },
  { id: "viewing_scheduled", label: "צפייה נקבעה" },
  { id: "negotiating", label: "משא ומתן" },
  { id: "closed_won", label: "נסגר ✓" },
  { id: "closed_lost", label: "נסגר ✗" },
];

type LeadCardData = Pick<
  Lead,
  "id" | "full_name" | "phone" | "score" | "score_value" | "status" | "budget_min" | "budget_max" | "preferred_areas" | "mortgage_approved" | "last_contact_at"
>;

export function KanbanBoard({ initialLeads }: { initialLeads: LeadCardData[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id as LeadStatus | undefined;
    if (!overId) return;
    const leadId = String(e.active.id);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === overId) return;

    const prevStatus = lead.status;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, status: overId } : l)));

    startTransition(async () => {
      const res = await updateLeadStatus(leadId, overId);
      if (res?.error) {
        toast.error("עדכון נכשל");
        setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, status: prevStatus } : l)));
      }
    });
  }

  const active = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-3 overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))` }}>
        {columns.map((col) => (
          <Column key={col.id} id={col.id} label={col.label} leads={leads.filter((l) => l.status === col.id)} />
        ))}
      </div>
      <DragOverlay>{active ? <Card lead={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function Column({ id, label, leads }: { id: LeadStatus; label: string; leads: LeadCardData[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn("bg-muted/40 rounded-lg p-2 min-h-[300px] transition-colors", isOver && "bg-brand/10")}>
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>
      <div className="space-y-2">
        {leads.map((lead) => <Card key={lead.id} lead={lead} />)}
      </div>
    </div>
  );
}

function Card({ lead, dragging }: { lead: LeadCardData; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-card border border-border rounded-md p-4 space-y-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md-hover transition-all duration-200",
        (isDragging || dragging) && "opacity-60 shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/leads/${lead.id}`} className="text-h3 font-semibold hover:text-brand transition-colors truncate flex-1" onClick={(e) => e.stopPropagation()}>
          {lead.full_name}
        </Link>
        <ScoreBadge tier={lead.score} />
      </div>
      {lead.budget_min && lead.budget_max && (
        <div className="text-base font-bold text-brand ltr">{formatILS(lead.budget_min)} – {formatILS(lead.budget_max)}</div>
      )}
      <div className="text-xs text-muted-foreground space-y-1">
        {lead.preferred_areas?.length > 0 && <div className="truncate">{lead.preferred_areas.join(", ")}</div>}
        {lead.mortgage_approved && <Badge variant="emerald" size="sm">אושר משכנתא</Badge>}
        {lead.last_contact_at && <div>קשר אחרון: {timeAgo(lead.last_contact_at)}</div>}
      </div>
    </div>
  );
}
