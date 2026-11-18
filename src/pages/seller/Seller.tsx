import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  uploadLessonFile,
  uploadProductCover,
  uploadProductFile,
  uploadVerificationDocument,
  type ContentFile,
  type ProductInput,
  type SellerProfileInput,
} from "@/api/endpoints";
import { HttpError } from "@/api/http";
import { useApp } from "@/lib/app-state";
import { int, mt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import {
  Alert,
  Avatar,
  Badge,
  Btn,
  Card,
  Empty,
  ErrorState,
  Field,
  FileUpload,
  Input,
  Kpi,
  Loading,
  PageHead,
  Select,
  Status,
  Table,
  Textarea,
  Tile,
} from "@/components/ui";
import { Drawer, Modal } from "@/components/overlay";

const errorText = (error: unknown) =>
  error instanceof HttpError
    ? error.message
    : "Não foi possível concluir. Verifique a ligação e tente novamente.";

const productErrorText = (error: unknown) => {
  if (!(error instanceof HttpError)) return errorText(error);

  if (error.body.message !== "Os dados fornecidos são inválidos.") return error.body.message;

  switch (error.body.details?.field) {
    case "name":
      return "O nome do produto deve ter entre 3 e 180 caracteres.";
    case "description":
      return "A descrição do produto é obrigatória e deve ter no máximo 10.000 caracteres.";
    case "categoryId":
      return "Seleccione uma categoria activa para o produto.";
    case "priceAmount":
      return "Defina um preço válido, superior a 0 MT.";
    case "guaranteeDays":
      return "Escolha 0, 7, 15 ou 30 dias de garantia.";
    default:
      return error.body.message;
  }
};

const productErrorTitle = (error: unknown) => {
  if (!(error instanceof HttpError)) return "Não foi possível criar o produto";

  const fileErrorCodes = new Set([
    "invalid_file_name",
    "empty_file",
    "unsupported_file_type",
    "file_too_large",
    "file_extension_mismatch",
    "upload_failed",
    "upload_cancelled",
  ]);

  return fileErrorCodes.has(error.body.code)
    ? "Não foi possível enviar o ficheiro"
    : "Não foi possível criar o produto";
};
const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";
const fileSize = (value?: number | null) => {
  if (!value) return "Tamanho indisponível";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toLocaleString("pt-MZ", { maximumFractionDigits: 1 })} MB`;
};
const verificationStatus = (value: { status?: string }) => value.status ?? "draft";
const payoutStorageKey = "vq.payout.operation";
type PayoutOperation = {
  key: string;
  body: { payoutAccountId: string; amount: number; type: string };
};
const readPayoutOperation = (): PayoutOperation | null => {
  try {
    return JSON.parse(sessionStorage.getItem(payoutStorageKey) || "null");
  } catch {
    return null;
  }
};
const storePayoutOperation = (operation: PayoutOperation | null) => {
  if (operation) sessionStorage.setItem(payoutStorageKey, JSON.stringify(operation));
  else sessionStorage.removeItem(payoutStorageKey);
};

export function SellerSetup() {
  const { session, signIn } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState<SellerProfileInput>({
    displayName: "",
    bio: "",
    businessType: "individual",
    businessName: "",
    nuit: "",
    supportEmail: session?.user.email ?? "",
    whatsapp: session?.user.phone ?? "",
  });
  const save = useMutation({
    mutationFn: () => api.seller.createProfile(form),
    onSuccess: (profile) => {
      if (session)
        signIn({
          ...session,
          user: {
            ...session.user,
            role: "seller",
            business: { name: profile.displayName, nuit: profile.nuit, kycStatus: "not_started" },
          },
        });
      navigate("/produtor/verificacao", { replace: true });
    },
  });
  const set =
    (field: keyof SellerProfileInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <main className="lp-wrap stack" style={{ paddingBlock: 32 }}>
      <PageHead
        title="Configurar perfil de produtor"
        desc="Complete os dados do seu negócio. Depois deste passo poderá enviar os documentos para verificação."
      />
      <Card title="Dados comerciais">
        <form
          className="stack-sm"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Nome público">
            <Input value={form.displayName} onChange={set("displayName")} required />
          </Field>
          <Field label="Tipo">
            <Select
              value={form.businessType}
              onChange={set("businessType")}
              options={[
                ["individual", "Pessoa singular"],
                ["company", "Empresa"],
              ]}
            />
          </Field>
          {form.businessType === "company" && (
            <Field label="Nome legal da empresa">
              <Input value={form.businessName} onChange={set("businessName")} required />
            </Field>
          )}
          <Field label="NUIT">
            <Input
              value={form.nuit}
              onChange={set("nuit")}
              inputMode="numeric"
              pattern="[0-9]{9,12}"
            />
          </Field>
          <Field label="Email de suporte">
            <Input type="email" value={form.supportEmail} onChange={set("supportEmail")} />
          </Field>
          <Field label="WhatsApp" help="Formato internacional, por exemplo +258841234567.">
            <Input value={form.whatsapp} onChange={set("whatsapp")} />
          </Field>
          <Field label="Apresentação">
            <Textarea value={form.bio} onChange={set("bio")} />
          </Field>
          {save.isError && (
            <Alert
              tone="danger"
              title="Não foi possível criar o perfil"
              text={errorText(save.error)}
            />
          )}
          <Btn type="submit" v="primary" loading={save.isPending}>
            Guardar e continuar
          </Btn>
        </form>
      </Card>
    </main>
  );
}

export function SellerOverview() {
  const products = useQuery({
    queryKey: ["seller", "products"],
    queryFn: () => api.seller.products(),
  });
  const orders = useQuery({ queryKey: ["seller", "orders"], queryFn: () => api.seller.orders() });
  const balance = useQuery({ queryKey: ["seller", "balance"], queryFn: api.seller.balance });
  const reporting = useQuery({
    queryKey: ["seller", "reporting", "overview"],
    queryFn: api.seller.reportingOverview,
  });
  if (products.isPending || orders.isPending || balance.isPending || reporting.isPending)
    return <Loading />;
  if (products.isError || orders.isError || balance.isError || reporting.isError)
    return (
      <ErrorState error={products.error ?? orders.error ?? balance.error ?? reporting.error} />
    );

  const revenueSeries = reporting.data.series.map((point) => point.netRevenue);
  const salesSeries = reporting.data.series.map((point) => point.approvedSales);
  return (
    <>
      <div className="welcome">
        <div>
          <h1>Painel</h1>
          <p className="muted">Acompanhe produtos, vendas e valores disponíveis.</p>
        </div>
      </div>
      <div className="g4">
        <Kpi
          label="Faturamento líquido"
          value={mt(reporting.data.netRevenue.value)}
          delta={reporting.data.netRevenue.changePercent ?? undefined}
          hint="30 dias · já sem taxas"
          spark={revenueSeries}
        />
        <Kpi
          label="Vendas aprovadas"
          value={int(reporting.data.approvedSales.value)}
          delta={reporting.data.approvedSales.changePercent ?? undefined}
          hint="Últimos 30 dias"
          spark={salesSeries}
        />
        <Kpi
          label="Ticket médio"
          value={mt(reporting.data.averageTicket.value)}
          delta={reporting.data.averageTicket.changePercent ?? undefined}
          hint="Por venda aprovada"
        />
        <Kpi label="Produtos" value={int(products.data.total)} hint="Total no catálogo" />
      </div>
      <div className="g-main">
        <Card title="Encomendas recentes">
          {orders.data.items.length ? (
            <OrderTable rows={orders.data.items.slice(0, 8)} />
          ) : (
            <Empty
              icon="receipt"
              title="Ainda não existem encomendas"
              desc="As vendas confirmadas aparecerão aqui."
            />
          )}
        </Card>
        <section className="balance-card">
          <div>
            <small>Saldo disponível</small>
            <div className="big">{mt(balance.data.available)}</div>
          </div>
          <div className="balance-split">
            <div>
              <small>Pendente</small>
              <b>{mt(balance.data.pending)}</b>
            </div>
            <div>
              <small>Em trânsito</small>
              <b>{mt(balance.data.payoutInTransit)}</b>
            </div>
          </div>
          <Btn to="/produtor/financeiro">Ver financeiro</Btn>
        </section>
      </div>
    </>
  );
}

export function SellerProducts() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["seller", "products"],
    queryFn: () => api.seller.products(),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  return (
    <>
      <PageHead
        title="Produtos"
        desc="Cursos e ebooks, desde o rascunho até à publicação."
        actions={
          <Btn to="/produtor/produtos/novo" v="primary">
            Novo produto
          </Btn>
        }
      />
      {query.data.items.length ? (
        <div className="pgrid">
          {query.data.items.map((product) => (
            <button
              type="button"
              className="pcard"
              key={product.id}
              onClick={() => navigate(`/produtor/produtos/${product.id}`)}
            >
              <div className={`pcard-head ${product.type === "course" ? "cv-blue" : "cv-green"}`}>
                <span className="pcard-type">
                  <Icon name={product.type === "course" ? "cap" : "file"} size={14} />
                  {product.type === "course" ? "Curso" : "Ebook"}
                </span>
                <h4>{product.name}</h4>
              </div>
              <div className="pcard-body">
                <Status s={product.status} />
                <div className="pcard-stats">
                  <div>
                    <small>Preço</small>
                    <b>{mt(product.defaultOffer?.priceAmount ?? 0)}</b>
                  </div>
                  <div>
                    <small>Tipo</small>
                    <b>{product.type === "course" ? "Curso" : "Ebook"}</b>
                  </div>
                  <div>
                    <small>Criado</small>
                    <b>{date(product.createdAt).split(",")[0]}</b>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            icon="package"
            title="Ainda não criou produtos"
            desc="Crie um curso em vídeo ou publique um ebook."
            action={
              <Btn to="/produtor/produtos/novo" v="primary">
                Criar produto
              </Btn>
            }
          />
        </Card>
      )}
    </>
  );
}

type CourseLessonDraft = {
  key: string;
  title: string;
  description: string;
  video: File | null;
  progress: number | null;
};
type CourseModuleDraft = { key: string; title: string; lessons: CourseLessonDraft[] };

const productSteps = [
  "Formato",
  "Detalhes e capa",
  "Preço e garantia",
  "Conteúdo",
  "Rever e submeter",
];
const newLessonDraft = (): CourseLessonDraft => ({
  key: crypto.randomUUID(),
  title: "",
  description: "",
  video: null,
  progress: null,
});
const newModuleDraft = (): CourseModuleDraft => ({
  key: crypto.randomUUID(),
  title: "",
  lessons: [newLessonDraft()],
});

export function NewProduct() {
  const navigate = useNavigate();
  const categoryList = useQuery({
    queryKey: ["public", "categories"],
    queryFn: () => api.catalog.categories(),
  });
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProductInput>({
    categoryId: "",
    type: "ebook",
    name: "",
    description: "",
    guaranteeDays: 7,
    priceAmount: 0,
  });
  const [content, setContent] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [contentProgress, setContentProgress] = useState<number | null>(null);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModuleDraft[]>(() => [newModuleDraft()]);
  const [stepError, setStepError] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const coverUploaded = useRef<File | null>(null);
  const ebookUploaded = useRef<{ file: File; id: string } | null>(null);
  const createdModules = useRef<Record<string, string>>({});
  const createdLessons = useRef<Record<string, string>>({});
  const uploadedLessons = useRef<Set<string>>(new Set());

  const setLessonProgress = (moduleKey: string, lessonKey: string, progress: number | null) =>
    setCourseModules((current) =>
      current.map((module) =>
        module.key === moduleKey
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.key === lessonKey ? { ...lesson, progress } : lesson,
              ),
            }
          : module,
      ),
    );

  const create = useMutation({
    mutationFn: async () => {
      if (form.type === "ebook" && !content) throw new Error("Seleccione o ficheiro do ebook.");
      let productId = draftId;
      if (!productId) {
        const product = await api.seller.createProduct(form);
        productId = product.id;
        setDraftId(productId);
      } else {
        await api.seller.updateProduct(productId, form);
      }
      if (cover && coverUploaded.current !== cover) {
        setCoverProgress(0);
        try {
          await uploadProductCover(productId, cover, setCoverProgress);
          coverUploaded.current = cover;
        } catch (error) {
          setCoverProgress(null);
          throw error;
        }
      }
      if (form.type === "ebook" && content) {
        if (ebookUploaded.current?.file !== content) {
          if (ebookUploaded.current) {
            await api.seller.detachFile(productId, ebookUploaded.current.id);
            await api.seller.deleteFile(ebookUploaded.current.id);
          }
          setContentProgress(0);
          try {
            const fileId = await uploadProductFile(productId, content, setContentProgress);
            ebookUploaded.current = { file: content, id: fileId };
          } catch (error) {
            setContentProgress(null);
            throw error;
          }
        }
      }
      if (form.type === "course") {
        for (const [moduleIndex, module] of courseModules.entries()) {
          let moduleId = createdModules.current[module.key];
          if (!moduleId) {
            const created = await api.seller.createModule(
              productId,
              module.title.trim(),
              moduleIndex + 1,
            );
            moduleId = created.id;
            createdModules.current[module.key] = moduleId;
          }
          for (const [lessonIndex, lesson] of module.lessons.entries()) {
            let lessonId = createdLessons.current[lesson.key];
            if (!lessonId) {
              const created = await api.seller.createLesson(moduleId, {
                title: lesson.title.trim(),
                description: lesson.description.trim(),
                position: lessonIndex + 1,
                isPreview: false,
                releaseAfterDays: 0,
              });
              lessonId = created.id;
              createdLessons.current[lesson.key] = lessonId;
            }
            if (!uploadedLessons.current.has(lesson.key) && lesson.video) {
              setLessonProgress(module.key, lesson.key, 0);
              try {
                await uploadLessonFile(lessonId, lesson.video, "video", (progress) =>
                  setLessonProgress(module.key, lesson.key, progress),
                );
                uploadedLessons.current.add(lesson.key);
              } catch (error) {
                setLessonProgress(module.key, lesson.key, null);
                throw error;
              }
            }
          }
        }
      }
      await api.seller.submitProduct(productId);
      return productId;
    },
    onError: (error) => {
      if (!(error instanceof HttpError)) return;

      const targetStepByField: Record<string, number> = {
        name: 1,
        description: 1,
        categoryId: 1,
        priceAmount: 2,
        guaranteeDays: 2,
      };
      const targetStep = targetStepByField[error.body.details?.field ?? ""];
      if (targetStep !== undefined) setStep(targetStep);
    },
    onSuccess: (productId) => navigate(`/produtor/produtos/${productId}`, { replace: true }),
  });
  const set =
    (field: keyof ProductInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({
        ...current,
        [field]:
          field === "priceAmount" || field === "guaranteeDays"
            ? Number(event.target.value)
            : event.target.value,
      }));

  const validateStep = (index: number) => {
    if (index === 1 && (!form.categoryId || !form.name.trim() || !form.description.trim()))
      return "Preencha a categoria, o nome e a descrição do produto.";
    if (index === 2 && (!Number.isFinite(form.priceAmount) || form.priceAmount < 1))
      return "Defina um preço válido, a partir de 1 MT.";
    if (index === 2 && (form.guaranteeDays == null || ![0, 7, 15, 30].includes(form.guaranteeDays)))
      return "Escolha 0, 7, 15 ou 30 dias de garantia.";
    if (index === 3 && form.type === "ebook" && !content)
      return "Adicione o ficheiro PDF do ebook.";
    if (index === 3 && form.type === "course") {
      if (!courseModules.length) return "Adicione pelo menos um módulo ao curso.";
      if (courseModules.some((module) => !module.title.trim()))
        return "Dê um título a todos os módulos.";
      if (courseModules.some((module) => !module.lessons.length))
        return "Cada módulo deve ter pelo menos uma aula.";
      if (
        courseModules.some((module) =>
          module.lessons.some((lesson) => !lesson.title.trim() || !lesson.video),
        )
      )
        return "Todas as aulas precisam de título e vídeo.";
    }
    return "";
  };
  const advance = () => {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError("");
    setStep((current) => Math.min(productSteps.length - 1, current + 1));
  };
  const goBack = () => {
    create.reset();
    setStepError("");
    setStep((current) => Math.max(0, current - 1));
  };
  const submit = () => {
    for (let index = 1; index <= 3; index += 1) {
      const error = validateStep(index);
      if (error) {
        setStep(index);
        setStepError(error);
        return;
      }
    }
    setStepError("");
    create.mutate();
  };
  const updateModule = (moduleKey: string, title: string) =>
    setCourseModules((current) =>
      current.map((module) => (module.key === moduleKey ? { ...module, title } : module)),
    );
  const updateLesson = (moduleKey: string, lessonKey: string, patch: Partial<CourseLessonDraft>) =>
    setCourseModules((current) =>
      current.map((module) =>
        module.key === moduleKey
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.key === lessonKey ? { ...lesson, ...patch } : lesson,
              ),
            }
          : module,
      ),
    );
  const removeLesson = (moduleKey: string, lessonKey: string) =>
    setCourseModules((current) =>
      current.map((module) =>
        module.key === moduleKey
          ? { ...module, lessons: module.lessons.filter((lesson) => lesson.key !== lessonKey) }
          : module,
      ),
    );
  const selectedCategory =
    categoryList.data?.find((category) => category.id === form.categoryId)?.name ?? "—";
  const lessonCount = courseModules.reduce((total, module) => total + module.lessons.length, 0);

  if (categoryList.isPending) return <Loading />;
  if (categoryList.isError)
    return <ErrorState error={categoryList.error} retry={() => categoryList.refetch()} />;

  let body: React.ReactNode;
  if (step === 0)
    body = (
      <div className="choice-grid product-format-grid">
        <button
          type="button"
          className={`choice ${form.type === "course" ? "on" : ""}`}
          onClick={() => setForm((current) => ({ ...current, type: "course" }))}
        >
          <Icon name="cap" size={22} />
          <b>Curso</b>
          <small>Módulos com aulas em vídeo, disponíveis na área do comprador.</small>
        </button>
        <button
          type="button"
          className={`choice ${form.type === "ebook" ? "on" : ""}`}
          onClick={() => setForm((current) => ({ ...current, type: "ebook" }))}
        >
          <Icon name="file" size={22} />
          <b>Ebook</b>
          <small>Um ficheiro PDF disponibilizado depois da compra.</small>
        </button>
      </div>
    );
  else if (step === 1)
    body = (
      <div className="stack-sm">
        <div className="g2">
          <Field label="Nome do produto" req>
            <Input value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Categoria" req>
            <Select
              value={form.categoryId}
              onChange={set("categoryId")}
              options={[
                ["", "Seleccione uma categoria"],
                ...categoryList.data.map(
                  (category) => [category.id, category.name] as [string, string],
                ),
              ]}
            />
          </Field>
        </div>
        <Field label="Descrição" req>
          <Textarea rows={5} value={form.description} onChange={set("description")} />
        </Field>
        <Field label="Capa (opcional)">
          <FileUpload
            value={cover}
            onChange={(file) => {
              setCover(file);
              setCoverProgress(null);
              coverUploaded.current = null;
            }}
            accept="image/jpeg,image/png"
            hint="JPG ou PNG · máximo 10 MB"
            maxSize={10 * 1024 * 1024}
            progress={coverProgress}
            disabled={create.isPending}
          />
        </Field>
      </div>
    );
  else if (step === 2)
    body = (
      <div className="g2">
        <Field label="Preço" help="Valor cobrado em meticais." req>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={form.priceAmount || ""}
            onChange={set("priceAmount")}
            suffix="MZN"
          />
        </Field>
        <Field
          label="Garantia"
          help="Escolha sem garantia quando não quiser oferecer este período."
        >
          <Select
            value={form.guaranteeDays ?? 0}
            onChange={set("guaranteeDays")}
            options={[
              ["0", "Sem garantia"],
              ["7", "7 dias"],
              ["15", "15 dias"],
              ["30", "30 dias"],
            ]}
          />
        </Field>
      </div>
    );
  else if (step === 3 && form.type === "ebook")
    body = (
      <Field label="Ficheiro do ebook" req>
        <FileUpload
          value={content}
          onChange={(file) => {
            setContent(file);
            setContentProgress(null);
          }}
          accept="application/pdf"
          hint="PDF · máximo 50 MB"
          maxSize={50 * 1024 * 1024}
          progress={contentProgress}
          disabled={create.isPending}
          required
        />
      </Field>
    );
  else if (step === 3)
    body = (
      <div className="stack">
        {courseModules.map((module, moduleIndex) => (
          <section className="wizard-module" key={module.key}>
            <div className="wizard-module-head">
              <span>Módulo {moduleIndex + 1}</span>
              {courseModules.length > 1 && (
                <Btn
                  s="sm"
                  v="ghost"
                  onClick={() =>
                    setCourseModules((current) => current.filter((item) => item.key !== module.key))
                  }
                >
                  Remover módulo
                </Btn>
              )}
            </div>
            <Field label="Título do módulo" req>
              <Input
                value={module.title}
                onChange={(event) => updateModule(module.key, event.target.value)}
              />
            </Field>
            <div className="stack-sm">
              {module.lessons.map((lesson, lessonIndex) => (
                <div className="wizard-lesson" key={lesson.key}>
                  <div className="wizard-lesson-head">
                    <span>Aula {lessonIndex + 1}</span>
                    {module.lessons.length > 1 && (
                      <Btn s="sm" v="ghost" onClick={() => removeLesson(module.key, lesson.key)}>
                        Remover
                      </Btn>
                    )}
                  </div>
                  <Field label="Título da aula" req>
                    <Input
                      value={lesson.title}
                      onChange={(event) =>
                        updateLesson(module.key, lesson.key, { title: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Descrição (opcional)">
                    <Textarea
                      rows={2}
                      value={lesson.description}
                      onChange={(event) =>
                        updateLesson(module.key, lesson.key, { description: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Vídeo" req>
                    <FileUpload
                      value={lesson.video}
                      onChange={(video) =>
                        updateLesson(module.key, lesson.key, { video, progress: null })
                      }
                      accept="video/mp4"
                      hint="MP4 · máximo 2 GB"
                      maxSize={2 * 1024 * 1024 * 1024}
                      progress={lesson.progress}
                      disabled={create.isPending}
                      required
                    />
                  </Field>
                </div>
              ))}
            </div>
            <Btn
              s="sm"
              onClick={() =>
                setCourseModules((current) =>
                  current.map((item) =>
                    item.key === module.key
                      ? { ...item, lessons: [...item.lessons, newLessonDraft()] }
                      : item,
                  ),
                )
              }
            >
              Adicionar aula
            </Btn>
          </section>
        ))}
        <Btn onClick={() => setCourseModules((current) => [...current, newModuleDraft()])}>
          Adicionar módulo
        </Btn>
      </div>
    );
  else
    body = (
      <div className="stack">
        <div className="wizard-review-head">
          <div>
            <Badge tone={form.type === "course" ? "blue" : "green"}>
              {form.type === "course" ? "Curso" : "Ebook"}
            </Badge>
            <h3>{form.name}</h3>
            <p>{form.description}</p>
          </div>
          <strong>{mt(form.priceAmount)}</strong>
        </div>
        <dl className="dl wizard-review-facts">
          <dt>Categoria</dt>
          <dd>{selectedCategory}</dd>
          <dt>Garantia</dt>
          <dd>{form.guaranteeDays ? `${form.guaranteeDays} dias` : "Sem garantia"}</dd>
          <dt>Capa</dt>
          <dd>{cover?.name ?? "Sem capa"}</dd>
          <dt>Conteúdo</dt>
          <dd>
            {form.type === "ebook"
              ? content?.name
              : `${courseModules.length} ${courseModules.length === 1 ? "módulo" : "módulos"} · ${lessonCount} ${lessonCount === 1 ? "aula" : "aulas"}`}
          </dd>
        </dl>
        {form.type === "course" && (
          <div className="wizard-review-content">
            {courseModules.map((module) => (
              <div key={module.key}>
                <strong>{module.title}</strong>
                <span>{module.lessons.map((lesson) => lesson.title).join(" · ")}</span>
              </div>
            ))}
          </div>
        )}
        {(coverProgress != null ||
          contentProgress != null ||
          courseModules.some((module) =>
            module.lessons.some((lesson) => lesson.progress != null),
          )) && (
          <div className="wizard-upload-status">
            {coverProgress != null && <UploadStatus label="Capa" progress={coverProgress} />}
            {contentProgress != null && <UploadStatus label="Ebook" progress={contentProgress} />}
            {courseModules
              .flatMap((module) => module.lessons)
              .filter((lesson) => lesson.progress != null)
              .map((lesson) => (
                <UploadStatus
                  key={lesson.key}
                  label={lesson.title}
                  progress={lesson.progress ?? 0}
                />
              ))}
          </div>
        )}
        <Alert
          tone="warning"
          title="O produto será enviado para análise"
          text="A equipa verifica os detalhes e o conteúdo antes de o produto ficar disponível para venda."
        />
      </div>
    );

  return (
    <>
      <PageHead
        title="Novo produto"
        desc={`Passo ${step + 1} de ${productSteps.length} · ${productSteps[step]}`}
        actions={
          create.isPending ? (
            <Btn v="ghost" disabled>
              Cancelar
            </Btn>
          ) : (
            <Btn to="/produtor/produtos" v="ghost">
              Cancelar
            </Btn>
          )
        }
      />
      <ol className="product-wizard-steps" aria-label="Progresso da criação do produto">
        {productSteps.map((label, index) => (
          <li
            key={label}
            className={index < step ? "is-done" : index === step ? "is-current" : ""}
            aria-current={index === step ? "step" : undefined}
          >
            <span>{index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      <Card
        className="product-wizard-card"
        title={
          [
            "Escolha o formato",
            "Detalhes do produto",
            "Preço e garantia",
            form.type === "course" ? "Módulos, aulas e vídeos" : "Ficheiro do ebook",
            "Confirme antes de submeter",
          ][step]
        }
        foot={
          <div className="row-between">
            {step > 0 ? (
              <Btn onClick={goBack} disabled={create.isPending}>
                Voltar
              </Btn>
            ) : (
              <span />
            )}
            {step < productSteps.length - 1 ? (
              <Btn v="primary" onClick={advance}>
                Continuar
              </Btn>
            ) : (
              <Btn v="primary" onClick={submit} loading={create.isPending}>
                Criar e submeter para análise
              </Btn>
            )}
          </div>
        }
      >
        <div className="stack">
          {body}
          {stepError && <Alert tone="danger" title="Falta completar este passo" text={stepError} />}
          {create.isError && (
            <Alert
              tone="danger"
              title={productErrorTitle(create.error)}
              text={productErrorText(create.error)}
            />
          )}
        </div>
      </Card>
    </>
  );
}

function UploadStatus({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="wizard-upload-row">
      <div>
        <span>{label}</span>
        <small>{Math.round(progress)}%</small>
      </div>
      <div className="wizard-upload-track">
        <i style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function SellerProduct() {
  const { id = "" } = useParams();
  const client = useQueryClient();
  const product = useQuery({
    queryKey: ["seller", "product", id],
    queryFn: () => api.seller.product(id),
  });
  const content = useQuery({
    queryKey: ["seller", "product-content", id],
    queryFn: () => api.seller.content(id),
  });
  const [moduleTitle, setModuleTitle] = useState("");
  const [lesson, setLesson] = useState({ moduleId: "", title: "", description: "" });
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
  const [lessonVideoProgress, setLessonVideoProgress] = useState<number | null>(null);
  const [lessonDraftId, setLessonDraftId] = useState<string | null>(null);
  const action = useMutation({
    mutationFn: async (name: "submit" | "edit" | "archive") => {
      if (name === "submit") await api.seller.submitProduct(id);
      else if (name === "edit") await api.seller.startEditingProduct(id);
      else await api.seller.archiveProduct(id);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["seller"] }),
  });
  const openContent = useMutation({
    mutationFn: (
      target: ({ type: "ebook"; fileId: string } | { type: "lesson"; lessonId: string }) & {
        previewWindow: Window | null;
      },
    ) =>
      target.type === "ebook"
        ? api.seller.productFileAccess(id, target.fileId)
        : api.seller.lessonPlayback(target.lessonId),
    onSuccess: (access, target) => {
      if (!target.previewWindow) {
        window.location.assign(access.url);
        return;
      }
      target.previewWindow.opener = null;
      target.previewWindow.location.replace(access.url);
    },
    onError: (_error, target) => target.previewWindow?.close(),
  });
  const requestContent = (
    target: { type: "ebook"; fileId: string } | { type: "lesson"; lessonId: string },
  ) => openContent.mutate({ ...target, previewWindow: window.open("about:blank", "_blank") });
  const removeProductFile = useMutation({
    mutationFn: async (fileId: string) => {
      await api.seller.detachFile(id, fileId);
      await api.seller.deleteFile(fileId);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ["seller", "product-content", id] }),
  });
  const addModule = useMutation({
    mutationFn: () =>
      api.seller.createModule(id, moduleTitle, (content.data?.modules?.length ?? 0) + 1),
    onSuccess: (created) => {
      setModuleTitle("");
      setLesson((current) => ({ ...current, moduleId: created.id }));
      client.invalidateQueries({ queryKey: ["seller", "product-content", id] });
    },
  });
  const addLesson = useMutation({
    mutationFn: async () => {
      if (!lesson.moduleId) throw new Error("Seleccione o módulo da aula.");
      if (!lessonVideo) throw new Error("Seleccione o vídeo da aula.");
      let lessonId = lessonDraftId;
      if (!lessonId) {
        const selectedModule = content.data?.modules?.find(
          (module) => module.id === lesson.moduleId,
        );
        const created = await api.seller.createLesson(lesson.moduleId, {
          title: lesson.title,
          description: lesson.description,
          position: (selectedModule?.lessons?.length ?? 0) + 1,
          isPreview: false,
          releaseAfterDays: 0,
        });
        lessonId = created.id;
        setLessonDraftId(lessonId);
      }
      setLessonVideoProgress(0);
      try {
        await uploadLessonFile(lessonId, lessonVideo, "video", setLessonVideoProgress);
      } catch (error) {
        setLessonVideoProgress(null);
        throw error;
      }
      return lessonId;
    },
    onSuccess: () => {
      setLesson((current) => ({ moduleId: current.moduleId, title: "", description: "" }));
      setLessonVideo(null);
      setLessonVideoProgress(null);
      setLessonDraftId(null);
      client.invalidateQueries({ queryKey: ["seller", "product-content", id] });
    },
  });
  if (product.isPending || content.isPending) return <Loading />;
  if (product.isError || content.isError)
    return <ErrorState error={product.error ?? content.error} />;
  const value = product.data.product;
  const mainOffer = product.data.offers.find((offer) => offer.isDefault);
  return (
    <>
      <div className="product-detail-back">
        <Btn to="/produtor/produtos" v="ghost" s="sm" icon="arrowl">
          Voltar aos produtos
        </Btn>
      </div>
      <PageHead
        over={
          <div className="row">
            <Badge tone={value.type === "course" ? "blue" : "green"}>
              {value.type === "course" ? "Curso" : "Ebook"}
            </Badge>
            <Status s={value.status} />
          </div>
        }
        title={value.name}
        desc={value.description}
        actions={
          <div className="row">
            {value.status === "draft" && (
              <Btn onClick={() => action.mutate("submit")} v="primary">
                Submeter para análise
              </Btn>
            )}
            {value.status === "active" && (
              <Btn onClick={() => action.mutate("edit")}>Retirar de venda e editar</Btn>
            )}
            {["draft", "active"].includes(value.status) && (
              <Btn onClick={() => action.mutate("archive")} v="danger">
                Arquivar
              </Btn>
            )}
          </div>
        }
      />
      {action.isError && (
        <Alert
          tone="danger"
          title="Não foi possível alterar o produto"
          text={errorText(action.error)}
        />
      )}
      {openContent.isError && (
        <Alert
          tone="danger"
          title="Não foi possível abrir o conteúdo"
          text={errorText(openContent.error)}
        />
      )}
      {removeProductFile.isError && (
        <Alert
          tone="danger"
          title="Não foi possível remover o ficheiro"
          text={errorText(removeProductFile.error)}
        />
      )}
      <div className="product-detail-layout">
        <div className="stack">
          {value.type === "course" ? (
            <CourseContent
              modules={content.data.modules ?? []}
              editable={value.status === "draft"}
              moduleTitle={moduleTitle}
              setModuleTitle={setModuleTitle}
              addModule={addModule}
              lesson={lesson}
              setLesson={setLesson}
              lessonVideo={lessonVideo}
              setLessonVideo={(file) => {
                setLessonVideo(file);
                setLessonVideoProgress(null);
              }}
              lessonVideoProgress={lessonVideoProgress}
              addLesson={addLesson}
              openingLessonId={
                openContent.variables?.type === "lesson" && openContent.isPending
                  ? openContent.variables.lessonId
                  : undefined
              }
              onOpenLesson={(lessonId) => requestContent({ type: "lesson", lessonId })}
            />
          ) : (
            <EbookContent
              files={content.data.files ?? []}
              editable={value.status === "draft"}
              openingFileId={
                openContent.variables?.type === "ebook" && openContent.isPending
                  ? openContent.variables.fileId
                  : undefined
              }
              removingFileId={removeProductFile.isPending ? removeProductFile.variables : undefined}
              onOpen={(fileId) => requestContent({ type: "ebook", fileId })}
              onRemove={(fileId) => removeProductFile.mutate(fileId)}
            />
          )}
        </div>
        <aside className="stack-sm">
          <Card title="Publicação" icon="store" tone="green">
            <dl className="dl product-facts">
              <dt>Estado</dt>
              <dd>
                <Status s={value.status} />
              </dd>
              <dt>Preço</dt>
              <dd>{mt(mainOffer?.priceAmount ?? 0)}</dd>
              <dt>Formato</dt>
              <dd>{value.type === "course" ? "Curso em vídeo" : "Ebook"}</dd>
              <dt>Garantia</dt>
              <dd>{value.guaranteeDays ? `${value.guaranteeDays} dias` : "Sem garantia"}</dd>
            </dl>
            {value.status === "active" && (
              <div className="product-checkout-link">
                <Btn to={`/checkout/${value.slug}`} icon="eye" block>
                  Abrir página de compra
                </Btn>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

function EbookContent({
  files,
  editable,
  openingFileId,
  removingFileId,
  onOpen,
  onRemove,
}: {
  files: ContentFile[];
  editable: boolean;
  openingFileId?: string;
  removingFileId?: string;
  onOpen: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}) {
  return (
    <Card
      title="Conteúdo do ebook"
      icon="file"
      tone="green"
      aside={
        files.length ? (
          <Badge tone="neutral">
            {files.length} {files.length === 1 ? "ficheiro" : "ficheiros"}
          </Badge>
        ) : undefined
      }
    >
      {files.length ? (
        <div className="content-list">
          {files.map((file) => (
            <div className="content-file" key={file.id}>
              <Tile icon="file" tone="green" />
              <div className="content-file-info">
                <strong>{file.originalName}</strong>
                <span>
                  {file.mimeType === "application/pdf" ? "Documento PDF" : file.mimeType} ·{" "}
                  {fileSize(file.sizeBytes)}
                </span>
              </div>
              {file.status === "ready" ? (
                <div className="row">
                  <Btn
                    s="sm"
                    icon="eye"
                    onClick={() => onOpen(file.id)}
                    loading={openingFileId === file.id}
                  >
                    Abrir ficheiro
                  </Btn>
                  {editable && (
                    <Btn
                      s="sm"
                      v="danger"
                      onClick={() => onRemove(file.id)}
                      loading={removingFileId === file.id}
                    >
                      Remover
                    </Btn>
                  )}
                </div>
              ) : (
                <Status s={file.status} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="file"
          title="Sem ficheiros associados"
          desc="Um ebook só pode ser submetido depois de ter conteúdo pronto."
        />
      )}
    </Card>
  );
}

function CourseContent({
  modules,
  editable,
  moduleTitle,
  setModuleTitle,
  addModule,
  lesson,
  setLesson,
  lessonVideo,
  setLessonVideo,
  lessonVideoProgress,
  addLesson,
  openingLessonId,
  onOpenLesson,
}: {
  modules: NonNullable<Awaited<ReturnType<typeof api.seller.content>>["modules"]>;
  editable: boolean;
  moduleTitle: string;
  setModuleTitle: (value: string) => void;
  addModule: { mutate: () => void; isError: boolean; isPending: boolean; error: unknown };
  lesson: { moduleId: string; title: string; description: string };
  setLesson: React.Dispatch<
    React.SetStateAction<{ moduleId: string; title: string; description: string }>
  >;
  lessonVideo: File | null;
  setLessonVideo: (value: File | null) => void;
  lessonVideoProgress: number | null;
  addLesson: { mutate: () => void; isError: boolean; isPending: boolean; error: unknown };
  openingLessonId?: string;
  onOpenLesson: (lessonId: string) => void;
}) {
  return (
    <div className="stack">
      <Card title="Conteúdo do curso" icon="cap" tone="blue">
        {modules.length ? (
          <div className="course-content-list">
            {modules.map((module) => (
              <section className="course-module" key={module.id}>
                <div className="course-module-title">
                  <span>{module.position}</span>
                  <strong>{module.title}</strong>
                </div>
                {module.lessons?.length ? (
                  <div>
                    {module.lessons.map((item) => {
                      const hasVideo = item.files?.some(
                        (file) => file.status === "ready" && file.purpose === "video",
                      );
                      return (
                        <div className="course-lesson" key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            {item.description && <small>{item.description}</small>}
                          </div>
                          {hasVideo ? (
                            <Btn
                              s="sm"
                              icon="play"
                              onClick={() => onOpenLesson(item.id)}
                              loading={openingLessonId === item.id}
                            >
                              Ver aula
                            </Btn>
                          ) : (
                            <Badge tone="warning">Sem vídeo pronto</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted course-module-empty">Ainda não tem aulas.</p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <Empty
            icon="cap"
            title="O curso ainda não tem conteúdo"
            desc="Adicione pelo menos um módulo, uma aula e o vídeo dessa aula."
          />
        )}
      </Card>
      {editable && (
        <div className="g2">
          <Card title="Adicionar módulo">
            <form
              className="stack-sm"
              onSubmit={(event) => {
                event.preventDefault();
                addModule.mutate();
              }}
            >
              <Field label="Título do módulo">
                <Input
                  value={moduleTitle}
                  onChange={(event) => setModuleTitle(event.target.value)}
                  required
                />
              </Field>
              {addModule.isError && (
                <Alert
                  tone="danger"
                  title="Não foi possível criar o módulo"
                  text={errorText(addModule.error)}
                />
              )}
              <Btn type="submit" loading={addModule.isPending}>
                Adicionar módulo
              </Btn>
            </form>
          </Card>
          <Card title="Adicionar aula">
            <form
              className="stack-sm"
              onSubmit={(event) => {
                event.preventDefault();
                addLesson.mutate();
              }}
            >
              <Field label="Módulo">
                <Select
                  value={lesson.moduleId}
                  onChange={(event) =>
                    setLesson((current) => ({ ...current, moduleId: event.target.value }))
                  }
                  required
                  options={[
                    ["", "Seleccione o módulo"],
                    ...modules.map((module) => [module.id, module.title] as [string, string]),
                  ]}
                />
              </Field>
              <Field label="Título da aula">
                <Input
                  value={lesson.title}
                  onChange={(event) =>
                    setLesson((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Descrição (opcional)">
                <Textarea
                  value={lesson.description}
                  onChange={(event) =>
                    setLesson((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </Field>
              <Field label="Vídeo da aula" req>
                <FileUpload
                  value={lessonVideo}
                  onChange={setLessonVideo}
                  accept="video/mp4"
                  hint="MP4 · máximo 2 GB"
                  maxSize={2 * 1024 * 1024 * 1024}
                  progress={lessonVideoProgress}
                  disabled={addLesson.isPending}
                  required
                />
              </Field>
              {addLesson.isError && (
                <Alert
                  tone="danger"
                  title="Não foi possível criar a aula"
                  text={errorText(addLesson.error)}
                />
              )}
              <Btn type="submit" loading={addLesson.isPending} disabled={!modules.length}>
                Adicionar aula e vídeo
              </Btn>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function OrderTable({ rows }: { rows: Awaited<ReturnType<typeof api.seller.orders>>["items"] }) {
  return (
    <Table
      rows={rows}
      rowKey={(order) => order.id}
      cols={[
        { label: "Encomenda", render: (order) => order.orderNumber },
        { label: "Produto", render: (order) => order.items?.[0]?.productName ?? "—" },
        { label: "Total", render: (order) => mt(order.totalAmount) },
        { label: "Estado", render: (order) => <Status s={order.status} /> },
        { label: "Data", render: (order) => date(order.createdAt) },
      ]}
    />
  );
}

const sellerOrderStatuses: [string, string][] = [
  ["", "Todos os estados"],
  ["paid", "Pagas"],
  ["pending_payment", "A aguardar pagamento"],
  ["expired", "Expiradas"],
  ["cancelled", "Canceladas"],
];
const orderTypeLabel = (type: string) =>
  type === "upsell" ? "Venda adicional" : "Venda principal";
const orderItemTypeLabel = (type: string) =>
  type === "order_bump"
    ? "Oferta adicional"
    : type === "upsell"
      ? "Venda adicional"
      : "Produto principal";

function SalesTable({
  rows,
  onSelect,
}: {
  rows: Awaited<ReturnType<typeof api.seller.orders>>["items"];
  onSelect: (id: string) => void;
}) {
  return (
    <Table
      className="sales-table"
      rows={rows}
      rowKey={(order) => order.id}
      onRow={(order) => onSelect(order.id)}
      cols={[
        {
          label: "Venda",
          render: (order) => (
            <div className="sales-order-cell">
              <span className="mono">{order.orderNumber}</span>
              <small>{date(order.createdAt)}</small>
            </div>
          ),
        },
        {
          label: "Tipo",
          render: (order) => <span className="sales-type">{orderTypeLabel(order.type)}</span>,
        },
        { label: "Valor", num: true, render: (order) => mt(order.totalAmount) },
        { label: "Estado", render: (order) => <Status s={order.status} /> },
        { label: "Pagamento", render: (order) => (order.paidAt ? date(order.paidAt) : "—") },
      ]}
    />
  );
}

export function SellerOrders() {
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const orders = useQuery({
    queryKey: ["seller", "orders", status],
    queryFn: () => api.seller.orders(status),
    placeholderData: (previous) => previous,
  });
  const reporting = useQuery({
    queryKey: ["seller", "reporting", "overview"],
    queryFn: api.seller.reportingOverview,
  });
  const approved = useQuery({
    queryKey: ["seller", "orders", "paid"],
    queryFn: () => api.seller.orders("paid"),
  });
  const pending = useQuery({
    queryKey: ["seller", "orders", "pending_payment"],
    queryFn: () => api.seller.orders("pending_payment"),
  });
  const expired = useQuery({
    queryKey: ["seller", "orders", "expired"],
    queryFn: () => api.seller.orders("expired"),
  });
  const queries = [orders, reporting, approved, pending, expired];
  if (queries.some((query) => query.isPending)) return <Loading />;
  const failed = queries.find((query) => query.isError);
  if (failed) return <ErrorState error={failed.error} />;

  return (
    <>
      <PageHead
        title="Vendas"
        desc="Acompanhe as encomendas e consulte os detalhes de cada venda."
      />
      <div className="g4">
        <Kpi
          label="Vendas aprovadas"
          value={int(approved.data!.total)}
          hint="Total de encomendas pagas"
        />
        <Kpi
          label="A aguardar pagamento"
          value={int(pending.data!.total)}
          hint="Ainda sem confirmação"
        />
        <Kpi
          label="Expiradas"
          value={int(expired.data!.total)}
          hint="Prazo de pagamento terminado"
        />
        <Kpi
          label="Faturamento líquido"
          value={mt(reporting.data!.netRevenue.value)}
          hint="Últimos 30 dias · já sem taxas"
        />
      </div>
      <div className="ad-filterbar sales-filterbar">
        <Select
          aria-label="Filtrar vendas por estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={sellerOrderStatuses}
        />
        <span className="ad-filterbar-count">
          {orders.data!.total} {orders.data!.total === 1 ? "venda" : "vendas"}
        </span>
      </div>
      <Card flush>
        {orders.data!.items.length ? (
          <SalesTable rows={orders.data!.items} onSelect={setSelectedId} />
        ) : (
          <Empty
            icon="receipt"
            title="Nenhuma venda neste estado"
            desc="Altere o filtro para consultar outras encomendas."
          />
        )}
      </Card>
      {selectedId && <SellerOrderDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}

function SellerOrderDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["seller", "order", id],
    queryFn: () => api.seller.order(id),
  });
  if (query.isPending)
    return (
      <Drawer className="drawer-order" title="Detalhes da venda" onClose={onClose}>
        <Loading />
      </Drawer>
    );
  if (query.isError)
    return (
      <Drawer className="drawer-order" title="Detalhes da venda" onClose={onClose}>
        <ErrorState error={query.error} retry={() => query.refetch()} />
      </Drawer>
    );

  const order = query.data;
  return (
    <Drawer
      className="drawer-order"
      over={<span className="mono">{order.orderNumber}</span>}
      title={mt(order.totalAmount)}
      sub={
        <div className="row">
          <Status s={order.status} />
          <span className="faint">{orderTypeLabel(order.type)}</span>
        </div>
      }
      onClose={onClose}
    >
      <section className="order-detail-section">
        <div className="order-detail-head">
          <h3>Resumo</h3>
        </div>
        <div className="order-detail-facts">
          <div>
            <span>Criada em</span>
            <strong>{date(order.createdAt)}</strong>
          </div>
          <div>
            <span>Pagamento</span>
            <strong>{order.paidAt ? date(order.paidAt) : "Não confirmado"}</strong>
          </div>
          <div>
            <span>Expira em</span>
            <strong>{date(order.expiresAt)}</strong>
          </div>
        </div>
      </section>
      <section className="order-detail-section">
        <div className="order-detail-head">
          <h3>Produtos</h3>
          <span>
            {order.items?.length ?? 0} {order.items?.length === 1 ? "item" : "itens"}
          </span>
        </div>
        {order.items?.length ? (
          <div className="order-items">
            {order.items.map((item) => (
              <div className="order-item" key={item.id}>
                <div>
                  <strong>{item.productName}</strong>
                  <span>
                    {item.offerName} · {orderItemTypeLabel(item.type)}
                  </span>
                </div>
                <strong>{mt(item.totalAmount)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <Alert
            tone="warning"
            title="Sem itens associados"
            text="A encomenda não devolveu os produtos associados."
          />
        )}
      </section>
      <section className="order-detail-section">
        <div className="order-detail-head">
          <h3>Valores</h3>
        </div>
        <dl className="dl order-values">
          <dt>Subtotal</dt>
          <dd>{mt(order.subtotalAmount)}</dd>
          {order.discountAmount > 0 && (
            <>
              <dt>Desconto</dt>
              <dd>−{mt(order.discountAmount)}</dd>
            </>
          )}
          <dt className="order-total">Total</dt>
          <dd className="order-total">{mt(order.totalAmount)}</dd>
        </dl>
      </section>
    </Drawer>
  );
}

export function SellerFinance() {
  const client = useQueryClient();
  const balance = useQuery({ queryKey: ["seller", "balance"], queryFn: api.seller.balance });
  const accounts = useQuery({
    queryKey: ["seller", "payout-accounts"],
    queryFn: api.seller.payoutAccounts,
  });
  const payouts = useQuery({ queryKey: ["seller", "payouts"], queryFn: api.seller.payouts });
  const [account, setAccount] = useState({
    provider: "mpesa",
    accountName: "",
    accountReference: "",
  });
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(() => !!readPayoutOperation());
  const [amount, setAmount] = useState(() => readPayoutOperation()?.body.amount.toString() ?? "");
  const [accountId, setAccountId] = useState(
    () => readPayoutOperation()?.body.payoutAccountId ?? "",
  );
  const [payoutOperation, setPayoutOperation] = useState<PayoutOperation | null>(
    readPayoutOperation,
  );
  const addAccount = useMutation({
    mutationFn: () => api.seller.addPayoutAccount({ type: "mobile_money", ...account }),
    onSuccess: (created) => {
      setAccount({ provider: "mpesa", accountName: "", accountReference: "" });
      setAccountId(created.id);
      setAccountModalOpen(false);
      client.invalidateQueries({ queryKey: ["seller", "payout-accounts"] });
    },
  });
  const requestPayout = useMutation({
    mutationFn: (operation: NonNullable<typeof payoutOperation>) =>
      api.seller.requestPayout(operation.body, operation.key),
    onSuccess: () => {
      setPayoutOperation(null);
      storePayoutOperation(null);
      setAmount("");
      setPayoutModalOpen(false);
      client.invalidateQueries({ queryKey: ["seller", "balance"] });
      client.invalidateQueries({ queryKey: ["seller", "payouts"] });
    },
    onError: (error) => {
      if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
        setPayoutOperation(null);
        storePayoutOperation(null);
      }
    },
  });
  useEffect(() => {
    if (!payoutOperation || balance.data === undefined) return;
    if (payoutOperation.body.amount >= 100 && payoutOperation.body.amount <= balance.data.available)
      return;

    setPayoutOperation(null);
    storePayoutOperation(null);
  }, [balance.data, payoutOperation]);
  const requestedAmount = Number(amount);
  const amountInvalid =
    !Number.isFinite(requestedAmount) ||
    requestedAmount < 100 ||
    requestedAmount > (balance.data?.available ?? 0);
  const submitPayout = () => {
    if (amountInvalid) return;

    const operation = payoutOperation ?? {
      key: crypto.randomUUID(),
      body: { payoutAccountId: accountId, amount: Number(amount), type: "standard" },
    };
    setPayoutOperation(operation);
    storePayoutOperation(operation);
    requestPayout.mutate(operation);
  };
  if (balance.isPending || accounts.isPending || payouts.isPending) return <Loading />;
  if (balance.isError || accounts.isError || payouts.isError)
    return <ErrorState error={balance.error ?? accounts.error ?? payouts.error} />;
  const activeAccounts = accounts.data.filter((item) => item.status === "active");
  return (
    <>
      <PageHead
        title="Financeiro"
        desc="Saldo, destinos de recebimento e histórico de saques."
        actions={
          <Btn
            v="primary"
            disabled={!activeAccounts.length}
            onClick={() => setPayoutModalOpen(true)}
          >
            Solicitar saque
          </Btn>
        }
      />
      <div className="g3">
        <section className="balance-card">
          <div className="row-between">
            <small>Disponível para saque</small>
            <Badge tone="success">MZN</Badge>
          </div>
          <span className="big">{mt(balance.data.available)}</span>
          <small>O saque é enviado para um destino activo da sua conta.</small>
        </section>
        <Kpi
          label="A libertar"
          value={mt(balance.data.pending)}
          hint="Valores ainda indisponíveis para saque"
        />
        <Kpi
          label="Em trânsito"
          value={mt(balance.data.payoutInTransit)}
          hint="Pedidos já em processamento"
        />
      </div>
      <div className="g-main">
        <Card title="Saques" flush>
          {payouts.data.items.length ? (
            <Table
              dense
              rows={payouts.data.items}
              rowKey={(payout) => payout.id}
              cols={[
                {
                  label: "Pedido",
                  render: (payout) => <span className="mono">{payout.id.slice(0, 8)}…</span>,
                },
                { label: "Data", render: (payout) => date(payout.requestedAt) },
                { label: "Destino", render: (payout) => payout.destinationName },
                { label: "Valor", num: true, render: (payout) => <b>{mt(payout.amount)}</b> },
                { label: "Estado", render: (payout) => <Status s={payout.status} /> },
              ]}
            />
          ) : (
            <Empty
              icon="cash"
              title="Ainda não existem pedidos de saque"
              desc="Os pedidos efectuados aparecerão aqui."
            />
          )}
        </Card>
        <div className="stack-sm" style={{ gap: 16 }}>
          <Card title="Contas de recebimento">
            {accounts.data.length ? (
              <div className="stack-sm">
                {accounts.data.map((item) => (
                  <div className="offer-row" key={item.id}>
                    <div className="grow stack-xs">
                      <b>
                        {item.provider === "mpesa"
                          ? "M-Pesa"
                          : item.provider === "emola"
                            ? "e-Mola"
                            : item.provider}
                      </b>
                      <small className="faint">
                        {item.accountName} · {item.accountReference || "referência protegida"}
                      </small>
                    </div>
                    {item.isPrimary && <Badge tone="primary">Principal</Badge>}
                    <Status s={item.status} />
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="wallet" title="Sem contas de recebimento" />
            )}
            <Btn s="sm" icon="plus" onClick={() => setAccountModalOpen(true)}>
              Adicionar conta
            </Btn>
          </Card>
          <Card title="Composição do saldo">
            <dl className="dl">
              <dt>Disponível</dt>
              <dd>{mt(balance.data.available)}</dd>
              <dt>Pendente</dt>
              <dd>{mt(balance.data.pending)}</dd>
              <dt>Reserva</dt>
              <dd>{mt(balance.data.reserved)}</dd>
              <dt>Em trânsito</dt>
              <dd>{mt(balance.data.payoutInTransit)}</dd>
            </dl>
          </Card>
        </div>
      </div>
      {accountModalOpen && (
        <Modal
          title="Adicionar conta de recebimento"
          desc="A conta será usada para receber os seus saques."
          onClose={() => setAccountModalOpen(false)}
          foot={
            <>
              <Btn onClick={() => setAccountModalOpen(false)}>Cancelar</Btn>
              <Btn
                v="primary"
                loading={addAccount.isPending}
                onClick={() => addAccount.mutate()}
                disabled={!account.accountName.trim() || !account.accountReference.trim()}
              >
                Adicionar conta
              </Btn>
            </>
          }
        >
          <div className="stack-sm">
            <Field label="Operador">
              <Select
                value={account.provider}
                onValueChange={(provider) => setAccount((current) => ({ ...current, provider }))}
                options={[
                  ["mpesa", "M-Pesa"],
                  ["emola", "e-Mola"],
                ]}
              />
            </Field>
            <Field label="Nome do titular">
              <Input
                value={account.accountName}
                onChange={(event) =>
                  setAccount((current) => ({ ...current, accountName: event.target.value }))
                }
              />
            </Field>
            <Field label="Número" help="Formato +258841234567">
              <Input
                value={account.accountReference}
                onChange={(event) =>
                  setAccount((current) => ({ ...current, accountReference: event.target.value }))
                }
              />
            </Field>
            {addAccount.isError && (
              <Alert
                tone="danger"
                title="Não foi possível adicionar a conta"
                text={errorText(addAccount.error)}
              />
            )}
          </div>
        </Modal>
      )}
      {payoutModalOpen && (
        <Modal
          title={payoutOperation ? "Retomar pedido de saque" : "Solicitar saque"}
          desc={`Disponível: ${mt(balance.data.available)}`}
          onClose={() => {
            if (!payoutOperation) setPayoutModalOpen(false);
          }}
          noClose={!!payoutOperation}
          foot={
            <>
              <Btn onClick={() => setPayoutModalOpen(false)} disabled={!!payoutOperation}>
                Cancelar
              </Btn>
              <Btn
                v="primary"
                loading={requestPayout.isPending}
                onClick={submitPayout}
                disabled={!accountId || !amount || amountInvalid}
              >
                {payoutOperation ? "Retomar pedido" : "Confirmar saque"}
              </Btn>
            </>
          }
        >
          <div className="stack-sm">
            <Field
              label="Valor"
              help={
                requestedAmount > balance.data.available
                  ? `O máximo disponível é ${mt(balance.data.available)}.`
                  : "Mínimo 100 MT."
              }
            >
              <Input
                type="number"
                min="100"
                max={balance.data.available}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={!!payoutOperation}
                suffix="MT"
              />
            </Field>
            <Field label="Destino">
              <Select
                value={accountId}
                onValueChange={setAccountId}
                disabled={!!payoutOperation}
                options={[
                  ["", "Seleccione um destino"],
                  ...activeAccounts.map(
                    (item) =>
                      [
                        item.id,
                        `${item.provider === "mpesa" ? "M-Pesa" : "e-Mola"} · ${item.accountName}`,
                      ] as [string, string],
                  ),
                ]}
              />
            </Field>
            {requestPayout.isError && (
              <Alert
                tone="danger"
                title="Não foi possível confirmar o pedido"
                text={errorText(requestPayout.error)}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

export function SellerVerification() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["seller", "verification"],
    queryFn: api.seller.verification,
  });
  const profile = useQuery({ queryKey: ["seller", "profile"], queryFn: api.seller.profile });
  const [nationalID, setNationalID] = useState<File | null>(null);
  const [nuit, setNuit] = useState<File | null>(null);
  const [registration, setRegistration] = useState<File | null>(null);
  const [documentProgress, setDocumentProgress] = useState<Record<string, number | null>>({});
  const uploadDocument = async (documentType: string, file: File) => {
    setDocumentProgress((current) => ({ ...current, [documentType]: 0 }));
    try {
      return await uploadVerificationDocument(documentType, file, (percent) =>
        setDocumentProgress((current) => ({ ...current, [documentType]: percent })),
      );
    } catch (error) {
      setDocumentProgress((current) => ({ ...current, [documentType]: null }));
      throw error;
    }
  };
  const submit = useMutation({
    mutationFn: async () => {
      if (!nationalID) throw new Error("Seleccione o documento de identificação.");
      const documents = [await uploadDocument("national_id", nationalID)];
      if (profile.data?.businessType === "company") {
        if (!nuit || !registration)
          throw new Error("Empresas devem enviar o NUIT e a certidão comercial.");
        documents.push(await uploadDocument("nuit", nuit));
        documents.push(await uploadDocument("business_registration", registration));
      }
      return api.seller.submitVerification(documents);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["seller", "verification"] }),
  });
  if (query.isPending || profile.isPending) return <Loading />;
  if (query.isError || profile.isError) return <ErrorState error={query.error ?? profile.error} />;
  const status = verificationStatus(query.data.verification);
  const editable = ["draft", "changes_requested"].includes(status);
  const stage = editable ? 0 : ["pending", "in_review"].includes(status) ? 1 : 2;
  const statusCopy: Record<string, { title: string; text: string; tone: string }> = {
    draft: {
      title: "Prepare a documentação",
      text: "Envie os documentos abaixo para iniciar a verificação do seu perfil comercial.",
      tone: "neutral",
    },
    pending: {
      title: "Documentos recebidos",
      text: "A submissão está na fila e será analisada pela nossa equipa.",
      tone: "warning",
    },
    in_review: {
      title: "Verificação em análise",
      text: "A nossa equipa está a validar os documentos enviados.",
      tone: "warning",
    },
    changes_requested: {
      title: "Actualize a documentação",
      text: "Foram pedidas correcções. Consulte a nota da revisão e volte a submeter os documentos.",
      tone: "warning",
    },
    approved: {
      title: "Perfil comercial verificado",
      text: "A documentação foi aprovada e o seu perfil está validado.",
      tone: "success",
    },
    rejected: {
      title: "Verificação não aprovada",
      text: "Consulte a nota da revisão para perceber a decisão.",
      tone: "danger",
    },
  };
  const copy = statusCopy[status] ?? statusCopy.draft;
  const documentLabels: Record<string, string> = {
    national_id: "Documento de identificação",
    passport: "Passaporte",
    nuit: "Documento NUIT",
    business_registration: "Certidão comercial",
    other: "Outro documento",
  };
  const fileType = (mimeType: string) =>
    mimeType === "application/pdf" ? "PDF" : mimeType === "image/png" ? "PNG" : "JPG";

  return (
    <>
      <PageHead
        title="Verificação do produtor"
        desc="Acompanhe a validação do seu perfil comercial e mantenha a documentação actualizada."
      />
      <section className={`verification-hero is-${copy.tone}`}>
        <div className="verification-hero-copy">
          <span className="verification-kicker">Estado da verificação</span>
          <div className="verification-title-row">
            <h2>{copy.title}</h2>
            <Status s={status} />
          </div>
          <p>{copy.text}</p>
        </div>
        <dl className="verification-hero-meta">
          <div>
            <dt>Perfil</dt>
            <dd>{profile.data.businessType === "company" ? "Empresa" : "Pessoa singular"}</dd>
          </div>
          {query.data.verification.submittedAt && (
            <div>
              <dt>Submetido</dt>
              <dd>{date(query.data.verification.submittedAt)}</dd>
            </div>
          )}
          {query.data.verification.reviewedAt && (
            <div>
              <dt>Revisto</dt>
              <dd>{date(query.data.verification.reviewedAt)}</dd>
            </div>
          )}
        </dl>
      </section>

      <ol className="verification-steps" aria-label="Progresso da verificação">
        {[
          { title: "Documentos", text: editable ? "Prepare e envie" : "Submetidos" },
          {
            title: "Análise",
            text: status === "in_review" ? "Em curso" : stage > 1 ? "Concluída" : "A aguardar",
          },
          {
            title: "Decisão",
            text:
              status === "approved"
                ? "Aprovada"
                : status === "rejected"
                  ? "Não aprovada"
                  : "A aguardar",
          },
        ].map((item, index) => (
          <li
            key={item.title}
            className={index < stage ? "is-complete" : index === stage ? "is-current" : ""}
            aria-current={index === stage ? "step" : undefined}
          >
            <span>{index + 1}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </div>
          </li>
        ))}
      </ol>

      {status !== "approved" && query.data.verification.reviewNotes && (
        <section className={`verification-note is-${status === "rejected" ? "danger" : "warning"}`}>
          <strong>
            {status === "changes_requested" ? "Alterações pedidas" : "Nota da revisão"}
          </strong>
          <p>{query.data.verification.reviewNotes}</p>
        </section>
      )}

      {editable && (
        <Card
          className="verification-upload"
          title={
            status === "changes_requested" ? "Voltar a submeter documentos" : "Enviar documentos"
          }
          aside={<span className="verification-required">PDF, JPG ou PNG · até 10 MB</span>}
        >
          <form
            className="verification-upload-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit.mutate();
            }}
          >
            <Field label="BI ou documento de identificação" req>
              <FileUpload
                value={nationalID}
                onChange={(file) => {
                  setNationalID(file);
                  setDocumentProgress((current) => ({ ...current, national_id: null }));
                }}
                accept="application/pdf,image/jpeg,image/png"
                hint="PDF, JPG ou PNG · máximo 10 MB"
                maxSize={10 * 1024 * 1024}
                progress={documentProgress.national_id}
                disabled={submit.isPending}
                required
              />
            </Field>
            {profile.data.businessType === "company" && (
              <>
                <Field label="Documento NUIT" req>
                  <FileUpload
                    value={nuit}
                    onChange={(file) => {
                      setNuit(file);
                      setDocumentProgress((current) => ({ ...current, nuit: null }));
                    }}
                    accept="application/pdf,image/jpeg,image/png"
                    hint="PDF, JPG ou PNG · máximo 10 MB"
                    maxSize={10 * 1024 * 1024}
                    progress={documentProgress.nuit}
                    disabled={submit.isPending}
                    required
                  />
                </Field>
                <Field label="Certidão comercial" req>
                  <FileUpload
                    value={registration}
                    onChange={(file) => {
                      setRegistration(file);
                      setDocumentProgress((current) => ({
                        ...current,
                        business_registration: null,
                      }));
                    }}
                    accept="application/pdf,image/jpeg,image/png"
                    hint="PDF, JPG ou PNG · máximo 10 MB"
                    maxSize={10 * 1024 * 1024}
                    progress={documentProgress.business_registration}
                    disabled={submit.isPending}
                    required
                  />
                </Field>
              </>
            )}
            {submit.isError && (
              <Alert
                tone="danger"
                title="Não foi possível submeter a verificação"
                text={errorText(submit.error)}
              />
            )}
            <div className="verification-submit">
              <p>
                Ao submeter, os documentos seguem para análise e deixam de poder ser substituídos
                até existir uma decisão.
              </p>
              <Btn type="submit" v="primary" loading={submit.isPending}>
                Enviar para análise
              </Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="verification-layout">
        <Card
          title="Documentos enviados"
          aside={<Badge tone="neutral">{query.data.documents.length}</Badge>}
        >
          {query.data.documents.length ? (
            <div className="verification-documents">
              {query.data.documents.map((document) => (
                <div className="verification-document" key={document.id}>
                  <span className="verification-filetype">{fileType(document.mimeType)}</span>
                  <div className="verification-document-name">
                    <strong>
                      {documentLabels[document.documentType] ?? document.documentType}
                    </strong>
                    <span>{document.originalName || "Nome indisponível"}</span>
                  </div>
                  <span className="verification-document-meta">
                    {fileSize(document.sizeBytes)}
                    <small>{date(document.createdAt)}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="verification-empty">
              <strong>Ainda não existem documentos submetidos.</strong>
              <span>Os ficheiros enviados nesta verificação aparecerão aqui.</span>
            </div>
          )}
        </Card>
        <Card title="Resumo">
          <dl className="verification-summary">
            <div>
              <dt>Estado</dt>
              <dd>
                <Status s={status} />
              </dd>
            </div>
            <div>
              <dt>Tipo de perfil</dt>
              <dd>{profile.data.businessType === "company" ? "Empresa" : "Pessoa singular"}</dd>
            </div>
            <div>
              <dt>Documentos</dt>
              <dd>{query.data.documents.length}</dd>
            </div>
            {query.data.verification.submittedAt && (
              <div>
                <dt>Última submissão</dt>
                <dd>{date(query.data.verification.submittedAt)}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>
    </>
  );
}

export function SellerAccount() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["seller", "profile"], queryFn: api.seller.profile });
  const [draft, setDraft] = useState<Partial<SellerProfileInput> | null>(null);
  const save = useMutation({
    mutationFn: (body: Partial<SellerProfileInput>) => api.seller.updateProfile(body),
    onSuccess: () => {
      setDraft(null);
      client.invalidateQueries({ queryKey: ["seller", "profile"] });
    },
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  const value = { ...query.data, ...draft };
  return (
    <>
      <PageHead
        title="Perfil comercial"
        desc="Informação pública e contactos de suporte apresentados aos seus clientes."
      />
      <div className="seller-profile-layout">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(draft ?? {});
          }}
        >
          <Card
            title="Informação pública"
            icon="store"
            foot={
              <div className="seller-profile-actions">
                {draft && <Btn onClick={() => setDraft(null)}>Descartar</Btn>}
                <Btn type="submit" v="primary" loading={save.isPending} disabled={!draft}>
                  Guardar alterações
                </Btn>
              </div>
            }
          >
            <div className="seller-profile-identity">
              <Avatar name={value.displayName} s="xl" />
              <div>
                <strong>{value.displayName}</strong>
                <span>vendaqui.app/{value.slug}</span>
                <Status s={value.status} />
              </div>
            </div>
            <div className="g2 seller-profile-fields">
              <Field label="Nome público" help="Nome apresentado no checkout e aos compradores.">
                <Input
                  value={value.displayName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, displayName: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Email de suporte" help="Usado pelos clientes para pedir ajuda.">
                <Input
                  type="email"
                  value={value.supportEmail}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, supportEmail: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="WhatsApp" help="Formato internacional, por exemplo +258841234567.">
                <Input
                  value={value.whatsapp}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, whatsapp: event.target.value }))
                  }
                  inputMode="tel"
                />
              </Field>
              <Field label="Apresentação" className="seller-profile-bio">
                <Textarea
                  rows={5}
                  value={value.bio}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, bio: event.target.value }))
                  }
                />
              </Field>
            </div>
            {save.isError && (
              <Alert tone="danger" title="Não foi possível guardar" text={errorText(save.error)} />
            )}
          </Card>
        </form>
        <aside className="stack-sm">
          <Card title="Pré-visualização" icon="eye" tone="green">
            <div className="seller-profile-preview">
              <Avatar name={value.displayName} s="lg" />
              <div>
                <strong>{value.displayName || "Nome do produtor"}</strong>
                <p>{value.bio || "A apresentação do produtor aparecerá aqui."}</p>
              </div>
              <div className="seller-profile-contacts">
                {value.supportEmail && (
                  <span>
                    <Icon name="mail" size={15} />
                    {value.supportEmail}
                  </span>
                )}
                {value.whatsapp && (
                  <span>
                    <Icon name="phone" size={15} />
                    {value.whatsapp}
                  </span>
                )}
              </div>
            </div>
          </Card>
          <Card title="Dados comerciais" icon="idcard">
            <dl className="dl product-facts">
              <dt>Tipo</dt>
              <dd>{value.businessType === "company" ? "Empresa" : "Pessoa singular"}</dd>
              {value.businessName && (
                <>
                  <dt>Nome legal</dt>
                  <dd>{value.businessName}</dd>
                </>
              )}
              {value.nuit && (
                <>
                  <dt>NUIT</dt>
                  <dd>{value.nuit}</dd>
                </>
              )}
              <dt>Estado</dt>
              <dd>
                <Status s={value.status} />
              </dd>
            </dl>
            <p className="seller-profile-note">
              Os dados comerciais sujeitos à verificação não são alterados nesta página.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
