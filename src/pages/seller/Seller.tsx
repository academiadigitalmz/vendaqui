import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, uploadLessonFile, uploadProductCover, uploadProductFile, uploadVerificationDocument, type ContentFile, type ProductInput, type SellerProfileInput } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import { useApp } from "@/lib/app-state";
import { mt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { Alert, Avatar, Badge, Btn, Card, Empty, ErrorState, Field, Input, Kpi, Loading, PageHead, Select, Status, Table, Textarea, Tile } from "@/components/ui";
import { Modal } from "@/components/overlay";

const errorText = (error: unknown) => error instanceof HttpError ? error.message : "Não foi possível concluir. Verifique a ligação e tente novamente.";
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const fileSize = (value?: number | null) => {
  if (!value) return "Tamanho indisponível";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toLocaleString("pt-MZ", { maximumFractionDigits: 1 })} MB`;
};
const verificationStatus = (value: { status?: string }) => value.status ?? "draft";
const payoutStorageKey = "vq.payout.operation";
type PayoutOperation = { key: string; body: { payoutAccountId: string; amount: number; type: string } };
const readPayoutOperation = (): PayoutOperation | null => {
  try { return JSON.parse(sessionStorage.getItem(payoutStorageKey) || "null"); } catch { return null; }
};
const storePayoutOperation = (operation: PayoutOperation | null) => {
  if (operation) sessionStorage.setItem(payoutStorageKey, JSON.stringify(operation));
  else sessionStorage.removeItem(payoutStorageKey);
};

export function SellerSetup() {
  const { session, signIn } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState<SellerProfileInput>({ displayName: "", bio: "", businessType: "individual", businessName: "", nuit: "", supportEmail: session?.user.email ?? "", whatsapp: session?.user.phone ?? "" });
  const save = useMutation({
    mutationFn: () => api.seller.createProfile(form),
    onSuccess: profile => {
      if (session) signIn({ ...session, user: { ...session.user, role: "seller", business: { name: profile.displayName, nuit: profile.nuit, kycStatus: "not_started" } } });
      navigate("/produtor/verificacao", { replace: true });
    },
  });
  const set = (field: keyof SellerProfileInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(current => ({ ...current, [field]: event.target.value }));

  return <main className="lp-wrap stack" style={{ paddingBlock: 32 }}>
    <PageHead title="Configurar perfil de produtor" desc="Complete os dados do seu negócio. Depois deste passo poderá enviar os documentos para verificação." />
    <Card title="Dados comerciais"><form className="stack-sm" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
      <Field label="Nome público"><Input value={form.displayName} onChange={set("displayName")} required /></Field>
      <Field label="Tipo"><Select value={form.businessType} onChange={set("businessType")} options={[["individual", "Pessoa singular"], ["company", "Empresa"]]} /></Field>
      {form.businessType === "company" && <Field label="Nome legal da empresa"><Input value={form.businessName} onChange={set("businessName")} required /></Field>}
      <Field label="NUIT"><Input value={form.nuit} onChange={set("nuit")} inputMode="numeric" pattern="[0-9]{9,12}" /></Field>
      <Field label="Email de suporte"><Input type="email" value={form.supportEmail} onChange={set("supportEmail")} /></Field>
      <Field label="WhatsApp" help="Formato internacional, por exemplo +258841234567."><Input value={form.whatsapp} onChange={set("whatsapp")} /></Field>
      <Field label="Apresentação"><Textarea value={form.bio} onChange={set("bio")} /></Field>
      {save.isError && <Alert tone="danger" title="Não foi possível criar o perfil" text={errorText(save.error)} />}
      <Btn type="submit" v="primary" loading={save.isPending}>Guardar e continuar</Btn>
    </form></Card>
  </main>;
}

export function SellerOverview() {
  const products = useQuery({ queryKey: ["seller", "products"], queryFn: () => api.seller.products() });
  const orders = useQuery({ queryKey: ["seller", "orders"], queryFn: () => api.seller.orders() });
  const balance = useQuery({ queryKey: ["seller", "balance"], queryFn: api.seller.balance });
  if (products.isPending || orders.isPending || balance.isPending) return <Loading />;
  if (products.isError || orders.isError || balance.isError) return <ErrorState error={products.error ?? orders.error ?? balance.error} />;

  const activeProducts = products.data.items.filter(product => product.status === "active").length;
  return <><div className="welcome"><div><h1>Painel</h1><p className="muted">Acompanhe produtos, vendas e valores disponíveis.</p></div></div>
    <div className="g4">
      <Kpi label="Produtos" value={products.data.total} icon="package" hint={`${activeProducts} activo${activeProducts === 1 ? "" : "s"}`} />
      <Kpi label="Encomendas" value={orders.data.total} icon="receipt" hint="Total recebido" />
      <Kpi label="Saldo disponível" value={mt(balance.data.available)} icon="wallet" tone="success" hint="Disponível para saque" />
      <Kpi label="Saldo pendente" value={mt(balance.data.pending)} icon="clock" tone="warning" hint="Em processamento" />
    </div>
    <div className="g-main">
      <Card title="Encomendas recentes">{orders.data.items.length ? <OrderTable rows={orders.data.items.slice(0, 8)} /> : <Empty icon="receipt" title="Ainda não existem encomendas" desc="As vendas confirmadas aparecerão aqui." />}</Card>
      <section className="balance-card"><div><small>Saldo disponível</small><div className="big">{mt(balance.data.available)}</div></div><div className="balance-split"><div><small>Pendente</small><b>{mt(balance.data.pending)}</b></div><div><small>Em trânsito</small><b>{mt(balance.data.payoutInTransit)}</b></div></div><Btn to="/produtor/financeiro">Ver financeiro</Btn></section>
    </div>
  </>;
}

export function SellerProducts() {
  const query = useQuery({ queryKey: ["seller", "products"], queryFn: () => api.seller.products() });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  const navigate = useNavigate();
  return <><PageHead title="Produtos" desc="Cursos e ebooks, desde o rascunho até à publicação." actions={<Btn to="/produtor/produtos/novo" v="primary">Novo produto</Btn>} />
    {query.data.items.length ? <div className="pgrid">{query.data.items.map(product => <button type="button" className="pcard" key={product.id} onClick={() => navigate(`/produtor/produtos/${product.id}`)}>
      <div className={`pcard-head ${product.type === "course" ? "cv-blue" : "cv-green"}`}><span className="pcard-type"><Icon name={product.type === "course" ? "cap" : "file"} size={14} />{product.type === "course" ? "Curso" : "Ebook"}</span><h4>{product.name}</h4></div>
      <div className="pcard-body"><Status s={product.status} /><div className="pcard-stats"><div><small>Preço</small><b>{mt(product.defaultOffer?.priceAmount ?? 0)}</b></div><div><small>Tipo</small><b>{product.type === "course" ? "Curso" : "Ebook"}</b></div><div><small>Criado</small><b>{date(product.createdAt).split(",")[0]}</b></div></div></div>
    </button>)}</div> : <Card><Empty icon="package" title="Ainda não criou produtos" desc="Crie um curso em vídeo ou publique um ebook." action={<Btn to="/produtor/produtos/novo" v="primary">Criar produto</Btn>} /></Card>}
  </>;
}

export function NewProduct() {
  const navigate = useNavigate();
  const categoryList = useQuery({ queryKey: ["public", "categories"], queryFn: () => api.catalog.categories() });
  const [form, setForm] = useState<ProductInput>({ categoryId: "", type: "ebook", name: "", description: "", guaranteeDays: 7, priceAmount: 0 });
  const [content, setContent] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: async () => {
      if (form.type === "ebook" && !content) throw new Error("Seleccione o ficheiro do ebook.");
      let productId = draftId;
      if (!productId) {
        const product = await api.seller.createProduct(form);
        productId = product.id;
        setDraftId(productId);
      }
      if (cover) await uploadProductCover(productId, cover);
      if (form.type === "ebook" && content) {
        const existingFiles = await api.seller.productFiles(productId);
        if (!existingFiles.some(file => file.status === "ready")) await uploadProductFile(productId, content);
        await api.seller.submitProduct(productId);
      }
      return productId;
    },
    onSuccess: productId => navigate(`/produtor/produtos/${productId}`, { replace: true }),
  });
  const set = (field: keyof ProductInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(current => ({ ...current, [field]: field === "priceAmount" || field === "guaranteeDays" ? Number(event.target.value) : event.target.value }));
  if (categoryList.isPending) return <Loading />;
  if (categoryList.isError) return <ErrorState error={categoryList.error} retry={() => categoryList.refetch()} />;
  return <><PageHead title="Novo produto" desc="Escolha o formato. Um ebook pode ser submetido neste passo; num curso, adicionará os módulos, aulas e vídeos depois de criar o rascunho." />
    <Card title="Produto"><form className="stack-sm" onSubmit={event => { event.preventDefault(); create.mutate(); }}>
      <Field label="Formato"><div className="choice-grid">
        <button type="button" className={`choice ${form.type === "course" ? "on" : ""}`} onClick={() => { setForm(current => ({ ...current, type: "course" })); setContent(null); }}><Icon name="cap" size={22} /><b>Curso</b><small>Aulas organizadas em módulos, com vídeo.</small></button>
        <button type="button" className={`choice ${form.type === "ebook" ? "on" : ""}`} onClick={() => setForm(current => ({ ...current, type: "ebook" }))}><Icon name="file" size={22} /><b>Ebook</b><small>Um ficheiro PDF disponibilizado ao comprador.</small></button>
      </div></Field>
      <Field label="Categoria"><Select value={form.categoryId} onChange={set("categoryId")} required options={[["", "Seleccione uma categoria"], ...categoryList.data.map(category => [category.id, category.name] as [string, string])]} /></Field>
      <Field label="Nome"><Input value={form.name} onChange={set("name")} required /></Field>
      <Field label="Descrição"><Textarea value={form.description} onChange={set("description")} required /></Field>
      <Field label="Preço" help="Valor em meticais."><Input type="number" min="1" step="0.01" value={form.priceAmount || ""} onChange={set("priceAmount")} required suffix="MZN" /></Field>
      <Field label="Garantia em dias"><Input type="number" min="0" max="365" value={form.guaranteeDays ?? 0} onChange={set("guaranteeDays")} /></Field>
      {form.type === "ebook" ? <Field label="Ficheiro do ebook" help="Formato PDF."><input type="file" accept="application/pdf" required onChange={event => setContent(event.target.files?.[0] ?? null)} /></Field> : <Alert title="Conteúdo do curso" text="Depois de criar o curso, poderá adicionar módulos, aulas e os respectivos vídeos antes de o submeter para análise." />}
      <Field label="Capa (opcional)"><input type="file" accept="image/jpeg,image/png" onChange={event => setCover(event.target.files?.[0] ?? null)} /></Field>
      {create.isError && <Alert tone="danger" title="Não foi possível criar o produto" text={errorText(create.error)} />}
      <Btn type="submit" v="primary" loading={create.isPending}>{form.type === "ebook" ? "Criar e submeter para análise" : "Criar curso e adicionar aulas"}</Btn>
    </form></Card>
  </>;
}

export function SellerProduct() {
  const { id = "" } = useParams();
  const client = useQueryClient();
  const product = useQuery({ queryKey: ["seller", "product", id], queryFn: () => api.seller.product(id) });
  const content = useQuery({ queryKey: ["seller", "product-content", id], queryFn: () => api.seller.content(id) });
  const [moduleTitle, setModuleTitle] = useState("");
  const [lesson, setLesson] = useState({ moduleId: "", title: "", description: "" });
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
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
    mutationFn: (target: ({ type: "ebook"; fileId: string } | { type: "lesson"; lessonId: string }) & { previewWindow: Window | null }) => target.type === "ebook"
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
  const requestContent = (target: { type: "ebook"; fileId: string } | { type: "lesson"; lessonId: string }) => openContent.mutate({ ...target, previewWindow: window.open("about:blank", "_blank") });
  const addModule = useMutation({
    mutationFn: () => api.seller.createModule(id, moduleTitle, (content.data?.modules?.length ?? 0) + 1),
    onSuccess: created => {
      setModuleTitle("");
      setLesson(current => ({ ...current, moduleId: created.id }));
      client.invalidateQueries({ queryKey: ["seller", "product-content", id] });
    },
  });
  const addLesson = useMutation({
    mutationFn: async () => {
      if (!lesson.moduleId) throw new Error("Seleccione o módulo da aula.");
      if (!lessonVideo) throw new Error("Seleccione o vídeo da aula.");
      let lessonId = lessonDraftId;
      if (!lessonId) {
        const selectedModule = content.data?.modules?.find(module => module.id === lesson.moduleId);
        const created = await api.seller.createLesson(lesson.moduleId, { title: lesson.title, description: lesson.description, position: (selectedModule?.lessons?.length ?? 0) + 1, isPreview: false, releaseAfterDays: 0 });
        lessonId = created.id;
        setLessonDraftId(lessonId);
      }
      await uploadLessonFile(lessonId, lessonVideo);
      return lessonId;
    },
    onSuccess: () => {
      setLesson(current => ({ moduleId: current.moduleId, title: "", description: "" }));
      setLessonVideo(null);
      setLessonDraftId(null);
      client.invalidateQueries({ queryKey: ["seller", "product-content", id] });
    },
  });
  if (product.isPending || content.isPending) return <Loading />;
  if (product.isError || content.isError) return <ErrorState error={product.error ?? content.error} />;
  const value = product.data.product;
  const mainOffer = product.data.offers.find(offer => offer.isDefault);
  return <><PageHead over={<div className="row"><Badge tone={value.type === "course" ? "blue" : "green"}>{value.type === "course" ? "Curso" : "Ebook"}</Badge><Status s={value.status} /></div>} title={value.name} desc={value.description} actions={<div className="row">
    {value.status === "draft" && <Btn onClick={() => action.mutate("submit")} v="primary">Submeter para análise</Btn>}
    {value.status === "active" && <Btn onClick={() => action.mutate("edit")}>Retirar de venda e editar</Btn>}
    {["draft", "active"].includes(value.status) && <Btn onClick={() => action.mutate("archive")} v="danger">Arquivar</Btn>}
  </div>} />
    {action.isError && <Alert tone="danger" title="Não foi possível alterar o produto" text={errorText(action.error)} />}
    {openContent.isError && <Alert tone="danger" title="Não foi possível abrir o conteúdo" text={errorText(openContent.error)} />}
    <div className="product-detail-layout">
      <div className="stack">
        {value.type === "course" ? <CourseContent modules={content.data.modules ?? []} editable={value.status === "draft"} moduleTitle={moduleTitle} setModuleTitle={setModuleTitle} addModule={addModule} lesson={lesson} setLesson={setLesson} lessonVideo={lessonVideo} setLessonVideo={setLessonVideo} addLesson={addLesson} openingLessonId={openContent.variables?.type === "lesson" && openContent.isPending ? openContent.variables.lessonId : undefined} onOpenLesson={lessonId => requestContent({ type: "lesson", lessonId })} /> : <EbookContent files={content.data.files ?? []} openingFileId={openContent.variables?.type === "ebook" && openContent.isPending ? openContent.variables.fileId : undefined} onOpen={fileId => requestContent({ type: "ebook", fileId })} />}
      </div>
      <aside className="stack-sm">
        <Card title="Publicação" icon="store" tone="green"><dl className="dl product-facts"><dt>Estado</dt><dd><Status s={value.status} /></dd><dt>Preço</dt><dd>{mt(mainOffer?.priceAmount ?? 0)}</dd><dt>Formato</dt><dd>{value.type === "course" ? "Curso em vídeo" : "Ebook"}</dd><dt>Garantia</dt><dd>{value.guaranteeDays ? `${value.guaranteeDays} dias` : "Sem garantia"}</dd></dl>{value.status === "active" && <div className="product-checkout-link"><Btn to={`/checkout/${value.slug}`} icon="eye" block>Abrir página de compra</Btn></div>}</Card>
      </aside>
    </div>
  </>;
}

function EbookContent({ files, openingFileId, onOpen }: { files: ContentFile[]; openingFileId?: string; onOpen: (fileId: string) => void }) {
  return <Card title="Conteúdo do ebook" icon="file" tone="green" aside={files.length ? <Badge tone="neutral">{files.length} {files.length === 1 ? "ficheiro" : "ficheiros"}</Badge> : undefined}>{files.length ? <div className="content-list">{files.map(file => <div className="content-file" key={file.id}>
    <Tile icon="file" tone="green" />
    <div className="content-file-info"><strong>{file.originalName}</strong><span>{file.mimeType === "application/pdf" ? "Documento PDF" : file.mimeType} · {fileSize(file.sizeBytes)}</span></div>
    {file.status === "ready" ? <Btn s="sm" icon="eye" onClick={() => onOpen(file.id)} loading={openingFileId === file.id}>Abrir ficheiro</Btn> : <Status s={file.status} />}
  </div>)}</div> : <Empty icon="file" title="Sem ficheiros associados" desc="Um ebook só pode ser submetido depois de ter conteúdo pronto." />}</Card>;
}

function CourseContent({ modules, editable, moduleTitle, setModuleTitle, addModule, lesson, setLesson, lessonVideo, setLessonVideo, addLesson, openingLessonId, onOpenLesson }: {
  modules: NonNullable<Awaited<ReturnType<typeof api.seller.content>>["modules"]>;
  editable: boolean;
  moduleTitle: string;
  setModuleTitle: (value: string) => void;
  addModule: { mutate: () => void; isError: boolean; isPending: boolean; error: unknown };
  lesson: { moduleId: string; title: string; description: string };
  setLesson: React.Dispatch<React.SetStateAction<{ moduleId: string; title: string; description: string }>>;
  lessonVideo: File | null;
  setLessonVideo: (value: File | null) => void;
  addLesson: { mutate: () => void; isError: boolean; isPending: boolean; error: unknown };
  openingLessonId?: string;
  onOpenLesson: (lessonId: string) => void;
}) {
  return <div className="stack">
    <Card title="Conteúdo do curso" icon="cap" tone="blue">{modules.length ? <div className="course-content-list">{modules.map(module => <section className="course-module" key={module.id}><div className="course-module-title"><span>{module.position}</span><strong>{module.title}</strong></div>{module.lessons?.length ? <div>{module.lessons.map(item => { const hasVideo = item.files?.some(file => file.status === "ready" && file.purpose === "video"); return <div className="course-lesson" key={item.id}><div><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</div>{hasVideo ? <Btn s="sm" icon="play" onClick={() => onOpenLesson(item.id)} loading={openingLessonId === item.id}>Ver aula</Btn> : <Badge tone="warning">Sem vídeo pronto</Badge>}</div>; })}</div> : <p className="muted course-module-empty">Ainda não tem aulas.</p>}</section>)}</div> : <Empty icon="cap" title="O curso ainda não tem conteúdo" desc="Adicione pelo menos um módulo, uma aula e o vídeo dessa aula." />}</Card>
    {editable && <div className="g2">
      <Card title="Adicionar módulo"><form className="stack-sm" onSubmit={event => { event.preventDefault(); addModule.mutate(); }}><Field label="Título do módulo"><Input value={moduleTitle} onChange={event => setModuleTitle(event.target.value)} required /></Field>{addModule.isError && <Alert tone="danger" title="Não foi possível criar o módulo" text={errorText(addModule.error)} />}<Btn type="submit" loading={addModule.isPending}>Adicionar módulo</Btn></form></Card>
      <Card title="Adicionar aula"><form className="stack-sm" onSubmit={event => { event.preventDefault(); addLesson.mutate(); }}><Field label="Módulo"><Select value={lesson.moduleId} onChange={event => setLesson(current => ({ ...current, moduleId: event.target.value }))} required options={[["", "Seleccione o módulo"], ...modules.map(module => [module.id, module.title] as [string, string])]} /></Field><Field label="Título da aula"><Input value={lesson.title} onChange={event => setLesson(current => ({ ...current, title: event.target.value }))} required /></Field><Field label="Descrição (opcional)"><Textarea value={lesson.description} onChange={event => setLesson(current => ({ ...current, description: event.target.value }))} /></Field><Field label="Vídeo da aula" help="Formato MP4, até 2 GB."><input type="file" accept="video/mp4" required onChange={event => setLessonVideo(event.target.files?.[0] ?? null)} /></Field>{lessonVideo && <small className="muted">{lessonVideo.name}</small>}{addLesson.isError && <Alert tone="danger" title="Não foi possível criar a aula" text={errorText(addLesson.error)} />}<Btn type="submit" loading={addLesson.isPending} disabled={!modules.length}>Adicionar aula e vídeo</Btn></form></Card>
    </div>}
  </div>;
}

function OrderTable({ rows }: { rows: Awaited<ReturnType<typeof api.seller.orders>>["items"] }) {
  return <Table rows={rows} rowKey={order => order.id} cols={[
    { label: "Encomenda", render: order => order.orderNumber },
    { label: "Produto", render: order => order.items?.[0]?.productName ?? "—" },
    { label: "Total", render: order => mt(order.totalAmount) },
    { label: "Estado", render: order => <Status s={order.status} /> },
    { label: "Data", render: order => date(order.createdAt) },
  ]} />;
}

export function SellerOrders() {
  const query = useQuery({ queryKey: ["seller", "orders"], queryFn: () => api.seller.orders() });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  return <><PageHead title="Vendas" desc="Encomendas recebidas pelo produtor." /><Card flush>{query.data.items.length ? <OrderTable rows={query.data.items} /> : <Empty icon="receipt" title="Ainda não existem vendas" />}</Card></>;
}

export function SellerFinance() {
  const client = useQueryClient();
  const balance = useQuery({ queryKey: ["seller", "balance"], queryFn: api.seller.balance });
  const accounts = useQuery({ queryKey: ["seller", "payout-accounts"], queryFn: api.seller.payoutAccounts });
  const payouts = useQuery({ queryKey: ["seller", "payouts"], queryFn: api.seller.payouts });
  const [account, setAccount] = useState({ provider: "mpesa", accountName: "", accountReference: "" });
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(() => !!readPayoutOperation());
  const [amount, setAmount] = useState(() => readPayoutOperation()?.body.amount.toString() ?? "");
  const [accountId, setAccountId] = useState(() => readPayoutOperation()?.body.payoutAccountId ?? "");
  const [payoutOperation, setPayoutOperation] = useState<PayoutOperation | null>(readPayoutOperation);
  const addAccount = useMutation({
    mutationFn: () => api.seller.addPayoutAccount({ type: "mobile_money", ...account }),
    onSuccess: created => {
      setAccount({ provider: "mpesa", accountName: "", accountReference: "" });
      setAccountId(created.id);
      setAccountModalOpen(false);
      client.invalidateQueries({ queryKey: ["seller", "payout-accounts"] });
    },
  });
  const requestPayout = useMutation({
    mutationFn: (operation: NonNullable<typeof payoutOperation>) => api.seller.requestPayout(operation.body, operation.key),
    onSuccess: () => {
      setPayoutOperation(null);
      storePayoutOperation(null);
      setAmount("");
      setPayoutModalOpen(false);
      client.invalidateQueries({ queryKey: ["seller", "balance"] });
      client.invalidateQueries({ queryKey: ["seller", "payouts"] });
    },
    onError: error => {
      if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
        setPayoutOperation(null);
        storePayoutOperation(null);
      }
    },
  });
  useEffect(() => {
    if (!payoutOperation || balance.data === undefined) return;
    if (payoutOperation.body.amount >= 100 && payoutOperation.body.amount <= balance.data.available) return;

    setPayoutOperation(null);
    storePayoutOperation(null);
  }, [balance.data, payoutOperation]);
  const requestedAmount = Number(amount);
  const amountInvalid = !Number.isFinite(requestedAmount) || requestedAmount < 100 || requestedAmount > (balance.data?.available ?? 0);
  const submitPayout = () => {
    if (amountInvalid) return;

    const operation = payoutOperation ?? { key: crypto.randomUUID(), body: { payoutAccountId: accountId, amount: Number(amount), type: "standard" } };
    setPayoutOperation(operation);
    storePayoutOperation(operation);
    requestPayout.mutate(operation);
  };
  if (balance.isPending || accounts.isPending || payouts.isPending) return <Loading />;
  if (balance.isError || accounts.isError || payouts.isError) return <ErrorState error={balance.error ?? accounts.error ?? payouts.error} />;
  const activeAccounts = accounts.data.filter(item => item.status === "active");
  return <><PageHead title="Financeiro" desc="Saldo, destinos de recebimento e histórico de saques." actions={<Btn v="primary" icon="cash" disabled={!activeAccounts.length} onClick={() => setPayoutModalOpen(true)}>Solicitar saque</Btn>} />
    <div className="g3">
      <section className="balance-card"><div className="row-between"><small>Disponível para saque</small><Badge tone="success">MZN</Badge></div><span className="big">{mt(balance.data.available)}</span><small>O saque é enviado para um destino activo da sua conta.</small></section>
      <Kpi label="A libertar" value={mt(balance.data.pending)} icon="clock" tone="warning" hint="Valores ainda indisponíveis para saque" />
      <Kpi label="Em trânsito" value={mt(balance.data.payoutInTransit)} icon="cash" tone="info" hint="Pedidos já em processamento" />
    </div>
    <div className="g-main">
      <Card title="Saques" icon="cash" flush>{payouts.data.items.length ? <Table dense rows={payouts.data.items} rowKey={payout => payout.id} cols={[{ label: "Pedido", render: payout => <span className="mono">{payout.id.slice(0, 8)}…</span> }, { label: "Data", render: payout => date(payout.requestedAt) }, { label: "Destino", render: payout => payout.destinationName }, { label: "Valor", num: true, render: payout => <b style={{ fontWeight: 600 }}>{mt(payout.amount)}</b> }, { label: "Estado", render: payout => <Status s={payout.status} /> }]} /> : <Empty icon="cash" title="Ainda não existem pedidos de saque" desc="Os pedidos efectuados aparecerão aqui." />}</Card>
      <div className="stack-sm" style={{ gap: 16 }}>
        <Card title="Contas de recebimento" icon="bank">{accounts.data.length ? <div className="stack-sm">{accounts.data.map(item => <div className="offer-row" key={item.id}><Tile icon="wallet" tone={item.status === "active" ? "success" : "neutral"} s="sm" /><div className="grow stack-xs"><b>{item.provider === "mpesa" ? "M-Pesa" : item.provider === "emola" ? "e-Mola" : item.provider}</b><small className="faint">{item.accountName} · {item.accountReference || "referência protegida"}</small></div>{item.isPrimary && <Badge tone="primary">Principal</Badge>}<Status s={item.status} /></div>)}</div> : <Empty icon="wallet" title="Sem contas de recebimento" />}<Btn s="sm" icon="plus" onClick={() => setAccountModalOpen(true)}>Adicionar conta</Btn></Card>
        <Card title="Composição do saldo" icon="shield" tone="info"><dl className="dl"><dt>Disponível</dt><dd>{mt(balance.data.available)}</dd><dt>Pendente</dt><dd>{mt(balance.data.pending)}</dd><dt>Reserva</dt><dd>{mt(balance.data.reserved)}</dd><dt>Em trânsito</dt><dd>{mt(balance.data.payoutInTransit)}</dd></dl></Card>
      </div>
    </div>
    {accountModalOpen && <Modal title="Adicionar conta de recebimento" desc="A conta será usada para receber os seus saques." onClose={() => setAccountModalOpen(false)} foot={<><Btn onClick={() => setAccountModalOpen(false)}>Cancelar</Btn><Btn v="primary" loading={addAccount.isPending} onClick={() => addAccount.mutate()} disabled={!account.accountName.trim() || !account.accountReference.trim()}>Adicionar conta</Btn></>}><div className="stack-sm"><Field label="Operador"><Select value={account.provider} onValueChange={provider => setAccount(current => ({ ...current, provider }))} options={[["mpesa", "M-Pesa"], ["emola", "e-Mola"]]} /></Field><Field label="Nome do titular"><Input value={account.accountName} onChange={event => setAccount(current => ({ ...current, accountName: event.target.value }))} /></Field><Field label="Número" help="Formato +258841234567"><Input value={account.accountReference} onChange={event => setAccount(current => ({ ...current, accountReference: event.target.value }))} /></Field>{addAccount.isError && <Alert tone="danger" title="Não foi possível adicionar a conta" text={errorText(addAccount.error)} />}</div></Modal>}
    {payoutModalOpen && <Modal title={payoutOperation ? "Retomar pedido de saque" : "Solicitar saque"} desc={`Disponível: ${mt(balance.data.available)}`} onClose={() => { if (!payoutOperation) setPayoutModalOpen(false); }} noClose={!!payoutOperation} foot={<><Btn onClick={() => setPayoutModalOpen(false)} disabled={!!payoutOperation}>Cancelar</Btn><Btn v="primary" loading={requestPayout.isPending} onClick={submitPayout} disabled={!accountId || !amount || amountInvalid}>{payoutOperation ? "Retomar pedido" : "Confirmar saque"}</Btn></>}><div className="stack-sm"><Field label="Valor" help={requestedAmount > balance.data.available ? `O máximo disponível é ${mt(balance.data.available)}.` : "Mínimo 100 MT."}><Input type="number" min="100" max={balance.data.available} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} disabled={!!payoutOperation} suffix="MT" /></Field><Field label="Destino"><Select value={accountId} onValueChange={setAccountId} disabled={!!payoutOperation} options={[["", "Seleccione um destino"], ...activeAccounts.map(item => [item.id, `${item.provider === "mpesa" ? "M-Pesa" : "e-Mola"} · ${item.accountName}`] as [string, string])]} /></Field>{requestPayout.isError && <Alert tone="danger" title="Não foi possível confirmar o pedido" text={errorText(requestPayout.error)} />}</div></Modal>}
  </>;
}

export function SellerVerification() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["seller", "verification"], queryFn: api.seller.verification });
  const profile = useQuery({ queryKey: ["seller", "profile"], queryFn: api.seller.profile });
  const [nationalID, setNationalID] = useState<File | null>(null);
  const [nuit, setNuit] = useState<File | null>(null);
  const [registration, setRegistration] = useState<File | null>(null);
  const submit = useMutation({
    mutationFn: async () => {
      if (!nationalID) throw new Error("Seleccione o documento de identificação.");
      const documents = [await uploadVerificationDocument("national_id", nationalID)];
      if (profile.data?.businessType === "company") {
        if (!nuit || !registration) throw new Error("Empresas devem enviar o NUIT e a certidão comercial.");
        documents.push(await uploadVerificationDocument("nuit", nuit));
        documents.push(await uploadVerificationDocument("business_registration", registration));
      }
      return api.seller.submitVerification(documents);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["seller", "verification"] }),
  });
  if (query.isPending || profile.isPending) return <Loading />;
  if (query.isError || profile.isError) return <ErrorState error={query.error ?? profile.error} />;
  const status = verificationStatus(query.data.verification);
  return <><PageHead title="Verificação do produtor" desc="Envie os documentos necessários para validar o seu perfil comercial." />
    <Card title="Estado"><Status s={status} />{query.data.documents.length > 0 && <p>{query.data.documents.length} documento(s) associados.</p>}</Card>
    {["draft", "changes_requested"].includes(status) && <Card title="Enviar documentos"><form className="stack-sm" onSubmit={event => { event.preventDefault(); submit.mutate(); }}>
      <Field label="BI ou documento de identificação"><input type="file" accept="application/pdf,image/jpeg,image/png" required onChange={event => setNationalID(event.target.files?.[0] ?? null)} /></Field>
      {profile.data.businessType === "company" && <><Field label="Documento NUIT"><input type="file" accept="application/pdf,image/jpeg,image/png" required onChange={event => setNuit(event.target.files?.[0] ?? null)} /></Field><Field label="Certidão comercial"><input type="file" accept="application/pdf,image/jpeg,image/png" required onChange={event => setRegistration(event.target.files?.[0] ?? null)} /></Field></>}
      {submit.isError && <Alert tone="danger" title="Não foi possível submeter a verificação" text={errorText(submit.error)} />}
      <Btn type="submit" v="primary" loading={submit.isPending}>Enviar para análise</Btn>
    </form></Card>}
  </>;
}

export function SellerAccount() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["seller", "profile"], queryFn: api.seller.profile });
  const [draft, setDraft] = useState<Partial<SellerProfileInput> | null>(null);
  const save = useMutation({ mutationFn: (body: Partial<SellerProfileInput>) => api.seller.updateProfile(body), onSuccess: () => { setDraft(null); client.invalidateQueries({ queryKey: ["seller", "profile"] }); } });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  const value = { ...query.data, ...draft };
  return <><PageHead title="Perfil comercial" desc="Informação pública e contactos de suporte apresentados aos seus clientes." />
    <div className="seller-profile-layout">
      <form onSubmit={event => { event.preventDefault(); save.mutate(draft ?? {}); }}><Card title="Informação pública" icon="store" foot={<div className="seller-profile-actions">{draft && <Btn onClick={() => setDraft(null)}>Descartar</Btn>}<Btn type="submit" v="primary" loading={save.isPending} disabled={!draft}>Guardar alterações</Btn></div>}>
        <div className="seller-profile-identity"><Avatar name={value.displayName} s="xl" /><div><strong>{value.displayName}</strong><span>vendaqui.app/{value.slug}</span><Status s={value.status} /></div></div>
        <div className="g2 seller-profile-fields">
          <Field label="Nome público" help="Nome apresentado no checkout e aos compradores."><Input value={value.displayName} onChange={event => setDraft(current => ({ ...current, displayName: event.target.value }))} required /></Field>
          <Field label="Email de suporte" help="Usado pelos clientes para pedir ajuda."><Input type="email" value={value.supportEmail} onChange={event => setDraft(current => ({ ...current, supportEmail: event.target.value }))} required /></Field>
          <Field label="WhatsApp" help="Formato internacional, por exemplo +258841234567."><Input value={value.whatsapp} onChange={event => setDraft(current => ({ ...current, whatsapp: event.target.value }))} inputMode="tel" /></Field>
          <Field label="Apresentação" className="seller-profile-bio"><Textarea rows={5} value={value.bio} onChange={event => setDraft(current => ({ ...current, bio: event.target.value }))} /></Field>
        </div>
        {save.isError && <Alert tone="danger" title="Não foi possível guardar" text={errorText(save.error)} />}
      </Card></form>
      <aside className="stack-sm">
        <Card title="Pré-visualização" icon="eye" tone="green"><div className="seller-profile-preview"><Avatar name={value.displayName} s="lg" /><div><strong>{value.displayName || "Nome do produtor"}</strong><p>{value.bio || "A apresentação do produtor aparecerá aqui."}</p></div><div className="seller-profile-contacts">{value.supportEmail && <span><Icon name="mail" size={15} />{value.supportEmail}</span>}{value.whatsapp && <span><Icon name="phone" size={15} />{value.whatsapp}</span>}</div></div></Card>
        <Card title="Dados comerciais" icon="idcard"><dl className="dl product-facts"><dt>Tipo</dt><dd>{value.businessType === "company" ? "Empresa" : "Pessoa singular"}</dd>{value.businessName && <><dt>Nome legal</dt><dd>{value.businessName}</dd></>}{value.nuit && <><dt>NUIT</dt><dd>{value.nuit}</dd></>}<dt>Estado</dt><dd><Status s={value.status} /></dd></dl><p className="seller-profile-note">Os dados comerciais sujeitos à verificação não são alterados nesta página.</p></Card>
      </aside>
    </div>
  </>;
}
