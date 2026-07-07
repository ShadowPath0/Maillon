"use client";

import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { MissionListItem } from "@/lib/types";

const COLUMNS: { id: string; label: string }[] = [
  { id: "BRIEF_ENVOYE", label: "Brief envoyé" },
  { id: "EN_COURS", label: "En cours" },
  { id: "LIVRE", label: "Livré" },
  { id: "EN_VALIDATION", label: "En validation" },
  { id: "VALIDE", label: "Validé" },
  { id: "REJETE", label: "Rejeté" },
];

export function KanbanBoard({
  missions,
  onStatusChange,
}: {
  missions: MissionListItem[];
  onStatusChange: (missionId: string, statut: string) => void;
}) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const missionId = active.id as string;
    const newStatut = over.id as string;
    const mission = missions.find((m) => m.id === missionId);
    if (mission && mission.statut !== newStatut) {
      onStatusChange(missionId, newStatut);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.id} id={col.id} label={col.label} missions={missions.filter((m) => m.statut === col.id)} />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ id, label, missions }: { id: string; label: string; missions: MissionListItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[220px] flex-col gap-2 rounded-lg border bg-muted/40 p-2 transition-colors",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} <span className="text-muted-foreground/70">({missions.length})</span>
      </p>
      {missions.map((mission) => (
        <MissionCard key={mission.id} mission={mission} />
      ))}
    </div>
  );
}

function MissionCard({ mission }: { mission: MissionListItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: mission.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-md border bg-background p-2.5 text-sm shadow-sm transition-shadow hover:shadow active:cursor-grabbing"
    >
      <Link href={`/missions/${mission.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
        {mission.titre}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">{mission.sousTraitant?.nom ?? "Non assigné"}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/80">
        <CalendarDays className="size-3" />
        {formatDate(mission.dateEcheance)}
      </p>
    </div>
  );
}
