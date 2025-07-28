# PlantPro API Testing Guide

## Authentication Required
All plant lot endpoints require JWT authentication. First, get a token:

```bash
# Login to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@plantpro.com",
    "password": "admin123"
  }'
```

Save the `accessToken` from the response and use it in subsequent requests.

## Plant Lot API Examples

### 1. Create a Plant Lot
```bash
curl -X POST http://localhost:3000/api/v1/plant-lots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "speciesId": 1,
    "zoneId": 1,
    "plantCount": 100,
    "plantedDate": "2025-07-28",
    "expectedHarvestDate": "2025-10-28",
    "assignedToId": 2,
    "notes": "High yield variety planted in northern section",
    "location": {
      "section": "A",
      "row": 1,
      "column": 5
    }
  }'
```

### 2. Get All Plant Lots (with pagination and filters)
```bash
# Basic list
curl -X GET http://localhost:3000/api/v1/plant-lots \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# With filters
curl -X GET "http://localhost:3000/api/v1/plant-lots?page=1&limit=10&zoneId=1&status=growing" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Plant Lot by ID
```bash
curl -X GET http://localhost:3000/api/v1/plant-lots/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Generate QR Code for Plant Lot
```bash
curl -X GET http://localhost:3000/api/v1/plant-lots/1/qr-code \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Find Plant Lot by QR Code
```bash
curl -X GET http://localhost:3000/api/v1/plant-lots/qr/PLT-NORTH01172534901 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Update Plant Lot via QR Scan (Field Staff)
```bash
curl -X POST http://localhost:3000/api/v1/plant-lots/qr-scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "qrCode": "PLT-NORTH01172534901",
    "status": "mature",
    "currentYield": 450.5,
    "notes": "Plants looking healthy, ready for harvest next week"
  }'
```

### 7. Update Plant Lot
```bash
curl -X PATCH http://localhost:3000/api/v1/plant-lots/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "harvesting",
    "currentYield": 475.0,
    "actualHarvestDate": "2025-10-25"
  }'
```

### 8. Delete Plant Lot (Manager only)
```bash
curl -X DELETE http://localhost:3000/api/v1/plant-lots/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Expected Response Formats

### Plant Lot Object
```json
{
  "id": 1,
  "lotNumber": "NOTO17253490101",
  "qrCode": "PLT-NOTO17253490101",
  "plantCount": 100,
  "plantedDate": "2025-07-28",
  "expectedHarvestDate": "2025-10-28",
  "actualHarvestDate": null,
  "status": "seedling",
  "currentYield": null,
  "location": {
    "section": "A",
    "row": 1,
    "column": 5
  },
  "notes": "High yield variety planted in northern section",
  "speciesId": 1,
  "zoneId": 1,
  "assignedToId": 2,
  "lastScannedAt": null,
  "lastScannedBy": null,
  "createdAt": "2025-07-28T10:30:00.000Z",
  "updatedAt": "2025-07-28T10:30:00.000Z",
  "species": {
    "id": 1,
    "name": "Tomato",
    "scientificName": "Solanum lycopersicum"
  },
  "zone": {
    "id": 1,
    "name": "North Field"
  },
  "assignedTo": {
    "id": 2,
    "firstName": "Field",
    "lastName": "Staff"
  }
}
```

### Paginated List Response
```json
{
  "data": [
    // Array of plant lot objects
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## Role-Based Access
- **Manager**: All operations (create, read, update, delete)
- **Field Staff**: Create, read, update (no delete)
- **Analytics**: Read-only access

## Status Values
- `seedling` - Recently planted
- `growing` - Active growth phase
- `mature` - Ready for harvest
- `harvesting` - Currently being harvested
- `harvested` - Harvest completed
- `diseased` - Requires treatment
- `dead` - Non-viable plants
