# Countdown Timer Shopify App

A Shopify app that lets merchants add countdown timers to their product pages. Perfect for creating urgency during sales and promotions.

## What It Does

Merchants can create countdown timers that display on their storefront. Timers can be:
- **Fixed timers**: Show a countdown to a specific end date
- **Evergreen timers**: Reset for each visitor (session-based)

Timers can target all products, specific products, or collections. The app tracks how many times each timer is displayed (impressions).

## Setup Instructions

### Prerequisites

- Node.js 18+ (we use Node 18, but 20+ works too)
- A Shopify Partner account
- A development store for testing
- MongoDB database (we use MongoDB Atlas for production, but local MongoDB works for development)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd shopify-countdown-timer
```

2. Install dependencies:
```bash
npm install
cd web && npm install
cd ../web/frontend && npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products
MONGODB_URI=your_mongodb_connection_string
HOST=your_app_url
```

4. Run the app:
```bash
npm run dev
```

The Shopify CLI will handle tunneling and provide you with a URL to access your app.

### Running Tests

```bash
cd web
npm install --save-dev vitest @vitest/ui
npm test
```

## Architecture Decisions

### Why MongoDB?

We chose MongoDB because:
- Timer data is document-based (nested appearance settings, target IDs arrays)
- Easy to query by shop and filter by product/collection
- Scales well for multiple merchants

### Why Separate Public API?

The storefront extension needs to fetch timer data without authentication. We created a separate public router (`/api/timers/public`) that:
- Doesn't require Shopify session authentication
- Uses CORS headers to allow cross-origin requests from the storefront
- Only exposes the minimal data needed (no sensitive info)

### Frontend vs Backend Separation

- **Backend** (`web/`): Express server with MongoDB, handles all timer logic
- **Frontend** (`web/frontend/`): React admin interface for merchants to manage timers
- **Extension** (`extensions/`): Theme app extension that displays timers on the storefront

This separation keeps concerns clean - the extension is lightweight and doesn't need React or heavy dependencies.

### Utility Functions

We extracted timer logic into `web/utils/timerUtils.js` because:
- Multiple controllers use the same functions (status calculation, date checking)
- Easier to test in isolation
- Keeps controllers focused on HTTP handling

## Assumptions Made

1. **One active timer per product**: If multiple timers match a product, we return the first one. In the future, we might want to show multiple timers or let merchants prioritize.

2. **Collection matching requires API calls**: To check if a product belongs to a collection, we need to query Shopify's API. This means collection timers require the app to be installed and have an active session.

3. **Impression tracking is fire-and-forget**: We don't wait for the impression API call to complete. If it fails, the timer still displays - we just lose that impression count.

4. **Evergreen timers use localStorage**: Each visitor gets their own timer session stored in browser localStorage. This means the timer resets if they clear their browser data.

5. **Fixed timers use server time**: All date comparisons use the server's current time, not the browser's time. This prevents timezone issues but means the timer might be slightly off if the server clock is wrong.

## API Endpoints

### Admin Endpoints (Require Authentication)

All admin endpoints require a valid Shopify session.

#### Get All Timers
```
GET /api/timers
```
Returns all timers for the authenticated shop.

**Response:**
```json
{
  "timers": [
    {
      "_id": "timer_id",
      "name": "Summer Sale",
      "type": "fixed",
      "startDate": "2025-06-01T00:00:00Z",
      "endDate": "2025-06-30T23:59:59Z",
      "status": "active",
      "impressions": 150
    }
  ]
}
```

#### Create Timer
```
POST /api/timers
```
Creates a new timer.

**Request Body:**
```json
{
  "name": "Black Friday Sale",
  "type": "fixed",
  "startDate": "2025-11-25T00:00:00Z",
  "endDate": "2025-11-30T23:59:59Z",
  "targetType": "all",
  "appearance": {
    "backgroundColor": "#000000",
    "textColor": "#FFFFFF",
    "position": "top",
    "text": "Hurry! Sale ends in"
  }
}
```

#### Get Single Timer
```
GET /api/timers/:id
```
Returns a specific timer by ID.

#### Update Timer
```
PUT /api/timers/:id
```
Updates an existing timer. Same request body format as create.

#### Delete Timer
```
DELETE /api/timers/:id
```
Deletes a timer.

### Public Endpoints (No Authentication)

These endpoints are used by the storefront extension.

#### Get Timer for Product
```
GET /api/timers/public/:productId?shop=shop-domain.myshopify.com
```
Returns the active timer for a specific product, if one exists.

**Response:**
```json
{
  "timer": {
    "id": "timer_id",
    "type": "fixed",
    "endDate": "2025-06-30T23:59:59Z",
    "duration": null,
    "appearance": {
      "backgroundColor": "#000000",
      "textColor": "#FFFFFF",
      "position": "top",
      "text": "Hurry! Sale ends in"
    }
  }
}
```

If no timer is active, returns:
```json
{
  "timer": null
}
```

#### Track Impression
```
GET /api/timers/public/impression?timerId=timer_id
```
Increments the impression count for a timer. This is called automatically when a timer is displayed on the storefront.

**Response:**
```json
{
  "success": true,
  "impressions": 151
}
```

## Project Structure

```
shopify-countdown-timer/
├── web/                    # Backend server
│   ├── controllers/         # Request handlers
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── utils/               # Helper functions
│   ├── tests/               # Unit tests
│   └── frontend/            # React admin UI
└── extensions/              # Theme app extension
    └── countdown-timer-extension/
        ├── assets/          # JavaScript and CSS
        └── blocks/          # Liquid template
```

## Development Tips

- The extension needs the app URL configured in the block settings. When running `npm run dev`, copy the tunnel URL from your terminal and paste it in the Countdown Timer block settings.
- Timer status is calculated on-the-fly, so you don't need to manually update expired timers.
- For testing collection targeting, make sure your app has `read_products` scope and the shop has an active session.

## License

UNLICENSED
