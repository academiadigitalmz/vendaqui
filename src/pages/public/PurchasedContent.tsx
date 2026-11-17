import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, type ContentFile, type CourseModule } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import { Icon } from "@/lib/icons";
import { Alert, Badge, Btn, Card, Empty, ErrorState, Loading, PageHead, Status, Tile } from "@/components/ui";

const fileSize = (bytes: number | null) => {
  if (!bytes) return "Tamanho não indicado";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const errorText = (error: unknown) => error instanceof HttpError
  ? error.body.message
  : "Não foi possível abrir o conteúdo. Tente novamente.";

export default function PurchasedContent() {
  const { productId = "" } = useParams();
  const [lessonId, setLessonId] = useState("");
  const content = useQuery({ queryKey: ["buyer", "content", productId], queryFn: () => api.buyer.productContent(productId), enabled: !!productId, retry: false });
  const library = useQuery({ queryKey: ["buyer", "library"], queryFn: api.buyer.library });
  const playback = useQuery({ queryKey: ["buyer", "playback", lessonId], queryFn: () => api.buyer.lessonPlayback(lessonId), enabled: !!lessonId, retry: false });
  const preview = useMutation({
    mutationFn: ({ fileId }: { fileId: string; reader: Window | null }) => api.buyer.productFileAccess(productId, fileId),
    onSuccess: ({ url }, { reader }) => { if (reader) reader.location.replace(url); else window.location.assign(url); },
    onError: (_error, { reader }) => reader?.close(),
  });
  const download = useMutation({ mutationFn: (fileId: string) => api.buyer.productFileDownload(productId, fileId), onSuccess: ({ url }) => window.location.assign(url) });

  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorState error={content.error} retry={() => content.refetch()} />;

  const product = content.data.product;
  const libraryItem = library.data?.items.find(item => item.productId === productId);
  const openFile = (fileId: string) => {
    const reader = window.open("about:blank", "_blank");
    if (reader) {
      reader.opener = null;
      reader.document.title = "A abrir ebook…";
      reader.document.body.textContent = "A abrir o ebook…";
    }
    preview.mutate({ fileId, reader });
  };

  return <>
    <Btn to="/aluno" v="link" icon="arrowl" className="purchased-back">Voltar aos meus produtos</Btn>
    <PageHead over={<Badge tone={product.type === "ebook" ? "green" : "blue"}>{product.type === "ebook" ? "Ebook" : "Curso"}</Badge>} title={product.name} desc={product.description} />
    {(preview.isError || download.isError) && <Alert tone="danger" icon="alert" title="Não foi possível aceder ao ficheiro" text={errorText(preview.error ?? download.error)} />}
    <div className="purchased-content-layout">
      <div className="stack-lg">
        {product.type === "ebook"
          ? <EbookFiles files={content.data.files ?? []} openingId={preview.isPending ? preview.variables?.fileId : undefined} downloadingId={download.isPending ? download.variables : undefined} onOpen={openFile} onDownload={fileId => download.mutate(fileId)} />
          : <CourseContent modules={content.data.modules ?? []} lessonId={lessonId} onOpen={setLessonId} />}
        {playback.isFetching && <Card><Loading /></Card>}
        {playback.isError && <ErrorState error={playback.error} retry={() => playback.refetch()} />}
        {playback.data && !playback.isFetching && <Card title="Aula" icon="play"><video className="purchased-video" key={playback.data.url} src={playback.data.url} controls /></Card>}
      </div>
      <aside><Card title="Sobre este produto" icon={product.type === "ebook" ? "book" : "cap"}>
        <div className={`purchased-product-cover ${product.type === "ebook" ? "is-ebook" : "is-course"}`}>{libraryItem?.coverUrl ? <img src={libraryItem.coverUrl} alt={`Capa de ${product.name}`} /> : <Icon name={product.type === "ebook" ? "book" : "cap"} size={42} />}</div>
        <div className="purchased-product-info"><Badge tone={product.type === "ebook" ? "green" : "blue"}>{product.type === "ebook" ? "Ebook" : "Curso"}</Badge><h2>{product.name}</h2>{libraryItem?.sellerName && <p>Por {libraryItem.sellerName}</p>}{libraryItem?.accessStatus && <Status s={libraryItem.accessStatus} />}</div>
      </Card></aside>
    </div>
  </>;
}

function EbookFiles({ files, openingId, downloadingId, onOpen, onDownload }: { files: ContentFile[]; openingId?: string; downloadingId?: string; onOpen: (fileId: string) => void; onDownload: (fileId: string) => void }) {
  return <Card title="Conteúdo do ebook" icon="book">{files.length ? <div className="purchased-files">{files.map(file => <div className="purchased-file" key={file.id}>
    <Tile icon="file" tone="red" s="lg" />
    <div className="purchased-file-info"><strong>{file.originalName}</strong><span>PDF · {fileSize(file.sizeBytes)}</span></div>
    <div className="purchased-file-actions"><Btn v="primary" icon="eye" loading={openingId === file.id} onClick={() => onOpen(file.id)}>Abrir ebook</Btn><Btn icon="download" loading={downloadingId === file.id} onClick={() => onDownload(file.id)}>Descarregar</Btn></div>
  </div>)}</div> : <Empty icon="book" title="Conteúdo indisponível" desc="Este ebook ainda não tem um ficheiro disponível. Contacte o suporte se o problema persistir." />}</Card>;
}

function CourseContent({ modules, lessonId, onOpen }: { modules: CourseModule[]; lessonId: string; onOpen: (id: string) => void }) {
  return <Card title="Conteúdo do curso" icon="cap">{modules.length ? <div className="course-content-list">{modules.map((module, moduleIndex) => <section className="course-module" key={module.id}>
    <div className="course-module-title"><span>{moduleIndex + 1}</span><strong>{module.title}</strong></div>
    {module.lessons?.length ? module.lessons.map(lesson => <div className="course-lesson" key={lesson.id}><div><strong>{lesson.title}</strong>{lesson.description && <small>{lesson.description}</small>}</div><Btn v={lessonId === lesson.id ? "primary" : "secondary"} icon="play" onClick={() => onOpen(lesson.id)}>{lessonId === lesson.id ? "Em reprodução" : "Ver aula"}</Btn></div>) : <p className="course-module-empty faint">Ainda não há aulas neste módulo.</p>}
  </section>)}</div> : <Empty icon="cap" title="Conteúdo indisponível" desc="Este curso ainda não tem aulas disponíveis." />}</Card>;
}
