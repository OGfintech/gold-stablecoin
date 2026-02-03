// API client for marketplace

const API_BASE = 'http://localhost:3001/api/v1'

export async function fetchCommodities(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/commodities`)
  if (!res.ok) throw new Error('Failed to fetch commodities')
  return res.json()
}

export async function fetchCommodity(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/commodities/${id}`)
  if (!res.ok) throw new Error('Failed to fetch commodity')
  return res.json()
}

export async function createCommodity(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/commodities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create commodity')
  return res.json()
}

export async function fetchOrders(role: 'buyer' | 'supplier', address: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/orders?role=${role}&address=${address}`)
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export async function createOrder(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create order')
  return res.json()
}

export async function fetchLC(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/lc/${id}`)
  if (!res.ok) throw new Error('Failed to fetch LC')
  return res.json()
}

export async function createLC(orderId: string, buyerAddress: string): Promise<any> {
  const res = await fetch(`${API_BASE}/lc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, buyerAddress })
  })
  if (!res.ok) throw new Error('Failed to create LC')
  return res.json()
}

export async function releasePayment(lcId: string, stage: 1 | 2 | 3): Promise<any> {
  const res = await fetch(`${API_BASE}/lc/${lcId}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage })
  })
  if (!res.ok) throw new Error('Failed to release payment')
  return res.json()
}

export async function uploadDocument(lcId: string, data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/lc/${lcId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to upload document')
  return res.json()
}

export async function verifyDocument(lcId: string, docId: string, verifierAddress: string): Promise<any> {
  const res = await fetch(`${API_BASE}/lc/${lcId}/documents/${docId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verifierAddress })
  })
  if (!res.ok) throw new Error('Failed to verify document')
  return res.json()
}

// Supplier/Buyer registration
export async function registerSupplier(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/suppliers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to register supplier')
  return res.json()
}

export async function registerBuyer(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/buyers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to register buyer')
  return res.json()
}
