import { createBrowserRouter, Navigate, Outlet, RouterProvider, useParams } from "react-router-dom";
import {
  AreaSwitcher,
  ConsoleLayout,
  PublicLayout,
  RequireRole,
  RequireSeller,
  RequireUser,
  StudentLayout,
} from "@/layouts/Shells";
import Landing from "@/pages/public/Landing";
import Purchase, { ThankYou } from "@/pages/public/Purchase";
import PurchasedContent from "@/pages/public/PurchasedContent";
import { AdminLogin, Login, Register } from "@/pages/public/Auth";
import { Library, Purchases } from "@/pages/student/Student";
import {
  NewProduct,
  SellerAccount,
  SellerFinance,
  SellerOrders,
  SellerOverview,
  SellerProduct,
  SellerProducts,
  SellerSetup,
  SellerVerification,
} from "@/pages/seller/Seller";
import { Kyc, Moderation, Orders, Overview, Payouts, Sellers } from "@/pages/admin/Admin";
import { NotificationsPage } from "@/components/Notifications";

const title = (value: string) => ({ handle: { title: value } });
const Root = () => (
  <>
    <Outlet />
    <AreaSwitcher />
  </>
);
const LegacyPurchasedContent = () => {
  const { productId = "" } = useParams();
  return <Navigate to={`/aluno/produtos/${productId}`} replace />;
};

export const router = createBrowserRouter(
  [
    {
      element: <Root />,
      children: [
        {
          element: <PublicLayout />,
          children: [
            { path: "/", element: <Landing />, ...title("") },
            { path: "/checkout/:slug", element: <Purchase />, ...title("Checkout") },
            { path: "/obrigado/:orderId", element: <ThankYou />, ...title("Compra") },
            { path: "/entrar", element: <Login />, ...title("Entrar") },
            { path: "/criar-conta", element: <Register />, ...title("Criar conta") },
            { path: "/admin/entrar", element: <AdminLogin />, ...title("Backoffice") },
            {
              path: "/produtor/configurar",
              element: (
                <RequireUser>
                  <SellerSetup />
                </RequireUser>
              ),
              ...title("Configurar produtor"),
            },
            {
              path: "/compras/:productId/conteudo",
              element: (
                <RequireUser>
                  <LegacyPurchasedContent />
                </RequireUser>
              ),
              ...title("Conteúdo comprado"),
            },
          ],
        },
        {
          path: "/aluno",
          element: (
            <RequireUser>
              <StudentLayout />
            </RequireUser>
          ),
          children: [
            { index: true, element: <Library />, ...title("Os meus produtos") },
            { path: "compras", element: <Purchases />, ...title("Compras") },
            { path: "produtos/:productId", element: <PurchasedContent />, ...title("Conteúdo") },
            {
              path: "notificacoes",
              element: <NotificationsPage audience="user" area="student" />,
              ...title("Notificações"),
            },
          ],
        },
        {
          path: "/produtor",
          element: (
            <RequireSeller>
              <ConsoleLayout kind="seller" />
            </RequireSeller>
          ),
          children: [
            { index: true, element: <SellerOverview />, ...title("Painel") },
            { path: "produtos", element: <SellerProducts />, ...title("Produtos") },
            { path: "produtos/novo", element: <NewProduct />, ...title("Novo produto") },
            { path: "produtos/:id", element: <SellerProduct />, ...title("Produto") },
            { path: "vendas", element: <SellerOrders />, ...title("Vendas") },
            { path: "verificacao", element: <SellerVerification />, ...title("Verificação") },
            { path: "financeiro", element: <SellerFinance />, ...title("Financeiro") },
            { path: "conta", element: <SellerAccount />, ...title("Perfil comercial") },
            {
              path: "notificacoes",
              element: <NotificationsPage audience="user" area="seller" />,
              ...title("Notificações"),
            },
          ],
        },
        {
          path: "/admin",
          element: (
            <RequireRole role="admin">
              <ConsoleLayout kind="admin" />
            </RequireRole>
          ),
          children: [
            { index: true, element: <Overview />, ...title("Backoffice") },
            { path: "encomendas", element: <Orders />, ...title("Encomendas") },
            { path: "saques", element: <Payouts />, ...title("Saques") },
            { path: "produtores", element: <Sellers />, ...title("Produtores") },
            { path: "kyc", element: <Kyc />, ...title("Verificação KYC") },
            { path: "produtos", element: <Moderation />, ...title("Moderação") },
            {
              path: "notificacoes",
              element: <NotificationsPage audience="backoffice" area="admin" />,
              ...title("Notificações"),
            },
          ],
        },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);

export default function App() {
  return <RouterProvider router={router} />;
}
