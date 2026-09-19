# Database Query Optimization

## Problem

Several hot-path API routes called Mongoose `.populate()` without a field
selector, which pulls the **entire referenced document** into memory and
into the response — even when the calling code only reads a handful of
fields from it. This increases MongoDB read cost, response payload size,
and (on Vercel) billed function duration.

## Routes Fixed

| Route | Was populating | Now selects |
|---|---|---|
| `app/api/cart/route.ts` (GET, POST) | full `Product` doc via `items.productId` | `title price images category waterType scientific perPairPrice weightPerPiece originalPrice discountPercentage inStock` |
| `app/api/checkout/create-order/route.ts` | full `User` (vendor) doc via `vendorId` | `nonServiceableStates deliverNorth deliverSouth` |
| `app/api/orders/route.ts` (POST) | full `User` (vendor) doc via `vendorId` | `nonServiceableStates deliverNorth deliverSouth` |
| `app/api/claims/[id]/route.ts` | full `Order` doc via `orderId`, full `Product` doc via `products.productId` | `totalAmount` / `title price` |

Each field list was derived by tracing what the consuming code (e.g.
`formatCartItem()` in the cart route, the vendor claim-detail page, the
per-vendor serviceability check) actually reads — not guessed.

## Cart Route: Single Source of Truth

`app/api/cart/route.ts` has two `.populate()` call sites (GET and POST)
that both need the same field list. Instead of duplicating the string,
it's defined once:

```ts
const CART_PRODUCT_FIELDS =
  'title price images category waterType scientific perPairPrice weightPerPiece originalPrice discountPercentage inStock';
```

and both populate calls reference `CART_PRODUCT_FIELDS`, so the two
copies can't drift out of sync.

## Maintenance Note

A field-limited `.populate()` will silently return `undefined` for any
field not in its select list — it won't throw. Each optimized call site
has a comment pointing at the code that depends on it, so if a future
feature needs a new field from the populated document, the reminder to
update the select list is right there:

```ts
// Only the fields the serviceability check below reads — add here if that check grows.
const dbProducts = await Product.find({ _id: { $in: uniqueProductIds } }).populate(
  'vendorId',
  'nonServiceableStates deliverNorth deliverSouth'
);
```

## Impact

- Smaller MongoDB reads and smaller API response payloads on the
  highest-traffic paths (cart fetch/update, checkout, order creation).
- No behavior change for existing features — every field currently
  rendered or used in business logic was preserved.
