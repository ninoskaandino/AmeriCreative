const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to extract JWT token from local storage
function getHeaders(): HeadersInit {
  const token = localStorage.getItem('amerident_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Ocurrió un error en el servidor.');
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    async login(credentials: { email: string; password?: string }) {
      return request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    async register(userData: any) {
      return request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    async me() {
      return request<any>('/auth/me');
    },
  },

  // Images
  images: {
    async generate(params: any) {
      return request<any>('/images/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async getAll(filters: { campaignId?: string; branchId?: string; approvalStatus?: string } = {}) {
      const query = new URLSearchParams(filters as any).toString();
      return request<any[]>(`/images?${query}`);
    },
    async getById(id: string) {
      return request<any>(`/images/${id}`);
    },
    async delete(id: string) {
      return request<any>(`/images/${id}`, {
        method: 'DELETE',
      });
    },
    async createVariation(id: string, styleAdjustment: string) {
      return request<any>(`/images/${id}/variations`, {
        method: 'POST',
        body: JSON.stringify({ styleAdjustment }),
      });
    },
  },

  // Content
  content: {
    async generate(params: any) {
      return request<{ document: any; version: any }>('/content/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async edit(params: { text: string; action: string; tone?: string; documentId?: string }) {
      return request<{ text: string; version?: any }>('/content/edit', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async review(params: { text: string; specialty?: string; treatment?: string }) {
      return request<{ safe: boolean; issues: string[]; suggestions: string[] }>('/content/review', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async getAll(filters: { campaignId?: string; branchId?: string; status?: string } = {}) {
      const query = new URLSearchParams(filters as any).toString();
      return request<any[]>(`/content?${query}`);
    },
    async getById(id: string) {
      return request<{ document: any; versions: any[] }>(`/content/${id}`);
    },
    async createVersion(id: string, content: string) {
      return request<{ document: any; version: any }>(`/content/${id}/versions`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    async restoreVersion(id: string, versionId: string) {
      return request<{ document: any; version: any }>(`/content/${id}/restore/${versionId}`, {
        method: 'POST',
      });
    },
  },

  // Campaigns
  campaigns: {
    async getAll(filters: { branchId?: string; status?: string } = {}) {
      const query = new URLSearchParams(filters as any).toString();
      return request<any[]>(`/campaigns?${query}`);
    },
    async getById(id: string) {
      return request<{ campaign: any; assets: { images: any[]; contents: any[] } }>(`/campaigns/${id}`);
    },
    async create(params: any) {
      return request<any>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async update(id: string, params: any) {
      return request<any>(`/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(params),
      });
    },
    async delete(id: string) {
      return request<any>(`/campaigns/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Branches
  branches: {
    async getAll() {
      return request<any[]>('/branches');
    },
    async create(params: any) {
      return request<any>('/branches', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async update(id: string, params: any) {
      return request<any>(`/branches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(params),
      });
    },
  },

  // Comments
  comments: {
    async create(params: { resourceType: string; resourceId: string; message: string; parentCommentId?: string }) {
      return request<any>('/comments', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    async getByResource(resourceType: string, resourceId: string) {
      return request<any[]>(`/comments/${resourceType}/${resourceId}`);
    },
    async resolve(id: string, resolved: boolean) {
      return request<any>(`/comments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ resolved }),
      });
    },
  },

  // Approvals
  approvals: {
    async approve(resourceType: string, resourceId: string, observations?: string) {
      return request<any>(`/approvals/${resourceType}/${resourceId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ observations }),
      });
    },
    async reject(resourceType: string, resourceId: string, observations: string) {
      return request<any>(`/approvals/${resourceType}/${resourceId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ observations }),
      });
    },
    async requestChanges(resourceType: string, resourceId: string, observations: string) {
      return request<any>(`/approvals/${resourceType}/${resourceId}/request-changes`, {
        method: 'POST',
        body: JSON.stringify({ observations }),
      });
    },
    async getHistory(resourceType: string, resourceId: string) {
      return request<any[]>(`/approvals/${resourceType}/${resourceId}`);
    },
  },
};
