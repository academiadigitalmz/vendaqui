import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { http } from "@/api/http";
import { Btn, ErrorState, Loading } from "@/components/ui";

interface ContentFile { id: string; originalName: string }
interface Content {
  product: { id: string; name: string; description: string };
  modules?: { id: string; title: string; lessons?: { id: string; title: string }[] }[];
  files?: ContentFile[];
}
const get = <T,>(path: string) => http<T>("GET", path, { envelope: true, credentials: "include" });
export default function PurchasedContent() {
  const { productId = "" } = useParams();
  const [lesson, setLesson] = useState("");
  const q = useQuery({ queryKey: ["purchased-content", productId], queryFn: () => get<Content>(`/me/products/${encodeURIComponent(productId)}/content`), retry: false });
  const playback = useQuery({ queryKey: ["purchased-playback", lesson], queryFn: () => get<{ url: string }>(`/me/lessons/${encodeURIComponent(lesson)}/playback`), enabled: !!lesson, retry: false });
  const download = useMutation({ mutationFn: (id: string) => get<{ url: string }>(`/me/products/${encodeURIComponent(productId)}/files/${encodeURIComponent(id)}/download`), onSuccess: r => { window.location.assign(r.url); } });
  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  return <main className="co-wrap stack-sm" style={{ paddingBlock: 32 }}><h1>{q.data.product.name}</h1><p>{q.data.product.description}</p>
    {q.data.modules?.map(m => <section className="co-box stack-sm" key={m.id}><h2>{m.title}</h2>{m.lessons?.map(l => <Btn key={l.id} onClick={() => setLesson(l.id)}>{l.title}</Btn>)}</section>)}
    {playback.isFetching && <Loading />}{playback.isError && <ErrorState error={playback.error} retry={() => playback.refetch()} />}
    {playback.data && !playback.isFetching && <video key={playback.data.url} src={playback.data.url} controls style={{ width: "100%" }} />}
    {q.data.files?.map(f => <Btn key={f.id} onClick={() => download.mutate(f.id)} loading={download.isPending}>Descarregar {f.originalName}</Btn>)}
    {download.isError && <ErrorState error={download.error} />}
  </main>;
}
