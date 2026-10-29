import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorState, Loading } from "./ui";

/** Mostra esqueleto enquanto carrega, erro com "tentar outra vez", e o conteúdo quando há dados. */
export function Data<T>({ q, children, rows }: { q: UseQueryResult<T>; children: (d: T) => ReactNode; rows?: number }) {
  if (q.isPending) return <Loading rows={rows} />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  return <>{children(q.data as T)}</>;
}
