import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { mt } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { Btn, Card, Empty, ErrorState, Loading, PageHead, Status, Table } from "@/components/ui";

const date = (value: string) => new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium" }).format(new Date(value));

export function Library() {
  const query = useQuery({ queryKey: ["buyer", "library"], queryFn: api.buyer.library });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  return <><PageHead title="Os meus produtos" desc="Conteúdo disponibilizado pelas suas compras confirmadas." />
    {query.data.items.length ? <div className="library-grid">{query.data.items.map(item => <article className="library-card" key={item.entitlementId}>
      <div className={`library-cover ${item.type === "course" ? "is-course" : "is-ebook"}`}>{item.coverUrl ? <img src={item.coverUrl} alt={`Capa de ${item.name}`} /> : <Icon name={item.type === "course" ? "cap" : "book"} size={34} />}<span><Icon name={item.type === "course" ? "cap" : "book"} size={14} />{item.type === "course" ? "Curso" : "Ebook"}</span></div>
      <div className="library-card-body"><div className="library-card-head"><div><small>{item.sellerName}</small><h2>{item.name}</h2></div><Status s={item.accessStatus} /></div>
        {item.type === "course" ? <div className="library-progress"><div><span>{item.completedLessons} de {item.totalLessons} aulas</span><strong>{item.progressPercent}%</strong></div><div className="ad-progress-track"><div className="ad-progress-fill" style={{ width: `${item.progressPercent}%` }} /></div></div> : <p className="library-available"><Icon name="checkc" size={16} /> Pronto para consultar</p>}
        <Btn to={`/aluno/produtos/${item.productId}`} v="primary" icon={item.type === "course" ? "play" : "book"} block>{item.type === "course" && item.progressPercent > 0 ? "Continuar curso" : "Aceder ao conteúdo"}</Btn>
      </div>
    </article>)}</div> : <Empty icon="book" title="Ainda não tem produtos" desc="Os produtos aparecem aqui depois da confirmação do pagamento e da associação da compra à sua conta." />}
  </>;
}

export function Purchases() {
  const query = useQuery({ queryKey: ["buyer", "orders"], queryFn: api.buyer.orders });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  return <><PageHead title="Compras" desc="Histórico de encomendas da sua conta." />
    <Card flush>{query.data.items.length ? <Table rows={query.data.items} rowKey={order => order.id} cols={[
      { label: "Encomenda", render: order => order.orderNumber },
      { label: "Produto", render: order => order.items?.[0]?.productName ?? "—" },
      { label: "Total", render: order => mt(order.totalAmount) },
      { label: "Estado", render: order => <Status s={order.status} /> },
      { label: "Data", render: order => date(order.createdAt) },
    ]} /> : <Empty icon="receipt" title="Ainda não existem compras" />}</Card>
  </>;
}
