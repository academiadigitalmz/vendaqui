import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type PayoutRequest } from "@/api/endpoints";
import { HttpError } from "@/api/http";
import { date, mt } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { AreaChart } from "@/components/chart";
import { Drawer } from "@/components/overlay";
import {
  Alert,
  Btn,
  Card,
  Checkbox,
  Empty,
  ErrorState,
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

const errorText = (error: unknown) =>
  error instanceof HttpError
    ? error.message
    : "Não foi possível concluir. Verifique a ligação e tente novamente.";

export function Overview() {
  const finance = useQuery({
    queryKey: ["backoffice", "finance-overview"],
    queryFn: api.backoffice.financeOverview,
  });
  const orders = useQuery({
    queryKey: ["backoffice", "orders", "dashboard"],
    queryFn: () => api.backoffice.orders(),
  });
  const kyc = useQuery({
    queryKey: ["backoffice", "kyc", "pending"],
    queryFn: () => api.backoffice.verifications("pending"),
  });
  const moderation = useQuery({
    queryKey: ["backoffice", "moderation", "pending"],
    queryFn: () => api.backoffice.moderation("pending"),
  });
  const payouts = useQuery({
    queryKey: ["backoffice", "payouts", "pending_approval"],
    queryFn: () => api.backoffice.payouts("pending_approval"),
  });
  const queries = [finance, orders, kyc, moderation, payouts];
  const pending = queries.some((query) => query.isPending);
  const failed = queries.find((query) => query.isError);
  if (pending) return <Loading />;
  if (failed) return <ErrorState error={failed.error} />;

  const days = Array.from({ length: 7 }, (_, index) => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() - (6 - index));
    return value;
  });
  const paidOrders = orders.data!.items.filter((order) => order.status === "paid");
  const volume = days.map((day) =>
    paidOrders
      .filter((order) => {
        const created = new Date(order.createdAt);
        return (
          created.getFullYear() === day.getFullYear() &&
          created.getMonth() === day.getMonth() &&
          created.getDate() === day.getDate()
        );
      })
      .reduce((total, order) => total + order.totalAmount, 0),
  );
  const labels = days.map((day) =>
    day.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" }).replace(".", ""),
  );

  return (
    <>
      <PageHead title="Backoffice" desc="Visão operacional e financeira da plataforma." />
      <div className="g4">
        <Kpi
          label="Pagamentos confirmados"
          value={mt(finance.data!.confirmedPayments)}
          hint="Volume confirmado"
        />
        <Kpi
          label="Receita de comissões"
          value={mt(finance.data!.commissionRevenue)}
          hint="Comissões registadas"
        />
        <Kpi
          label="Saques em trânsito"
          value={mt(finance.data!.payoutsInFlight)}
          hint="Já em processamento"
        />
      </div>
      <div className="g-main">
        <Card
          title="Volume confirmado"
          aside={
            <span className="faint">Últimas {orders.data!.items.length} encomendas carregadas</span>
          }
        >
          {volume.some(Boolean) ? (
            <AreaChart
              data={volume}
              labels={labels}
              name1="Volume"
              aria="Volume diário das encomendas pagas carregadas"
              h={250}
            />
          ) : (
            <Empty icon="bars" title="Ainda não existe volume confirmado neste período" />
          )}
        </Card>
        <Card title="Fila de trabalho">
          <div className="stack-sm">
            <QueueLink
              to="/admin/kyc"
              icon="idcard"
              tone="warning"
              label="Verificações KYC"
              count={kyc.data!.total}
            />
            <QueueLink
              to="/admin/produtos"
              icon="package"
              tone="purple"
              label="Produtos em análise"
              count={moderation.data!.total}
            />
            <QueueLink
              to="/admin/saques"
              icon="cash"
              tone="info"
              label="Saques para aprovar"
              count={payouts.data!.total}
            />
          </div>
        </Card>
      </div>
      <Card
        title="Encomendas recentes"
        flush
        aside={
          <Link className="ad-link" to="/admin/encomendas">
            Ver todas
          </Link>
        }
      >
        {orders.data!.items.length ? (
          <OrdersTable rows={orders.data!.items.slice(0, 8)} />
        ) : (
          <Empty icon="receipt" title="Sem encomendas" />
        )}
      </Card>
    </>
  );
}

function QueueLink({
  to,
  icon,
  tone,
  label,
  count,
}: {
  to: string;
  icon: Parameters<typeof Tile>[0]["icon"];
  tone: Parameters<typeof Tile>[0]["tone"];
  label: string;
  count: number;
}) {
  return (
    <Link className="queue-item" to={to} style={{ textDecoration: "none" }}>
      <Tile icon={icon} tone={tone} />
      <span className="grow">
        <b>{label}</b>
      </span>
      <span className="n">{count}</span>
    </Link>
  );
}

export function Sellers() {
  const client = useQueryClient();
  const { prompt } = useApp();
  const query = useQuery({
    queryKey: ["backoffice", "sellers"],
    queryFn: () => api.backoffice.sellers(),
  });
  const update = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason: string }) =>
      api.backoffice.updateSellerStatus(id, status, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["backoffice", "sellers"] }),
  });
  const changeStatus = async (id: string, status: "active" | "suspended") => {
    const reason = await prompt({
      title: status === "suspended" ? "Suspender produtor" : "Reactivar produtor",
      message: "Esta alteração fica registada para auditoria.",
      label: "Motivo da alteração",
      placeholder: "Explique por que pretende alterar o estado desta conta.",
      confirmLabel: status === "suspended" ? "Suspender" : "Reactivar",
    });
    if (reason !== null) update.mutate({ id, status, reason });
  };
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  return (
    <>
      <PageHead title="Produtores" desc="Perfis comerciais registados." />
      {update.isError && (
        <Alert
          tone="danger"
          title="Não foi possível alterar o produtor"
          text={errorText(update.error)}
        />
      )}
      <Card flush>
        {query.data.items.length ? (
          <Table
            rows={query.data.items}
            rowKey={(seller) => seller.id}
            cols={[
              {
                label: "Produtor",
                render: (seller) => (
                  <>
                    <strong>{seller.displayName}</strong>
                    <br />
                    <small>{seller.supportEmail}</small>
                  </>
                ),
              },
              { label: "NUIT", render: (seller) => seller.nuit || "—" },
              { label: "Estado", render: (seller) => <Status s={seller.status} /> },
              {
                label: "Acção",
                render: (seller) =>
                  seller.status === "suspended" ? (
                    <Btn s="sm" onClick={() => changeStatus(seller.id, "active")}>
                      Reactivar
                    </Btn>
                  ) : (
                    <Btn s="sm" v="danger" onClick={() => changeStatus(seller.id, "suspended")}>
                      Suspender
                    </Btn>
                  ),
              },
            ]}
          />
        ) : (
          <Empty icon="store" title="Sem produtores" />
        )}
      </Card>
    </>
  );
}

export function Kyc() {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["backoffice", "kyc"],
    queryFn: () => api.backoffice.verifications(),
  });
  const start = useMutation({
    mutationFn: (id: string) => api.backoffice.startVerification(id),
    onSuccess: (_, id) => {
      setSelectedId(id);
      client.invalidateQueries({ queryKey: ["backoffice", "kyc"] });
    },
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  return (
    <>
      <PageHead
        title="Verificações KYC"
        desc="Analise os dados e documentos do produtor antes de tomar uma decisão."
      />
      {start.isError && (
        <Alert
          tone="danger"
          title="Não foi possível iniciar a análise"
          text={errorText(start.error)}
        />
      )}
      <Card flush>
        {query.data.items.length ? (
          <Table
            rows={query.data.items}
            rowKey={(item) => item.id}
            cols={[
              {
                label: "Verificação",
                render: (item) => (
                  <>
                    <span className="mono">{item.id}</span>
                    <br />
                    <small className="faint">
                      {item.submittedAt
                        ? `Submetida em ${date(item.submittedAt)}`
                        : "Ainda não submetida"}
                    </small>
                  </>
                ),
              },
              { label: "Estado", render: (item) => <Status s={item.status} /> },
              {
                label: "Acção",
                render: (item) =>
                  item.status === "pending" ? (
                    <Btn
                      s="sm"
                      v="primary"
                      loading={start.isPending && start.variables === item.id}
                      onClick={() => start.mutate(item.id)}
                    >
                      Iniciar análise
                    </Btn>
                  ) : (
                    <Btn s="sm" onClick={() => setSelectedId(item.id)}>
                      {item.status === "in_review" ? "Continuar análise" : "Ver detalhes"}
                    </Btn>
                  ),
              },
            ]}
          />
        ) : (
          <Empty icon="idcard" title="Sem verificações" />
        )}
      </Card>
      {selectedId && <KycReview id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}

const documentLabel: Record<string, string> = {
  national_id: "Documento de identificação",
  nuit: "Documento NUIT",
  business_registration: "Certidão comercial",
};

function KycReview({ id, onClose }: { id: string; onClose: () => void }) {
  const client = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");
  const [viewedDocuments, setViewedDocuments] = useState<Set<string>>(new Set());
  const [documentError, setDocumentError] = useState<string | null>(null);
  const details = useQuery({
    queryKey: ["backoffice", "kyc", id],
    queryFn: () => api.backoffice.verification(id),
  });
  const sellerId = details.data?.verification.sellerId;
  const seller = useQuery({
    queryKey: ["backoffice", "seller", sellerId],
    queryFn: () => api.backoffice.seller(sellerId!),
    enabled: !!sellerId,
  });
  const decide = useMutation({
    mutationFn: (action: "approve" | "reject" | "request-changes") =>
      api.backoffice.decideVerification(id, action, reviewNotes.trim()),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["backoffice", "kyc"] });
      client.invalidateQueries({ queryKey: ["backoffice", "sellers"] });
      onClose();
    },
  });
  const openDocument = async (documentId: string) => {
    setDocumentError(null);
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const access = await api.backoffice.verificationDocumentAccess(id, documentId);
      setViewedDocuments((current) => new Set(current).add(documentId));
      if (tab) tab.location.replace(access.url);
      else window.open(access.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      tab?.close();
      setDocumentError(errorText(error));
    }
  };
  if (details.isError || seller.isError)
    return (
      <Drawer over={id} title="Análise KYC" onClose={onClose}>
        <ErrorState error={details.error ?? seller.error} />
      </Drawer>
    );
  if (details.isPending || seller.isPending)
    return (
      <Drawer over={id} title="Análise KYC" onClose={onClose}>
        <Loading />
      </Drawer>
    );
  const verification = details.data.verification;
  const allDocumentsViewed =
    details.data.documents.length > 0 &&
    details.data.documents.every((document) => viewedDocuments.has(document.id));
  const canDecide =
    verification.status === "in_review" && allDocumentsViewed && reviewNotes.trim().length > 0;
  return (
    <Drawer
      over={id}
      title={seller.data.displayName}
      sub={<Status s={verification.status} />}
      onClose={onClose}
      foot={
        verification.status === "in_review" ? (
          <>
            <Btn
              onClick={() => decide.mutate("request-changes")}
              disabled={!canDecide || decide.isPending}
            >
              Pedir alterações
            </Btn>
            <Btn
              v="danger"
              onClick={() => decide.mutate("reject")}
              disabled={!canDecide || decide.isPending}
            >
              Rejeitar
            </Btn>
            <Btn
              v="primary"
              onClick={() => decide.mutate("approve")}
              disabled={!canDecide || decide.isPending}
            >
              Aprovar
            </Btn>
          </>
        ) : undefined
      }
    >
      <section className="stack-sm">
        <h3 className="section-title">Dados do produtor</h3>
        <dl className="dl">
          <dt>Nome público</dt>
          <dd>{seller.data.displayName}</dd>
          <dt>Tipo</dt>
          <dd>{seller.data.businessType === "company" ? "Empresa" : "Pessoa singular"}</dd>
          {seller.data.businessName && (
            <>
              <dt>Nome legal</dt>
              <dd>{seller.data.businessName}</dd>
            </>
          )}
          <dt>NUIT</dt>
          <dd className="mono">{seller.data.nuit || "—"}</dd>
          <dt>Email de suporte</dt>
          <dd>{seller.data.supportEmail || "—"}</dd>
          <dt>WhatsApp</dt>
          <dd>{seller.data.whatsapp || "—"}</dd>
        </dl>
      </section>
      <section className="stack-sm">
        <h3 className="section-title">Documentos</h3>
        {documentError && (
          <Alert tone="danger" title="Não foi possível abrir o documento" text={documentError} />
        )}
        {details.data.documents.length ? (
          details.data.documents.map((document) => (
            <div className="offer-row" key={document.id}>
              <Tile
                icon="file"
                tone={viewedDocuments.has(document.id) ? "success" : "neutral"}
                s="sm"
              />
              <div className="grow stack-xs">
                <b>{documentLabel[document.documentType] ?? document.documentType}</b>
                <small className="faint">
                  {document.originalName} ·{" "}
                  {(document.sizeBytes / 1024 / 1024).toFixed(2).replace(".", ",")} MB
                </small>
              </div>
              <Btn s="sm" icon="eye" onClick={() => openDocument(document.id)}>
                {viewedDocuments.has(document.id) ? "Abrir novamente" : "Abrir documento"}
              </Btn>
            </div>
          ))
        ) : (
          <Alert
            tone="danger"
            title="Nenhum documento associado"
            text="Esta verificação não pode ser decidida sem documentos."
          />
        )}
      </section>
      {verification.status === "in_review" && (
        <section className="stack-sm">
          <h3 className="section-title">Decisão</h3>
          {!allDocumentsViewed && (
            <Alert
              tone="warning"
              title="Reveja todos os documentos"
              text="Abra cada documento antes de tomar uma decisão."
            />
          )}
          <label className="ad-field">
            <span className="ad-label">Notas da análise</span>
            <Textarea
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              rows={4}
              placeholder="Registe o que foi verificado e justifique a decisão."
            />
          </label>
          {decide.isError && (
            <Alert
              tone="danger"
              title="Não foi possível registar a decisão"
              text={errorText(decide.error)}
            />
          )}
        </section>
      )}
      {verification.reviewNotes && (
        <section className="stack-sm">
          <h3 className="section-title">Notas registadas</h3>
          <p>{verification.reviewNotes}</p>
        </section>
      )}
    </Drawer>
  );
}

export function Moderation() {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["backoffice", "moderation"],
    queryFn: () => api.backoffice.moderation(),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  return (
    <>
      <PageHead
        title="Moderação de produtos"
        desc="Reveja os dados, preço e conteúdo antes de decidir sobre a publicação."
      />
      <Card flush>
        {query.data.items.length ? (
          <Table
            rows={query.data.items}
            rowKey={(item) => item.id}
            cols={[
              {
                label: "Pedido",
                render: (item) => (
                  <>
                    <span className="mono">{item.id}</span>
                    <br />
                    <small className="faint">Submetido em {date(item.submittedAt)}</small>
                  </>
                ),
              },
              {
                label: "Produto",
                render: (item) => <span className="mono faint">{item.productId}</span>,
              },
              { label: "Estado", render: (item) => <Status s={item.status} /> },
              {
                label: "Acção",
                render: (item) => (
                  <Btn
                    s="sm"
                    v={item.status === "pending" ? "primary" : "secondary"}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {item.status === "pending" ? "Analisar produto" : "Ver detalhes"}
                  </Btn>
                ),
              },
            ]}
          />
        ) : (
          <Empty icon="package" title="Sem produtos por analisar" />
        )}
      </Card>
      {selectedId && (
        <ProductReview
          id={selectedId}
          onClose={() => {
            setSelectedId(null);
            client.invalidateQueries({ queryKey: ["backoffice", "moderation"] });
          }}
        />
      )}
    </>
  );
}

function ProductReview({ id, onClose }: { id: string; onClose: () => void }) {
  const client = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");
  const [contentReviewed, setContentReviewed] = useState(false);
  const [viewedFiles, setViewedFiles] = useState<Set<string>>(new Set());
  const [fileError, setFileError] = useState<string | null>(null);
  const details = useQuery({
    queryKey: ["backoffice", "moderation", id],
    queryFn: () => api.backoffice.moderationDetails(id),
  });
  const productId = details.data?.product.id;
  const sellerId = details.data?.product.sellerId;
  const content = useQuery({
    queryKey: ["backoffice", "product-content", productId],
    queryFn: () => api.backoffice.productContent(productId!),
    enabled: !!productId,
  });
  const seller = useQuery({
    queryKey: ["backoffice", "seller", sellerId],
    queryFn: () => api.backoffice.seller(sellerId!),
    enabled: !!sellerId,
  });
  const decide = useMutation({
    mutationFn: (action: "approve" | "reject" | "request-changes") =>
      api.backoffice.decideProduct(id, action, reviewNotes.trim()),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["backoffice", "moderation"] });
      onClose();
    },
  });
  const openFile = async (fileId: string, lessonId?: string) => {
    setFileError(null);
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const access = lessonId
        ? await api.backoffice.lessonFileAccess(lessonId, fileId)
        : await api.backoffice.productFileAccess(productId!, fileId);
      setViewedFiles((current) => new Set(current).add(fileId));
      if (tab) tab.location.replace(access.url);
      else window.open(access.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      tab?.close();
      setFileError(errorText(error));
    }
  };
  if (details.isError || content.isError || seller.isError)
    return (
      <Drawer className="drawer-review" over={id} title="Revisão do produto" onClose={onClose}>
        <ErrorState error={details.error ?? content.error ?? seller.error} />
      </Drawer>
    );
  if (details.isPending || content.isPending || seller.isPending)
    return (
      <Drawer className="drawer-review" over={id} title="Revisão do produto" onClose={onClose}>
        <Loading />
      </Drawer>
    );
  const request = details.data.request;
  const product = details.data.product;
  const defaultOffer = details.data.offers.find((offer) => offer.isDefault);
  const productFiles = content.data.files ?? [];
  const lessonFiles = (content.data.modules ?? []).flatMap((module) =>
    (module.lessons ?? []).flatMap((lesson) => lesson.files ?? []),
  );
  const reviewableFiles = [...productFiles, ...lessonFiles].filter(
    (file) => file.status === "ready",
  );
  const allFilesViewed = reviewableFiles.every((file) => viewedFiles.has(file.id));
  const canDecide = request.status === "pending" && contentReviewed && allFilesViewed;
  const reviewFoot =
    request.status === "pending" ? (
      <div className="review-actions">
        <Btn
          onClick={() => decide.mutate("request-changes")}
          disabled={!canDecide || decide.isPending}
        >
          Pedir alterações
        </Btn>
        <div>
          <Btn
            v="danger"
            onClick={() => decide.mutate("reject")}
            disabled={!canDecide || decide.isPending}
          >
            Rejeitar
          </Btn>
          <Btn
            v="primary"
            onClick={() => decide.mutate("approve")}
            disabled={!canDecide || decide.isPending}
          >
            Aprovar
          </Btn>
        </div>
      </div>
    ) : undefined;
  return (
    <Drawer
      className="drawer-review"
      over={
        <span className="mono" title={id}>
          Pedido {id.slice(0, 8)}…
        </span>
      }
      title={product.name}
      sub={
        <div className="row">
          <Status s={request.status} />
          <span className="faint">{product.type === "course" ? "Curso" : "Ebook"}</span>
        </div>
      }
      onClose={onClose}
      foot={reviewFoot}
    >
      <section className="review-section">
        <div className="review-section-head">
          <div>
            <h3>Resumo do produto</h3>
            <p>Informação submetida pelo produtor.</p>
          </div>
        </div>
        <div className="review-facts">
          <div>
            <span>Produtor</span>
            <strong>{seller.data.displayName}</strong>
          </div>
          <div>
            <span>Preço principal</span>
            <strong>{defaultOffer ? mt(defaultOffer.priceAmount) : "—"}</strong>
          </div>
          <div>
            <span>Garantia</span>
            <strong>
              {product.guaranteeDays ? `${product.guaranteeDays} dias` : "Sem garantia"}
            </strong>
          </div>
        </div>
        <div className="review-description">
          <span>Descrição</span>
          <p>{product.description}</p>
        </div>
      </section>
      <section className="review-section">
        <div className="review-section-head">
          <div>
            <h3>Conteúdo</h3>
            <p>
              {reviewableFiles.length}{" "}
              {reviewableFiles.length === 1 ? "ficheiro associado" : "ficheiros associados"}
            </p>
          </div>
          <span className={allFilesViewed ? "is-complete" : ""}>
            {allFilesViewed
              ? "Revisto"
              : `${viewedFiles.size} de ${reviewableFiles.length} revistos`}
          </span>
        </div>
        {fileError && (
          <Alert tone="danger" title="Não foi possível abrir o ficheiro" text={fileError} />
        )}
        {product.type === "ebook" ? (
          <ProductFiles
            files={productFiles}
            viewed={viewedFiles}
            onOpen={(fileId) => openFile(fileId)}
          />
        ) : (
          <CourseReview
            modules={content.data.modules ?? []}
            viewed={viewedFiles}
            onOpen={(lessonId, fileId) => openFile(fileId, lessonId)}
          />
        )}
      </section>
      {request.status === "pending" && (
        <section className="review-section review-decision">
          <div className="review-section-head">
            <div>
              <h3>Decisão</h3>
              <p>Confirme a revisão antes de escolher uma acção.</p>
            </div>
          </div>
          {!allFilesViewed && (
            <Alert
              tone="warning"
              title="Ainda existem ficheiros por rever"
              text="Abra cada ficheiro associado antes de tomar uma decisão."
            />
          )}
          <div className="review-confirm">
            <Checkbox
              checked={contentReviewed}
              onChange={setContentReviewed}
              label="Confirmo que revi os dados, a descrição, o preço e a estrutura do conteúdo."
            />
          </div>
          <label className="ad-field">
            <span className="ad-label">
              Notas da revisão <span className="faint">(opcional)</span>
            </span>
            <Textarea
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              rows={3}
              placeholder="Adicione contexto apenas quando for necessário."
            />
          </label>
          {decide.isError && (
            <Alert
              tone="danger"
              title="Não foi possível registar a decisão"
              text={errorText(decide.error)}
            />
          )}
        </section>
      )}
      {request.reviewNotes && (
        <section className="review-section">
          <div className="review-section-head">
            <div>
              <h3>Notas registadas</h3>
            </div>
          </div>
          <p>{request.reviewNotes}</p>
        </section>
      )}
    </Drawer>
  );
}

function ProductFiles({
  files,
  viewed,
  onOpen,
}: {
  files: Awaited<ReturnType<typeof api.backoffice.productContent>>["files"];
  viewed: Set<string>;
  onOpen: (fileId: string) => void;
}) {
  if (!files?.length)
    return (
      <Alert tone="danger" title="Sem ficheiros" text="O ebook não possui conteúdo associado." />
    );
  return (
    <div className="stack-sm">
      {files.map((file) => (
        <div className="offer-row review-file" key={file.id}>
          <Tile icon="file" tone={viewed.has(file.id) ? "success" : "neutral"} s="sm" />
          <div className="grow stack-xs">
            <b>{file.originalName}</b>
            <small className="faint">
              {file.mimeType === "application/pdf" ? "Documento PDF" : file.mimeType} ·{" "}
              {viewed.has(file.id) ? "Revisto" : "Por rever"}
            </small>
          </div>
          <Btn s="sm" icon="eye" disabled={file.status !== "ready"} onClick={() => onOpen(file.id)}>
            {viewed.has(file.id) ? "Rever ficheiro" : "Abrir ficheiro"}
          </Btn>
        </div>
      ))}
    </div>
  );
}

function CourseReview({
  modules,
  viewed,
  onOpen,
}: {
  modules: NonNullable<Awaited<ReturnType<typeof api.backoffice.productContent>>["modules"]>;
  viewed: Set<string>;
  onOpen: (lessonId: string, fileId: string) => void;
}) {
  if (!modules.length)
    return (
      <Alert tone="danger" title="Sem módulos" text="O curso não possui estrutura associada." />
    );
  return (
    <div className="stack-sm">
      {modules.map((module) => (
        <Card key={module.id} title={`${module.position}. ${module.title}`}>
          {module.lessons?.length ? (
            <div className="stack-sm">
              {module.lessons.map((lesson) => (
                <div className="stack-sm" key={lesson.id}>
                  <div>
                    <b>
                      {lesson.position}. {lesson.title}
                    </b>
                    {lesson.description && <p className="muted">{lesson.description}</p>}
                  </div>
                  {lesson.files?.map((file) => (
                    <div className="offer-row" key={file.id}>
                      <Tile
                        icon={file.purpose === "video" ? "play" : "file"}
                        tone={viewed.has(file.id) ? "success" : "neutral"}
                        s="sm"
                      />
                      <div className="grow stack-xs">
                        <b>{file.originalName}</b>
                        <small className="faint">
                          {file.purpose || file.mimeType} · {file.status}
                        </small>
                      </div>
                      <Btn
                        s="sm"
                        icon="eye"
                        disabled={file.status !== "ready"}
                        onClick={() => onOpen(lesson.id, file.id)}
                      >
                        {viewed.has(file.id) ? "Abrir novamente" : "Abrir"}
                      </Btn>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <Alert tone="danger" title="Módulo sem aulas" />
          )}
        </Card>
      ))}
    </div>
  );
}

export function Orders() {
  const [status, setStatus] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const query = useQuery({
    queryKey: ["backoffice", "orders", status, orderNumber],
    queryFn: () => api.backoffice.orders(status, orderNumber),
    placeholderData: (previous) => previous,
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  return (
    <>
      <PageHead
        title="Encomendas"
        desc="Acompanhamento operacional das compras realizadas na plataforma."
      />
      <div className="ad-filterbar">
        <Input
          icon="search"
          wrapClass="ad-search"
          placeholder="Número da encomenda"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          aria-label="Procurar encomenda"
        />
        <Select
          aria-label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            ["", "Todos os estados"],
            ["pending_payment", "Pagamento pendente"],
            ["paid", "Paga"],
            ["payment_uncertain", "Pagamento incerto"],
            ["expired", "Expirada"],
            ["cancelled", "Cancelada"],
          ]}
        />
        <span className="ad-filterbar-count">
          {query.data.total} encomenda{query.data.total === 1 ? "" : "s"}
        </span>
      </div>
      <Card flush>
        {query.data.items.length ? (
          <OrdersTable rows={query.data.items} />
        ) : (
          <Empty
            icon="receipt"
            title="Nenhuma encomenda encontrada"
            desc="Altere os filtros ou aguarde uma nova compra."
          />
        )}
      </Card>
    </>
  );
}

function OrdersTable({
  rows,
}: {
  rows: Awaited<ReturnType<typeof api.backoffice.orders>>["items"];
}) {
  return (
    <Table
      rows={rows}
      rowKey={(order) => order.id}
      cols={[
        {
          label: "Encomenda",
          render: (order) => (
            <>
              <span className="mono">{order.orderNumber}</span>
              <br />
              <small className="faint">{date(order.createdAt)}</small>
            </>
          ),
        },
        { label: "Produto", render: (order) => order.items?.[0]?.productName ?? "—" },
        {
          label: "Produtor",
          render: (order) => <span className="mono faint">{order.sellerId.slice(0, 8)}…</span>,
        },
        { label: "Tipo", render: (order) => (order.type === "standard" ? "Compra" : order.type) },
        {
          label: "Total",
          num: true,
          render: (order) => <b style={{ fontWeight: 600 }}>{mt(order.totalAmount)}</b>,
        },
        { label: "Estado", render: (order) => <Status s={order.status} /> },
      ]}
    />
  );
}

const payoutDestination = (payout: PayoutRequest) => {
  const wallet = { mpesa: "M-Pesa", emola: "e-Mola" }[payout.provider] ?? payout.provider;
  return `${wallet} · ${payout.destinationReference || "referência não disponível"}`;
};

export function Payouts() {
  const client = useQueryClient();
  const { prompt } = useApp();
  const query = useQuery({
    queryKey: ["backoffice", "payouts"],
    queryFn: () => api.backoffice.payouts(),
  });
  const decide = useMutation({
    mutationFn: ({
      id,
      action,
      reviewNotes,
    }: {
      id: string;
      action: "approve" | "reject";
      reviewNotes: string;
    }) => api.backoffice.decidePayout(id, action, reviewNotes),
    onSuccess: () => client.invalidateQueries({ queryKey: ["backoffice", "payouts"] }),
  });
  const decidePayout = async (payout: PayoutRequest, action: "approve" | "reject") => {
    const reviewNotes = await prompt({
      title: action === "approve" ? "Aprovar saque" : "Rejeitar saque",
      message: `${mt(payout.amount)} para ${payout.destinationName} (${payoutDestination(payout)}). Confirme estes dados antes de continuar. A decisão fica registada para auditoria.`,
      label: "Notas da decisão",
      placeholder: "Registe o que foi verificado e justifique a decisão.",
      confirmLabel: action === "approve" ? "Aprovar" : "Rejeitar",
    });
    if (reviewNotes !== null) decide.mutate({ id: payout.id, action, reviewNotes });
  };
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} />;
  return (
    <>
      <PageHead
        title="Saques"
        desc="Decisões individuais. Não existe aprovação em lote para operações financeiras."
      />
      {decide.isError && (
        <Alert
          tone="danger"
          title="Não foi possível decidir o saque"
          text={errorText(decide.error)}
        />
      )}
      <Card flush>
        {query.data.items.length ? (
          <Table
            rows={query.data.items}
            rowKey={(payout) => payout.id}
            cols={[
              {
                label: "Destino",
                render: (payout) => (
                  <div>
                    <strong>{payout.destinationName}</strong>
                    <br />
                    <small>{payoutDestination(payout)}</small>
                  </div>
                ),
              },
              { label: "Pedido em", render: (payout) => date(payout.requestedAt) },
              { label: "Valor", render: (payout) => mt(payout.amount) },
              { label: "Estado", render: (payout) => <Status s={payout.status} /> },
              {
                label: "Acções",
                render: (payout) =>
                  payout.status === "pending_approval" ? (
                    <div className="row">
                      <Btn
                        s="sm"
                        disabled={decide.isPending}
                        onClick={() => decidePayout(payout, "approve")}
                      >
                        Aprovar
                      </Btn>
                      <Btn
                        s="sm"
                        v="danger"
                        disabled={decide.isPending}
                        onClick={() => decidePayout(payout, "reject")}
                      >
                        Rejeitar
                      </Btn>
                    </div>
                  ) : null,
              },
            ]}
          />
        ) : (
          <Empty icon="cash" title="Sem pedidos de saque" />
        )}
      </Card>
    </>
  );
}
