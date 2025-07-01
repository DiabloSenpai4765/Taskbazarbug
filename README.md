# TaskBazaar

This project consists of a simple Node.js/Express backend and a static frontend for managing service vendors and customer bookings.

## API Endpoints

### `GET /api/vendor/bookings/:vendorId`
Returns a list of booking objects for the vendor with the specified `vendorId`.

Example request:
```
GET http://localhost:4000/api/vendor/bookings/4
```
Response:
```
[
  {
    "id": "...",
    "vendorId": "4",
    "customerName": "..."
    // etc
  }
]
```
