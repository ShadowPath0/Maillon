"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const CONFIRM_WORD = "SUPPRIMER";

export function DeleteAccountDialog() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const deleteAccount = useMutation({
    mutationFn: () => apiClient.delete("/users/me"),
    onSuccess: () => {
      toast.success("Votre compte a été supprimé.");
      logout();
      router.push("/login");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Impossible de supprimer le compte."),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmText("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit border-destructive text-destructive hover:bg-destructive/10">
          Supprimer mon compte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer définitivement votre compte ?</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Vos informations personnelles seront anonymisées et vous ne pourrez plus
            vous connecter. L&apos;historique de vos missions et factures est conservé à des fins comptables et
            légales, sans donnée personnelle identifiable.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-delete">
            Tapez <span className="font-semibold">{CONFIRM_WORD}</span> pour confirmer
          </Label>
          <Input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={confirmText !== CONFIRM_WORD || deleteAccount.isPending}
            onClick={() => deleteAccount.mutate()}
          >
            Supprimer mon compte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
