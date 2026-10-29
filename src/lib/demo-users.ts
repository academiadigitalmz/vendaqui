import type { Role, User } from "@/api/types";

/** Utilizadores de demonstração usados em modo simulado. */
export const DEMO_USERS: Record<Role, User> = {
  seller: { id: "u1", name: "Ana Sitoe", email: "ana@excelcomaana.co.mz", phone: "+258 84 312 4471", role: "seller", business: { name: "Excel com a Ana", nuit: "400128765", kycStatus: "approved" } },
  admin: { id: "u2", name: "Rita Machava", email: "rita@vendaqui.co.mz", role: "admin" },
  student: { id: "u3", name: "Celso Matsinhe", email: "celso.matsinhe@gmail.com", phone: "+258 84 312 4471", role: "student" },
};
