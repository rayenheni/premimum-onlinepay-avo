import { siteContent } from "@/lib/site-content";

export const consultationStatuses: Record<string, string> = {
  awaiting_confirmation: "À confirmer",
  payment_pending: "Paiement en attente",
  payment_unavailable: "Paiement indisponible",
  paid: "Payé",
  confirmed: "RDV confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
  awaiting_verification: "À vérifier (virement / D17)",
};

// Payment completion is deliberately excluded: manual payments can only become paid via proof acceptance.
export const manualStatuses = ["awaiting_confirmation", "awaiting_verification", "confirmed", "completed", "cancelled"];

export const paymentMethods: Record<string, string> = {
  card: "Carte bancaire", edinar: "e-Dinar", konnect: "Wallet Konnect",
  bank_transfer: "Virement bancaire", d17: "D17 (La Poste)",
};
/** Methods that require a client-supplied reference and private receipt before the admin can verify payment. */
export const proofRequiredMethods = new Set(["bank_transfer", "d17"]);

export function serviceLabel(id: string) {
  const t = siteContent.fr;
  if (id === "general") return t.booking.general;
  return [...t.practice.groups, ...t.practice.areas].find((item) => item.id === id)?.title || id;
}

export function formatDate(date: Date) {
  return date.toLocaleString("fr-TN", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Tunis" });
}
