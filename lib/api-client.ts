// API client with built-in token handling

export class APIClient {
  private baseURL = '/api';

  private clearAuthState() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('authToken');
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
          this.clearAuthState();
          return null;
        }
      }
    } catch {
      // ignore parsing errors
    }
    return token;
  }

  private getHeaders(isFormData = false): Record<string, string> {
    const headers: Record<string, string> = {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async request<T>(
    path: string,
    options: RequestInit & { params?: Record<string, any> } = {}
  ): Promise<T> {
    const { params, ...requestOptions } = options;

    let url = `${this.baseURL}${path}`;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}?${queryString}`;
    }

    const response = await fetch(url, {
      cache: 'no-store',
      ...requestOptions,
      headers: {
        ...this.getHeaders(),
        ...requestOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.error || `API error: ${response.status}`;

      // Clear auth state on any 401 Unauthorized / Invalid / Expired token
      if (response.status === 401) {
        this.clearAuthState();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message } }));
        }
      }

      throw new Error(message);
    }

    return response.json();
  }

  // Product methods
  async getProducts(filters?: Record<string, any>) {
    return this.request('/products', { params: filters });
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Order methods
  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async updateOrderStatus(
    id: string,
    status: string,
    notes?: string,
    carrier?: string,
    trackingNumber?: string,
    trackingLink?: string
  ) {
    return this.request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, carrier, trackingNumber, trackingLink }),
    });
  }

  // Vendor approval methods
  async getVendors() {
    return this.request('/vendors');
  }

  async updateVendorStatus(id: string, action: 'approve' | 'reject') {
    return this.request(`/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  }

  async updateVendorShipping(id: string, shippingData: any) {
    return this.request(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shippingData),
    });
  }

  async resetVendorPassword(id: string, newPassword: string) {
    return this.request(`/vendors/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async bulkUpdateVendorShipping(bulkData: any) {
    return this.request('/admin/vendors/shipping/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  }

  async getStoreConfig() {
    return this.request('/config');
  }

  async updateStoreConfig(configData: any) {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  }

  async deleteCategory(category: string) {
    return this.request(`/categories?name=${encodeURIComponent(category)}`, {
      method: 'DELETE',
    });
  }

  // Admin methods
  async getAdminOrders() {
    return this.request('/admin', { params: { type: 'orders' } });
  }

  async getAdminUsers() {
    return this.request('/admin', { params: { type: 'users' } });
  }

  async getAdminOverview() {
    return this.request('/admin', { params: { type: 'all' } });
  }

  async promoteUserToAdmin(payload: { email?: string; userId?: string; action?: 'promote' | 'demote' }) {
    return this.request('/admin/promote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async removeAdminRole(payload: { email?: string; userId?: string }) {
    return this.promoteUserToAdmin({ ...payload, action: 'demote' });
  }

  // Blog methods
  async getBlogs(filters?: Record<string, any>) {
    return this.request('/blogs', { params: filters });
  }

  async getBlog(idOrSlug: string) {
    return this.request(`/blogs/${idOrSlug}`);
  }

  async createBlog(blogData: any) {
    return this.request('/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  }

  async updateBlog(id: string, blogData: any) {
    return this.request(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    });
  }

  async deleteBlog(id: string) {
    return this.request(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  // Claim methods
  async getClaims() {
    return this.request('/claims');
  }

  async getClaim(id: string) {
    return this.request(`/claims/${id}`);
  }

  async createClaim(claimData: any) {
    return this.request('/claims', {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  }

  async processClaim(id: string, claimData: any) {
    return this.request(`/claims/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(claimData),
    });
  }

  // Combo methods
  async getCombos(filters?: Record<string, any>) {
    return this.request('/combos', { params: filters });
  }

  async getCombo(id: string) {
    return this.request(`/combos/${id}`);
  }

  async createCombo(comboData: any) {
    return this.request('/combos', {
      method: 'POST',
      body: JSON.stringify(comboData),
    });
  }

  async updateCombo(id: string, comboData: any) {
    return this.request(`/combos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(comboData),
    });
  }

  async deleteCombo(id: string) {
    return this.request(`/combos/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new APIClient();
