import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, type ContentFile, type CourseLesson, type CourseModule } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import { Icon } from "@/lib/icons";
import {
  Alert,
  Badge,
  Btn,
  Card,
  Empty,
  ErrorState,
  Loading,
  PageHead,
  Status,
  Tile,
} from "@/components/ui";

const fileSize = (bytes: number | null) => {
  if (!bytes) return "Tamanho não indicado";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const errorText = (error: unknown) =>
  error instanceof HttpError
    ? error.body.message
    : "Não foi possível abrir o conteúdo. Tente novamente.";

const videoTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const value = Math.floor(seconds);
  const minutes = Math.floor(value / 60);
  const remaining = value % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

export default function PurchasedContent() {
  const { productId = "" } = useParams();
  const queryClient = useQueryClient();
  const video = useRef<HTMLVideoElement>(null);
  const lastSavedPosition = useRef(0);
  const restoredLessonId = useRef("");
  const [lessonId, setLessonId] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);

  const content = useQuery({
    queryKey: ["buyer", "content", productId],
    queryFn: () => api.buyer.productContent(productId),
    enabled: !!productId,
    retry: false,
  });
  const library = useQuery({ queryKey: ["buyer", "library"], queryFn: api.buyer.library });
  const modules = useMemo(() => content.data?.modules ?? [], [content.data?.modules]);
  const lessons = useMemo(() => modules.flatMap((module) => module.lessons ?? []), [modules]);
  const isCourse = content.data?.product.type === "course";
  const courseProgress = useQuery({
    queryKey: ["buyer", "course-progress", productId],
    queryFn: () => api.buyer.courseProgress(productId),
    enabled: !!productId && isCourse,
    retry: false,
  });
  const playback = useQuery({
    queryKey: ["buyer", "playback", lessonId],
    queryFn: () => api.buyer.lessonPlayback(lessonId),
    enabled: !!lessonId,
    retry: false,
  });
  const lessonProgress = useQuery({
    queryKey: ["buyer", "lesson-progress", lessonId],
    queryFn: async () => {
      try {
        return await api.buyer.lessonProgress(lessonId);
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: !!lessonId,
    retry: false,
  });
  const updateProgress = useMutation({
    mutationFn: ({
      currentLessonId,
      position,
      completed,
    }: {
      currentLessonId: string;
      position: number;
      completed: boolean;
    }) => api.buyer.updateProgress(currentLessonId, position, completed),
    onSuccess: (progress, variables) => {
      queryClient.setQueryData(["buyer", "lesson-progress", variables.currentLessonId], progress);
      if (variables.completed) {
        queryClient.invalidateQueries({ queryKey: ["buyer", "course-progress", productId] });
        queryClient.invalidateQueries({ queryKey: ["buyer", "library"] });
      }
    },
  });
  const preview = useMutation({
    mutationFn: ({ fileId }: { fileId: string; reader: Window | null }) =>
      api.buyer.productFileAccess(productId, fileId),
    onSuccess: ({ url }, { reader }) => {
      if (reader) reader.location.replace(url);
      else window.location.assign(url);
    },
    onError: (_error, { reader }) => reader?.close(),
  });
  const download = useMutation({
    mutationFn: (fileId: string) => api.buyer.productFileDownload(productId, fileId),
    onSuccess: ({ url }) => window.location.assign(url),
  });

  useEffect(() => {
    if (!isCourse || lessonId || !lessons.length || courseProgress.isFetching) return;
    const lastLesson = lessons.find((lesson) => lesson.id === courseProgress.data?.lastLessonId);
    setLessonId(lastLesson?.id ?? lessons[0].id);
  }, [courseProgress.data?.lastLessonId, courseProgress.isFetching, isCourse, lessonId, lessons]);

  useEffect(() => {
    setVideoDuration(0);
    setVideoPosition(0);
    lastSavedPosition.current = 0;
    restoredLessonId.current = "";
  }, [lessonId]);

  useEffect(() => {
    if (
      !lessonId ||
      !lessonProgress.isSuccess ||
      !playback.data ||
      restoredLessonId.current === lessonId
    ) {
      return;
    }
    const position = lessonProgress.data?.lastPositionSeconds ?? 0;
    setVideoPosition(position);
    lastSavedPosition.current = position;

    const player = video.current;
    if (!player) return;
    restoredLessonId.current = lessonId;
    if (!position) return;
    const resume = () => {
      if (Number.isFinite(player.duration) && position < player.duration - 2) {
        player.currentTime = position;
      }
    };
    if (player.readyState >= 1) resume();
    else player.addEventListener("loadedmetadata", resume, { once: true });
    return () => player.removeEventListener("loadedmetadata", resume);
  }, [lessonId, lessonProgress.data, lessonProgress.isSuccess, playback.data]);

  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorState error={content.error} retry={() => content.refetch()} />;

  const product = content.data.product;
  const libraryItem = library.data?.items.find((item) => item.productId === productId);
  const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);
  const selectedLessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const lessonVideoPercent = videoDuration
    ? Math.min(100, Math.round((videoPosition / videoDuration) * 100))
    : 0;
  const progressPercent = courseProgress.data?.progressPercent ?? libraryItem?.progressPercent ?? 0;
  const completedLessons =
    courseProgress.data?.completedLessons ?? libraryItem?.completedLessons ?? 0;
  const totalLessons =
    courseProgress.data?.totalLessons ?? libraryItem?.totalLessons ?? lessons.length;

  const openFile = (fileId: string) => {
    const reader = window.open("about:blank", "_blank");
    if (reader) {
      reader.opener = null;
      reader.document.title = "A abrir ebook…";
      reader.document.body.textContent = "A abrir o ebook…";
    }
    preview.mutate({ fileId, reader });
  };

  const persistProgress = (completed = false, force = false) => {
    const player = video.current;
    if (!player || !lessonId) return;
    const position = Math.max(0, Math.floor(player.currentTime));
    if (!force && Math.abs(position - lastSavedPosition.current) < 10) return;
    if (!force && updateProgress.isPending) return;
    lastSavedPosition.current = position;
    updateProgress.mutate({ currentLessonId: lessonId, position, completed });
  };

  const openLesson = (nextLessonId?: string) => {
    if (!nextLessonId || nextLessonId === lessonId) return;
    persistProgress(false, true);
    setLessonId(nextLessonId);
  };

  if (product.type === "ebook") {
    return (
      <>
        <Btn to="/aluno" v="link" icon="arrowl" className="purchased-back">
          Voltar aos meus produtos
        </Btn>
        <PageHead
          over={<Badge tone="green">Ebook</Badge>}
          title={product.name}
          desc={product.description}
        />
        {(preview.isError || download.isError) && (
          <Alert
            tone="danger"
            icon="alert"
            title="Não foi possível aceder ao ficheiro"
            text={errorText(preview.error ?? download.error)}
          />
        )}
        <div className="purchased-content-layout">
          <EbookFiles
            files={content.data.files ?? []}
            openingId={preview.isPending ? preview.variables?.fileId : undefined}
            downloadingId={download.isPending ? download.variables : undefined}
            onOpen={openFile}
            onDownload={(fileId) => download.mutate(fileId)}
          />
          <aside>
            <ProductSummary
              name={product.name}
              sellerName={libraryItem?.sellerName}
              accessStatus={libraryItem?.accessStatus}
              coverUrl={libraryItem?.coverUrl}
            />
          </aside>
        </div>
      </>
    );
  }

  return (
    <div className="learning-page">
      <div className="learning-topbar">
        <Btn to="/aluno" v="link" icon="arrowl">
          Voltar aos meus produtos
        </Btn>
      </div>

      <header className="learning-header">
        <div className="learning-heading">
          <Badge tone="blue">Curso</Badge>
          <h1>{product.name}</h1>
          <p>{libraryItem?.sellerName ? `Por ${libraryItem.sellerName}` : product.description}</p>
        </div>
        <div
          className="learning-course-progress"
          aria-label={`Progresso do curso: ${progressPercent}%`}
        >
          <div>
            <span>Progresso do curso</span>
            <strong>{progressPercent}%</strong>
          </div>
          <span className="learning-progress-track">
            <i style={{ width: `${progressPercent}%` }} />
          </span>
          <small>
            {completedLessons} de {totalLessons} aulas concluídas
          </small>
        </div>
      </header>

      <div className="learning-workspace">
        <main className="learning-main">
          <section className="learning-player" aria-label="Leitor da aula">
            {!selectedLesson ? (
              <div className="learning-player-message">
                <strong>Este curso ainda não tem aulas disponíveis.</strong>
              </div>
            ) : playback.isFetching ? (
              <div className="learning-player-message">A preparar a aula…</div>
            ) : playback.isError ? (
              <div className="learning-player-message">
                <strong>Não foi possível carregar esta aula.</strong>
                <Btn onClick={() => playback.refetch()}>Tentar novamente</Btn>
              </div>
            ) : playback.data ? (
              <video
                ref={video}
                className="learning-video"
                key={playback.data.url}
                src={playback.data.url}
                controls
                preload="metadata"
                onLoadedMetadata={(event) => setVideoDuration(event.currentTarget.duration)}
                onTimeUpdate={(event) => {
                  const position = Math.floor(event.currentTarget.currentTime);
                  setVideoPosition(position);
                  persistProgress(false);
                }}
                onPause={() => persistProgress(false, true)}
                onEnded={() => persistProgress(true, true)}
              />
            ) : null}
          </section>

          {selectedLesson && (
            <section className="learning-lesson-info">
              <div className="learning-lesson-copy">
                <span>
                  Aula {selectedLessonIndex + 1} de {lessons.length}
                  {videoDuration ? ` · ${videoTime(videoDuration)}` : ""}
                </span>
                <h2>{selectedLesson.title}</h2>
                {selectedLesson.description && <p>{selectedLesson.description}</p>}
              </div>
              <div className="learning-lesson-actions">
                <Btn
                  disabled={selectedLessonIndex <= 0}
                  onClick={() => openLesson(lessons[selectedLessonIndex - 1]?.id)}
                >
                  Anterior
                </Btn>
                <Btn
                  v="primary"
                  disabled={selectedLessonIndex < 0 || selectedLessonIndex >= lessons.length - 1}
                  onClick={() => openLesson(lessons[selectedLessonIndex + 1]?.id)}
                >
                  Próxima aula
                </Btn>
              </div>
            </section>
          )}
          {lessonProgress.isError && (
            <Alert
              tone="warning"
              title="O progresso desta aula não pôde ser recuperado"
              text="Pode continuar a assistir; voltaremos a tentar guardar a posição durante a reprodução."
            />
          )}
        </main>

        <CourseCurriculum
          modules={modules}
          lessonId={lessonId}
          lessonVideoPercent={lessonVideoPercent}
          currentLessonCompleted={!!lessonProgress.data?.completedAt}
          onOpen={openLesson}
        />
      </div>
    </div>
  );
}

function ProductSummary({
  name,
  sellerName,
  accessStatus,
  coverUrl,
}: {
  name: string;
  sellerName?: string;
  accessStatus?: string;
  coverUrl?: string;
}) {
  return (
    <Card title="Sobre este produto" icon="book">
      <div className="purchased-product-cover is-ebook">
        {coverUrl ? <img src={coverUrl} alt={`Capa de ${name}`} /> : <Icon name="book" size={42} />}
      </div>
      <div className="purchased-product-info">
        <Badge tone="green">Ebook</Badge>
        <h2>{name}</h2>
        {sellerName && <p>Por {sellerName}</p>}
        {accessStatus && <Status s={accessStatus} />}
      </div>
    </Card>
  );
}

function EbookFiles({
  files,
  openingId,
  downloadingId,
  onOpen,
  onDownload,
}: {
  files: ContentFile[];
  openingId?: string;
  downloadingId?: string;
  onOpen: (fileId: string) => void;
  onDownload: (fileId: string) => void;
}) {
  return (
    <Card title="Conteúdo do ebook" icon="book">
      {files.length ? (
        <div className="purchased-files">
          {files.map((file) => (
            <div className="purchased-file" key={file.id}>
              <Tile icon="file" tone="red" s="lg" />
              <div className="purchased-file-info">
                <strong>{file.originalName}</strong>
                <span>PDF · {fileSize(file.sizeBytes)}</span>
              </div>
              <div className="purchased-file-actions">
                <Btn
                  v="primary"
                  icon="eye"
                  loading={openingId === file.id}
                  onClick={() => onOpen(file.id)}
                >
                  Abrir ebook
                </Btn>
                <Btn
                  icon="download"
                  loading={downloadingId === file.id}
                  onClick={() => onDownload(file.id)}
                >
                  Descarregar
                </Btn>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="book"
          title="Conteúdo indisponível"
          desc="Este ebook ainda não tem um ficheiro disponível. Contacte o suporte se o problema persistir."
        />
      )}
    </Card>
  );
}

function CourseCurriculum({
  modules,
  lessonId,
  lessonVideoPercent,
  currentLessonCompleted,
  onOpen,
}: {
  modules: CourseModule[];
  lessonId: string;
  lessonVideoPercent: number;
  currentLessonCompleted: boolean;
  onOpen: (id: string) => void;
}) {
  const [closedModules, setClosedModules] = useState<Set<string>>(() => new Set());
  const orderedLessons = modules.flatMap((module) => module.lessons ?? []);
  const lessonCount = orderedLessons.length;

  const toggleModule = (moduleId: string) => {
    setClosedModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <aside className="learning-curriculum">
      <header>
        <div>
          <h2>Conteúdo do curso</h2>
          <span>{lessonCount} aulas</span>
        </div>
      </header>
      {modules.length ? (
        <div className="learning-modules">
          {modules.map((module, moduleIndex) => {
            const isOpen = !closedModules.has(module.id);
            return (
              <section className="learning-module" key={module.id}>
                <button
                  className="learning-module-toggle"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleModule(module.id)}
                >
                  <span>{moduleIndex + 1}</span>
                  <strong>{module.title}</strong>
                  <small>{module.lessons?.length ?? 0} aulas</small>
                  <Icon name="down" size={14} className={isOpen ? "is-open" : ""} />
                </button>
                {isOpen && (
                  <div className="learning-lessons">
                    {module.lessons?.length ? (
                      module.lessons.map((lesson: CourseLesson) => {
                        const lessonNumber =
                          orderedLessons.findIndex((item) => item.id === lesson.id) + 1;
                        const active = lesson.id === lessonId;
                        return (
                          <button
                            type="button"
                            className={`learning-lesson ${active ? "is-active" : ""}`}
                            key={lesson.id}
                            onClick={() => onOpen(lesson.id)}
                          >
                            <span className="learning-lesson-number">{lessonNumber}</span>
                            <span className="learning-lesson-title">
                              <strong>{lesson.title}</strong>
                              {lesson.description && <small>{lesson.description}</small>}
                              {active && lessonVideoPercent > 0 && (
                                <span className="learning-video-progress">
                                  <i style={{ width: `${lessonVideoPercent}%` }} />
                                </span>
                              )}
                            </span>
                            {active && (
                              <span className="learning-lesson-state">
                                {currentLessonCompleted ? "Concluída" : `${lessonVideoPercent}%`}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="learning-module-empty">Ainda não há aulas neste módulo.</p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="learning-curriculum-empty">Este curso ainda não tem aulas disponíveis.</div>
      )}
    </aside>
  );
}
