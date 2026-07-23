# Module: Ancillary Services (Store, Transport, Library)

## Purpose
Specialized mini-portals for support staff to manage daily logistics.

## Public Interface
- **Access Routes:** `/store/*`, `/transport/*`, `/library/*`
- **Role Requirements:** `storekeeper`, `transport_matron`, `librarian`

## Implementation Notes
- **Storekeeper:** Interacts exclusively with the `public.inventory_ledger`. Records items checking IN and OUT.
- **Transport Matron:** Manages routes and rosters via the `public.bus_routes` table.

## Known Limitations / Tech Debt
- **Library Module Missing:** The PRD outlines a "Library-Bursar Bridge" to automate fines for lost books. However, no database tables currently exist for tracking library books, book loans, or fines. The `librarian` role exists, but the backend implementation is incomplete.
