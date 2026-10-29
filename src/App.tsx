import { createBrowserRouter, Navigate, RouterProvider, Outlet } from "react-router-dom";
import { AreaSwitcher, ConsoleLayout, PublicLayout, RequireRole, StudentLayout } from "@/layouts/Shells";
import Landing from "@/pages/public/Landing";
import Checkout, { ThankYou } from "@/pages/public/Checkout";
import { Login, Register } from "@/pages/public/Auth";
import { Library, Lesson, Purchases } from "@/pages/student/Student";
import Dashboard from "@/pages/seller/Dashboard";
import Products, { NewProduct, ProductPage } from "@/pages/seller/Products";
import Sales, { Customers, Subscriptions } from "@/pages/seller/Sales";
import { Affiliates, Coupons, Members, Recovery } from "@/pages/seller/Growth";
import { Account, Finance, Integrations } from "@/pages/seller/Account";
import * as A from "@/pages/admin/Admin";

function Root() {
  return (<><Outlet />{import.meta.env.VITE_SHOW_SWITCHER !== "false" ? <AreaSwitcher /> : null}</>);
}

const t = (title: string) => ({ handle: { title } });

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: "/", element: <Landing />, ...t("") },
          { path: "/checkout/:slug", element: <Checkout />, ...t("Checkout") },
          { path: "/checkout", element: <Navigate to="/checkout/excel-zero-avancado" replace /> },
          { path: "/obrigado/:orderId", element: <ThankYou />, ...t("Compra concluída") },
          { path: "/entrar", element: <Login />, ...t("Entrar") },
          { path: "/criar-conta", element: <Register />, ...t("Criar conta") },
        ],
      },
      {
        path: "/aluno",
        element: <RequireRole role="student"><StudentLayout /></RequireRole>,
        children: [
          { index: true, element: <Library />, ...t("Área do aluno") },
          { path: "aulas/:lessonId", element: <Lesson />, ...t("Aula") },
          { path: "compras", element: <Purchases />, ...t("Compras") },
        ],
      },
      {
        path: "/produtor",
        element: <RequireRole role="seller"><ConsoleLayout kind="seller" /></RequireRole>,
        children: [
          { index: true, element: <Dashboard />, ...t("Painel") },
          { path: "produtos", element: <Products />, ...t("Produtos") },
          { path: "produtos/novo", element: <NewProduct />, ...t("Novo produto") },
          { path: "produtos/:id", element: <ProductPage />, ...t("Produto") },
          { path: "vendas", element: <Sales />, ...t("Vendas") },
          { path: "assinaturas", element: <Subscriptions />, ...t("Assinaturas") },
          { path: "clientes", element: <Customers />, ...t("Clientes") },
          { path: "afiliados", element: <Affiliates />, ...t("Afiliados") },
          { path: "cupoes", element: <Coupons />, ...t("Cupões") },
          { path: "recuperacao", element: <Recovery />, ...t("Recuperação de vendas") },
          { path: "membros", element: <Members />, ...t("Área de membros") },
          { path: "financeiro", element: <Finance />, ...t("Financeiro") },
          { path: "integracoes", element: <Integrations />, ...t("Integrações") },
          { path: "conta", element: <Account />, ...t("Definições da conta") },
        ],
      },
      {
        path: "/admin",
        element: <RequireRole role="admin"><ConsoleLayout kind="admin" /></RequireRole>,
        children: [
          { index: true, element: <A.Overview />, ...t("Visão geral") },
          { path: "transacoes", element: <A.Transactions />, ...t("Transações") },
          { path: "saques", element: <A.Payouts />, ...t("Saques") },
          { path: "disputas", element: <A.Disputes />, ...t("Reembolsos e disputas") },
          { path: "produtores", element: <A.Sellers />, ...t("Produtores") },
          { path: "kyc", element: <A.Kyc />, ...t("Verificação KYC") },
          { path: "produtos", element: <A.Moderation />, ...t("Produtos em análise") },
          { path: "antifraude", element: <A.Risk_ />, ...t("Antifraude") },
          { path: "pagamentos", element: <A.Gateways />, ...t("Métodos de pagamento") },
          { path: "taxas", element: <A.Fees />, ...t("Taxas e planos") },
          { path: "equipa", element: <A.Team />, ...t("Equipa e acessos") },
          { path: "auditoria", element: <A.Audit />, ...t("Registo de auditoria") },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
