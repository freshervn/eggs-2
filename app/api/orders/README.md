# Orders API

API routes for managing orders in Firebase.

## Endpoints

### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Trứng gà",
      "price": 3000,
      "quantity": 10
    }
  ],
  "total": 30000,
  "paymentMethod": "qr_code",
  "paymentUrl": "https://payment-link.com/order/123"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "abc123",
  "message": "Order created successfully"
}
```

### GET /api/orders
Get all orders (with optional filters).

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `completed`, `cancelled`)
- `limit` (optional): Limit number of results

**Example:**
```
GET /api/orders?status=pending&limit=10
```

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "count": 5
}
```

### GET /api/orders/[orderId]
Get a specific order by ID.

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "abc123",
    "items": [...],
    "total": 30000,
    "status": "pending",
    ...
  }
}
```

### PATCH /api/orders/[orderId]
Update an order.

**Request Body:**
```json
{
  "status": "completed",
  "paymentMethod": "cash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order updated successfully"
}
```

### DELETE /api/orders/[orderId]
Delete an order.

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

## Usage Example

```typescript
// Create an order
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: cartItems,
    total: 50000,
    paymentMethod: 'qr_code',
  }),
});

const data = await response.json();
console.log('Order ID:', data.orderId);
```

