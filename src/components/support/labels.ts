export const categoryLabel: Record<string, string> = {
  PAYMENT: "Payment",
  ACCESS: "Course access",
  TECHNICAL: "Technical problem",
  CERTIFICATE: "Certificate",
  CERTIFICATE_NAME_CORRECTION: "Name on certificate",
  OTHER: "Something else",
};

/** Student-facing wording; staff see the same statuses with staff wording. */
export const statusLabel: Record<string, { student: string; staff: string; tone: string }> = {
  OPEN: { student: "Waiting for support", staff: "Open", tone: "border-primary/40 text-primary" },
  PENDING_USER: { student: "Reply needed from you", staff: "Waiting for student", tone: "border-warning/40 text-warning" },
  RESOLVED: { student: "Resolved", staff: "Resolved", tone: "border-success/40 text-success" },
  CLOSED: { student: "Closed", staff: "Closed", tone: "border-border text-muted-foreground" },
};

export const priorityLabel: Record<string, string> = { LOW: "Low", NORMAL: "Normal", HIGH: "High", URGENT: "Urgent" };
