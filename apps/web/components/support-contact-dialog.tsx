"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function SupportContactDialog({ variant = "sidebar" }: { variant?: "sidebar" | "pill" }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const send = useMutation({
    mutationFn: () => apiClient.post("/support", { message }),
    onSuccess: () => {
      toast.success("Message envoyé, on te répond au plus vite.");
      setMessage("");
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Impossible d'envoyer le message."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            variant === "sidebar" && "w-full gap-2.5 rounded-md px-3 py-2 hover:bg-secondary/60",
            variant === "pill" && "rounded-md px-3 py-1.5 hover:bg-secondary/60",
          )}
        >
          <LifeBuoy className="size-4" />
          Contacter le support
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contacter le support</DialogTitle>
          <DialogDescription>
            Décris ton problème ou ta question, on te répond directement par email.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Ton message..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button disabled={message.trim().length < 5 || send.isPending} onClick={() => send.mutate()}>
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
