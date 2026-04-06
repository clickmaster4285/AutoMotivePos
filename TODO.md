# Centralized Products: Selling Price + GST Auto-Calc

## Information Gathered:
**Backend:**
- `centralizedProducts.model.js`: Has `cost`, `price`
- `centralizedProduct.controller.js`: create/update take `cost`, `price`
- Need: `sellingPrice`, `gstPercentage`, auto `price = sellingPrice * (1 + gst/100)`

**Frontend:**
- `CentralizedProductsPage.tsx`: FormDialog, table
- Need: Add GST field, auto-calc price

## Plan:
1. ✅ **Backend model** → Add `sellingPrice`, `gstPercentage`
2. ✅ **Backend controller** → Auto-calculate price on create/update (fixed variable conflict)
3. [ ] **Frontend form** → Add GST input, live price calc
4. [ ] **Update table** → Show all fields

## Dependent Files:
```
Backend:
- models/centralizedProducts.model.js
- controllers/centralizedProduct.controller.js 

Frontend:
- pages/CentralizedProductsPage.tsx (table)
- components/centralized-products/ProductFormDialog.tsx (form)
```

## Followup steps:
- Backend restart `node backend/server.js`
- Frontend restart `bun dev`
- Test create → verify price = sellingPrice*(1+gst/100)

