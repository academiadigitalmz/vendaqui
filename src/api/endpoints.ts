import { checkoutApi } from "./checkout";
import {
  del,
  get,
  HttpError,
  patch,
  post,
  put,
  refreshAccessToken,
  tokenStore,
  uploadFile,
  uploadForm,
  type UploadProgress,
} from "./http";
import type { Session, User } from "./types";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  msisdn: string;
  emailVerifiedAt?: string | null;
  msisdnVerifiedAt?: string | null;
  status: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { id: string; code: string; name: string };
  permissions: { id: string; code: string; description?: string }[];
}

export interface SellerProfile {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  businessType: string;
  businessName: string;
  nuit: string;
  supportEmail: string;
  whatsapp: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfileInput {
  displayName: string;
  bio: string;
  businessType: "individual" | "company";
  businessName: string;
  nuit: string;
  supportEmail: string;
  whatsapp: string;
}

export interface Verification {
  id: string;
  sellerId: string;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationDetails {
  verification: Verification;
  documents: {
    id: string;
    documentType: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }[];
}

export interface UploadAuthorization {
  storageKey: string;
  uploadUrl: string;
  fields: Record<string, string>;
  expiresIn: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface Offer {
  id: string;
  productId: string;
  name: string;
  priceAmount: number;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  type: "course" | "ebook";
  name: string;
  slug: string;
  description: string;
  status: string;
  guaranteeDays: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  defaultOffer?: Offer;
}

export interface ProductDetails {
  product: Product;
  offers: Offer[];
}

export interface ProductInput {
  categoryId: string;
  type: "course" | "ebook";
  name: string;
  description: string;
  guaranteeDays: number | null;
  priceAmount: number;
}

export interface ContentFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number | null;
  status: string;
  position?: number;
  purpose?: string;
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  position: number;
  isPreview: boolean;
  releaseAfterDays: number;
  files?: ContentFile[];
}

export interface CourseModule {
  id: string;
  productId: string;
  title: string;
  position: number;
  lessons?: CourseLesson[];
}

export interface LessonProgress {
  lessonId: string;
  lastPositionSeconds: number;
  completedAt?: string;
  updatedAt: string;
}

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lastLessonId?: string;
}

export interface ProductContent {
  product: Product;
  modules?: CourseModule[];
  files?: ContentFile[];
}

export interface OrderItem {
  id: string;
  productId: string;
  type: string;
  productName: string;
  offerName: string;
  unitAmount: number;
  totalAmount: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  sellerId: string;
  type: string;
  status: string;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
  items?: OrderItem[];
}

export interface LibraryItem {
  entitlementId: string;
  productId: string;
  name: string;
  type: "course" | "ebook";
  sellerName: string;
  accessStatus: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  coverUrl?: string;
}

export interface SellerBalance {
  available: number;
  pending: number;
  reserved: number;
  payoutInTransit: number;
  currency: string;
}

export interface FinanceOverview {
  confirmedPayments: number;
  commissionRevenue: number;
  payoutsInFlight: number;
}

export interface ReportingMetric {
  value: number;
  previousValue: number;
  changePercent: number | null;
}

export interface SellerReportingOverview {
  period: {
    days: number;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  netRevenue: ReportingMetric;
  approvedSales: ReportingMetric;
  averageTicket: ReportingMetric;
  series: { date: string; netRevenue: number; approvedSales: number }[];
}

export interface PayoutAccount {
  id: string;
  type: string;
  provider: string;
  accountName: string;
  accountReference: string;
  isPrimary: boolean;
  status: string;
}

export interface PayoutRequest {
  id: string;
  payoutAccountId: string;
  destinationType: string;
  provider: string;
  destinationName: string;
  destinationReference: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  requestedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  sourceType?: string;
  sourceId?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface ModerationRequest {
  id: string;
  productId: string;
  status: string;
  submittedAt: string;
  reviewNotes?: string;
}

export interface ModerationDetails {
  request: ModerationRequest;
  product: Product;
  offers: Offer[];
}

const asPublicUser = (
  user: ApiUser,
  role: "seller" | "student",
  profile?: SellerProfile,
): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.msisdn,
  role,
  ...(profile
    ? { business: { name: profile.displayName, nuit: profile.nuit, kycStatus: "not_started" } }
    : {}),
});

const isMissingSellerProfile = (error: unknown) =>
  error instanceof HttpError &&
  (error.body.code === "seller_profile_required" ||
    (error.status === 404 && error.body.code === "seller_resource_not_found"));

async function publicSession(accessToken: string, user: ApiUser): Promise<Session> {
  tokenStore.set(accessToken, "app");
  try {
    const profile = await get<SellerProfile>("/seller/profile");
    return { token: accessToken, user: asPublicUser(user, "seller", profile) };
  } catch (error) {
    if (!isMissingSellerProfile(error)) throw error;
    return { token: accessToken, user: asPublicUser(user, "student") };
  }
}

async function restorePublicSession(): Promise<Session | null> {
  const accessToken = await refreshAccessToken("app");
  if (!accessToken) return null;
  return publicSession(accessToken, await get<ApiUser>("/me"));
}

async function restoreBackofficeSession(): Promise<Session | null> {
  const accessToken = await refreshAccessToken("backoffice");
  if (!accessToken) return null;
  const staff = await get<StaffUser>("/backoffice/me");
  return {
    token: accessToken,
    user: { id: staff.id, name: staff.name, email: staff.email, role: "admin" },
  };
}

export const api = {
  catalog: {
    categories: () => get<Category[]>("/public/categories"),
  },

  auth: {
    login: async (body: { email: string; password: string }) => {
      tokenStore.set(null, "app");
      const result = await post<{ accessToken: string; user: ApiUser }>("/auth/login", body);
      return publicSession(result.accessToken, result.user);
    },
    register: async (body: { name: string; email: string; msisdn: string; password: string }) => {
      tokenStore.set(null, "app");
      const result = await post<{ accessToken: string; user: ApiUser }>("/auth/register", body);
      return publicSession(result.accessToken, result.user);
    },
    restore: restorePublicSession,
    me: () => get<ApiUser>("/me"),
    logout: async () => {
      // The token stays when this fails, so the still-open session keeps working.
      await post<void>("/auth/logout");
      tokenStore.set(null, "app");
    },
  },

  backofficeAuth: {
    login: async (body: { email: string; password: string }) => {
      tokenStore.set(null, "backoffice");
      const result = await post<{ accessToken: string; staff: StaffUser }>(
        "/backoffice/auth/login",
        body,
      );
      tokenStore.set(result.accessToken, "backoffice");
      return {
        token: result.accessToken,
        user: {
          id: result.staff.id,
          name: result.staff.name,
          email: result.staff.email,
          role: "admin" as const,
        },
      };
    },
    restore: restoreBackofficeSession,
    logout: async () => {
      // The token stays when this fails, so the still-open session keeps working.
      await post<void>("/backoffice/auth/logout");
      tokenStore.set(null, "backoffice");
    },
  },

  notifications: {
    list: (audience: "user" | "backoffice", page = 1, pageSize = 20) =>
      get<Page<Notification>>(
        `${audience === "backoffice" ? "/backoffice" : "/me"}/notifications`,
        { page, pageSize },
      ),
    unreadCount: (audience: "user" | "backoffice") =>
      get<{ count: number }>(
        `${audience === "backoffice" ? "/backoffice" : "/me"}/notifications/unread-count`,
      ),
    markRead: (audience: "user" | "backoffice", id: string) =>
      patch<Notification>(
        `${audience === "backoffice" ? "/backoffice" : "/me"}/notifications/${id}/read`,
        {},
      ),
    markAllRead: (audience: "user" | "backoffice") =>
      post<{ updated: number }>(
        `${audience === "backoffice" ? "/backoffice" : "/me"}/notifications/read-all`,
      ),
  },

  seller: {
    profile: () => get<SellerProfile>("/seller/profile"),
    createProfile: (body: SellerProfileInput) => post<SellerProfile>("/seller/profile", body),
    updateProfile: (body: Partial<SellerProfileInput>) =>
      patch<SellerProfile>("/seller/profile", body),
    verification: () => get<VerificationDetails>("/seller/verification"),
    authorizeVerificationUpload: (documentType: string, file: File) =>
      post<UploadAuthorization>("/seller/verification/upload-authorizations", {
        documentType,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    submitVerification: (documents: { documentType: string; storageKey: string }[]) =>
      post<Verification>("/seller/verification/submit", { documents }),
    products: (page = 1) => get<Page<Product>>("/seller/products", { page, pageSize: 50 }),
    product: (id: string) => get<ProductDetails>(`/seller/products/${id}`),
    createProduct: (body: ProductInput) =>
      post<Product & { mainPrice: Offer }>("/seller/products", body),
    updateProduct: (id: string, body: ProductInput) =>
      patch<ProductDetails>(`/seller/products/${id}`, body),
    archiveProduct: (id: string) => post<Product>(`/seller/products/${id}/archive`),
    startEditingProduct: (id: string) => post<Product>(`/seller/products/${id}/start-editing`),
    submitProduct: (id: string) => post<ModerationRequest>(`/seller/products/${id}/submit-review`),
    authorizeCover: (id: string, file: File) =>
      post<{ storageKey: string; uploadUrl: string }>(`/seller/products/${id}/cover/upload`, {
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    confirmCover: (id: string, storageKey: string, file: File) =>
      post<Product>(`/seller/products/${id}/cover/confirm`, {
        storageKey,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    authorizeFile: (file: File) =>
      post<{
        fileId: string;
        uploadUrl: string;
        method: string;
        fields: Record<string, string>;
        expiresIn: number;
      }>("/seller/files/uploads", {
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    confirmFile: (id: string) => post<ContentFile>(`/seller/files/${id}/confirm`),
    deleteFile: (id: string) => del<void>(`/seller/files/${id}`),
    productFiles: (productId: string) => get<ContentFile[]>(`/seller/products/${productId}/files`),
    attachFile: (productId: string, fileId: string, position: number) =>
      post<void>(`/seller/products/${productId}/files`, { fileId, position }),
    detachFile: (productId: string, fileId: string) =>
      del<void>(`/seller/products/${productId}/files/${fileId}`),
    content: (productId: string) => get<ProductContent>(`/seller/products/${productId}/content`),
    productFileAccess: (productId: string, fileId: string) =>
      get<{ url: string; expiresAt: string }>(
        `/seller/products/${productId}/files/${fileId}/access`,
      ),
    createModule: (productId: string, title: string, position: number) =>
      post<CourseModule>(`/seller/products/${productId}/modules`, { title, position }),
    createLesson: (
      moduleId: string,
      body: {
        title: string;
        description: string;
        position: number;
        isPreview: boolean;
        releaseAfterDays: number;
      },
    ) => post<CourseLesson>(`/seller/modules/${moduleId}/lessons`, body),
    attachLessonFile: (
      lessonId: string,
      fileId: string,
      purpose: "video" | "attachment",
      position: number,
    ) => post<void>(`/seller/lessons/${lessonId}/files`, { fileId, purpose, position }),
    lessonPlayback: (lessonId: string) =>
      get<{ url: string; expiresAt: string }>(`/seller/lessons/${lessonId}/playback`),
    orders: (status = "") => get<Page<Order>>("/seller/orders", { status, page: 1, pageSize: 50 }),
    order: (id: string) => get<Order>(`/seller/orders/${id}`),
    balance: () => get<SellerBalance>("/seller/finance/balance"),
    reportingOverview: () => get<SellerReportingOverview>("/seller/reporting/overview"),
    payoutAccounts: () => get<PayoutAccount[]>("/seller/payout-accounts"),
    addPayoutAccount: (body: {
      type: string;
      provider: string;
      accountName: string;
      accountReference: string;
    }) => post<PayoutAccount>("/seller/payout-accounts", body),
    payouts: () => get<Page<PayoutRequest>>("/seller/payouts", { page: 1, pageSize: 50 }),
    requestPayout: (body: { payoutAccountId: string; amount: number; type: string }, key: string) =>
      post<PayoutRequest>("/seller/payouts", body, { "Idempotency-Key": key }),
  },

  buyer: {
    library: () => get<Page<LibraryItem>>("/me/library", { page: 1, pageSize: 50 }),
    orders: () => get<Page<Order>>("/me/orders", { page: 1, pageSize: 50 }),
    productContent: (productId: string) => get<ProductContent>(`/me/products/${productId}/content`),
    productFileAccess: (productId: string, fileId: string) =>
      get<{ url: string; expiresAt: string }>(`/me/products/${productId}/files/${fileId}/access`),
    productFileDownload: (productId: string, fileId: string) =>
      get<{ url: string; expiresAt: string }>(`/me/products/${productId}/files/${fileId}/download`),
    lessonPlayback: (lessonId: string) =>
      get<{ url: string; expiresAt: string }>(`/me/lessons/${lessonId}/playback`),
    lessonProgress: (lessonId: string) => get<LessonProgress>(`/me/lessons/${lessonId}/progress`),
    courseProgress: (productId: string) => get<CourseProgress>(`/me/courses/${productId}/progress`),
    updateProgress: (lessonId: string, lastPositionSeconds: number, completed: boolean) =>
      put<LessonProgress>(`/me/lessons/${lessonId}/progress`, {
        lastPositionSeconds,
        completed,
      }),
  },

  backoffice: {
    sellers: (status = "") =>
      get<Page<SellerProfile>>("/backoffice/sellers", { status, page: 1, pageSize: 50 }),
    seller: (id: string) => get<SellerProfile>(`/backoffice/sellers/${id}`),
    updateSellerStatus: (id: string, status: string, reason: string) =>
      patch<SellerProfile>(`/backoffice/sellers/${id}/status`, { status, reason }),
    verifications: (status = "") =>
      get<Page<Verification>>("/backoffice/kyc", { status, page: 1, pageSize: 50 }),
    verification: (id: string) => get<VerificationDetails>(`/backoffice/kyc/${id}`),
    verificationDocumentAccess: (verificationId: string, documentId: string) =>
      get<{ url: string }>(`/backoffice/kyc/${verificationId}/documents/${documentId}/access`),
    startVerification: (id: string) => post<Verification>(`/backoffice/kyc/${id}/review`),
    decideVerification: (
      id: string,
      action: "approve" | "reject" | "request-changes",
      notes: string,
    ) => post<Verification>(`/backoffice/kyc/${id}/${action}`, { notes }),
    moderation: (status = "") =>
      get<Page<ModerationRequest>>("/backoffice/moderation", { status, page: 1, pageSize: 50 }),
    moderationDetails: (id: string) => get<ModerationDetails>(`/backoffice/moderation/${id}`),
    decideProduct: (id: string, action: "approve" | "reject" | "request-changes", notes: string) =>
      post<Product>(`/backoffice/moderation/${id}/${action}`, { notes }),
    productContent: (productId: string) =>
      get<ProductContent>(`/backoffice/products/${productId}/content`),
    productFileAccess: (productId: string, fileId: string) =>
      get<{ url: string; expiresAt: string }>(
        `/backoffice/products/${productId}/files/${fileId}/access`,
      ),
    lessonFileAccess: (lessonId: string, fileId: string) =>
      get<{ url: string; expiresAt: string }>(
        `/backoffice/lessons/${lessonId}/files/${fileId}/access`,
      ),
    orders: (status = "", orderNumber = "") =>
      get<Page<Order>>("/backoffice/orders", { status, orderNumber, page: 1, pageSize: 50 }),
    financeOverview: () => get<FinanceOverview>("/backoffice/finance/overview"),
    payouts: (status = "") =>
      get<Page<PayoutRequest>>("/backoffice/payouts", { status, page: 1, pageSize: 50 }),
    decidePayout: (id: string, action: "approve" | "reject", notes: string) =>
      post<PayoutRequest>(`/backoffice/payouts/${id}/${action}`, { notes }),
  },

  checkout: checkoutApi,
};

export async function uploadVerificationDocument(
  documentType: string,
  file: File,
  onProgress?: UploadProgress,
) {
  const authorization = await api.seller.authorizeVerificationUpload(documentType, file);
  await uploadForm(authorization.uploadUrl, authorization.fields, file, onProgress);
  return { documentType, storageKey: authorization.storageKey };
}

export async function uploadProductFile(
  productId: string,
  file: File,
  onProgress?: UploadProgress,
) {
  const authorization = await api.seller.authorizeFile(file);
  try {
    await uploadForm(authorization.uploadUrl, authorization.fields, file, onProgress);
    await api.seller.confirmFile(authorization.fileId);
    await api.seller.attachFile(productId, authorization.fileId, 1);
    return authorization.fileId;
  } catch (error) {
    await api.seller.deleteFile(authorization.fileId).catch(() => undefined);
    throw error;
  }
}

export async function uploadLessonFile(
  lessonId: string,
  file: File,
  purpose: "video" | "attachment" = "video",
  onProgress?: UploadProgress,
) {
  const authorization = await api.seller.authorizeFile(file);
  try {
    await uploadForm(authorization.uploadUrl, authorization.fields, file, onProgress);
    await api.seller.confirmFile(authorization.fileId);
    await api.seller.attachLessonFile(lessonId, authorization.fileId, purpose, 1);
    return authorization.fileId;
  } catch (error) {
    await api.seller.deleteFile(authorization.fileId).catch(() => undefined);
    throw error;
  }
}

export async function uploadProductCover(
  productId: string,
  file: File,
  onProgress?: UploadProgress,
) {
  const authorization = await api.seller.authorizeCover(productId, file);
  await uploadFile(authorization.uploadUrl, file, onProgress);
  await api.seller.confirmCover(productId, authorization.storageKey, file);
}
