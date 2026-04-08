const BASE = '/api';

function getToken() {
  return localStorage.getItem('japan_token');
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: (path) => req('GET', path),
  post: (path, body) => req('POST', path, body),
  put: (path, body) => req('PUT', path, body),
  delete: (path) => req('DELETE', path),

  // Auth
  login: (username, password) => req('POST', '/auth/login', { username, password }),
  me: () => req('GET', '/auth/me'),
  users: () => req('GET', '/auth/users'),
  register: (data) => req('POST', '/auth/register', data),
  changePassword: (current_password, new_password) => req('POST', '/auth/change-password', { current_password, new_password }),
  auditLog: () => req('GET', '/auth/audit-log'),

  // Cities
  cities: () => req('GET', '/cities'),
  createCity: (data) => req('POST', '/cities', data),
  updateCity: (id, data) => req('PUT', `/cities/${id}`, data),
  deleteCity: (id) => req('DELETE', `/cities/${id}`),

  // Places
  places: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/places${qs ? '?' + qs : ''}`);
  },
  createPlace: (data) => req('POST', '/places', data),
  updatePlace: (id, data) => req('PUT', `/places/${id}`, data),
  deletePlace: (id) => req('DELETE', `/places/${id}`),
  vote: (id, vote) => req('POST', `/places/${id}/vote`, { vote }),
  unvote: (id) => req('DELETE', `/places/${id}/vote`),
  comments: (id) => req('GET', `/places/${id}/comments`),
  addComment: (id, content) => req('POST', `/places/${id}/comments`, { content }),

  // Itinerary
  days: () => req('GET', '/itinerary/days'),
  createDay: (data) => req('POST', '/itinerary/days', data),
  updateDay: (id, data) => req('PUT', `/itinerary/days/${id}`, data),
  deleteDay: (id) => req('DELETE', `/itinerary/days/${id}`),
  addItem: (dayId, data) => req('POST', `/itinerary/days/${dayId}/items`, data),
  updateItem: (id, data) => req('PUT', `/itinerary/items/${id}`, data),
  deleteItem: (id) => req('DELETE', `/itinerary/items/${id}`),

  // Flights
  flights: () => req('GET', '/flights'),
  createFlight: (data) => req('POST', '/flights', data),
  updateFlight: (id, data) => req('PUT', `/flights/${id}`, data),
  deleteFlight: (id) => req('DELETE', `/flights/${id}`),
  toggleFlightPayment: (flightId, userId) => req('POST', `/flights/${flightId}/payments/${userId}`),

  // Accommodations
  accommodations: () => req('GET', '/accommodations'),
  createAccommodation: (data) => req('POST', '/accommodations', data),
  updateAccommodation: (id, data) => req('PUT', `/accommodations/${id}`, data),
  deleteAccommodation: (id) => req('DELETE', `/accommodations/${id}`),
  toggleAccomPayment: (accomId, userId) => req('POST', `/accommodations/${accomId}/payments/${userId}`),

  // Links
  links: () => req('GET', '/links'),
  createLink: (data) => req('POST', '/links', data),
  updateLink: (id, data) => req('PUT', `/links/${id}`, data),
  deleteLink: (id) => req('DELETE', `/links/${id}`),

  // Costs
  costs: () => req('GET', '/costs'),
  createCost: (data) => req('POST', '/costs', data),
  updateCost: (id, data) => req('PUT', `/costs/${id}`, data),
  deleteCost: (id) => req('DELETE', `/costs/${id}`),
  toggleCostPayment: (costId, userId) => req('POST', `/costs/${costId}/payments/${userId}`)
};
