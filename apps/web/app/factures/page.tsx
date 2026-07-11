"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatMoney } from "@/lib/format";
import type { Invoice, PaginatedResult } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function InvoicesPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <InvoicesContent />
      </AppShell>
    </RequireAuth>
  );
}

function InvoicesContent() {
  const queryClient = useQueryClient();
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices-overview", statutFilter, page],
    queryFn: () =>
      apiClient.get<PaginatedResult<Invoice>>(
        `/factures?page=${page}${statutFilter !== "all" ? `&statut=${statutFilter}` : ""}`,
      ),
  });

  const markToPay = useMutation({
    mutationFn: ({ id, datePaiementPrevue }: { id: string; datePaiementPrevue: string }) =>
      apiClient.patch(`/factures/${id}/a-payer`, { datePaiementPrevue }),
    onSuccess: () => {
      toast.success("Facture marquée à payer.");
      queryClient.invalidateQueries({ queryKey: ["invoices-overview"] });
    },
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/factures/${id}/payee`),
    onSuccess: () => {
      toast.success("Facture marquée payée.");
      queryClient.invalidateQueries({ queryKey: ["invoices-overview"] });
    },
  });

  async function handleExport() {
    const csv = await apiClient.downloadText("/factures/export.csv");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "factures.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<Invoice>[] = [
    { key: "mission", label: "Mission", render: (i) => <span className="font-medium">{i.mission?.titre ?? "—"}</span> },
    { key: "sousTraitant", label: "Sous-traitant", render: (i) => i.sousTraitant?.nom ?? "—" },
    { key: "montant", label: "Montant", render: (i) => formatMoney(i.montant) },
    { key: "statut", label: "Statut", render: (i) => <StatusBadge status={i.statut} /> },
    { key: "dateReception", label: "Reçue le", render: (i) => formatDate(i.dateReception) },
    { key: "datePaiementPrevue", label: "Paiement prévu", render: (i) => formatDate(i.datePaiementPrevue) },
    {
      key: "actions",
      label: "Actions",
      render: (i) => (
        <div className="flex gap-2">
          {i.statut === "RECUE" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const date = window.prompt("Date de paiement prévue (AAAA-MM-JJ) ?");
                if (date) markToPay.mutate({ id: i.id, datePaiementPrevue: new Date(date).toISOString() });
              }}
            >
              À payer
            </Button>
          )}
          {(i.statut === "A_PAYER" || i.statut === "EN_RETARD") && (
            <Button size="sm" variant="outline" onClick={() => markPaid.mutate(i.id)}>
              Payée
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground">Suivez les paiements dus à vos sous-traitants.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Exporter en CSV
        </Button>
      </div>
      <Select
        value={statutFilter}
        onValueChange={(value) => {
          setStatutFilter(value);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="RECUE">Reçue</SelectItem>
          <SelectItem value="A_PAYER">À payer</SelectItem>
          <SelectItem value="PAYEE">Payée</SelectItem>
          <SelectItem value="EN_RETARD">En retard</SelectItem>
        </SelectContent>
      </Select>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <>
          <DataTable columns={columns} data={data?.data ?? []} />
          {data && (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
