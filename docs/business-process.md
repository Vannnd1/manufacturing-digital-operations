# Business Processes

This document defines the core business workflows for the Manufacturing Digital Operations System, based on the requirements defined in `PRD.md`.

---

## 1. Authentication and Role Access

- **Actors:** Any User, System
- **Trigger:** User attempts to access the application.
- **Preconditions:** The user account must be registered by an Admin.
- **Main Flow:**
  1. User navigates to the login page.
  2. User submits credentials (username/email and password).
  3. System validates credentials.
  4. System retrieves the user's assigned role.
  5. System grants access to role-specific modules.
- **Alternative/Error Flows:**
  - *Invalid credentials:* System rejects login and shows an error message.
  - *Unauthorized access attempt:* If a logged-in user tries to access a route outside their role, the system denies access and redirects to a safe default page.
- **Business Rules:**
  - Passwords must be hashed.
  - Users can only have one primary role in the MVP.
- **State Changes:** User session becomes Active.
- **Result:** User is authenticated and securely routed to their authorized dashboard.

---

## 2. Procurement (Overview)

- **Actors:** Purchasing Staff, Manager
- **Trigger:** Material stock is low or specific materials are needed for production.
- **Preconditions:** Material master data must exist in the system.
- **Main Flow:**
  1. Warehouse or System identifies material shortage.
  2. Purchasing Staff creates a Purchase Request (PR).
  3. Manager approves the PR.
  4. Purchasing Staff converts the approved PR into a Purchase Order (PO).
  5. PO is sent to the Supplier (simulated).
- **Alternative/Error Flows:**
  - *PR Rejected:* Manager rejects PR, workflow stops.
- **Business Rules:** A PO can only be created from an Approved PR.
- **State Changes:** PR (`Draft` -> `Pending` -> `Approved` / `Rejected`). PO (`Draft` -> `Issued`).
- **Result:** A formalized order is placed with a supplier.

---

## 3. Purchase Request (PR)

- **Actors:** Purchasing Staff, Manager
- **Trigger:** Need to procure materials.
- **Preconditions:** Material exists in master data.
- **Main Flow:**
  1. Purchasing Staff initiates a new PR.
  2. Staff selects the material and enters the requested quantity and target date.
  3. Staff submits the PR for approval.
  4. Manager reviews the PR.
  5. Manager approves the PR.
- **Alternative/Error Flows:**
  - *Manager rejects PR:* PR status becomes 'Rejected' with an optional reason. It cannot be processed further.
- **Business Rules:** Requested quantity must be greater than zero.
- **State Changes:** PR status: `Draft` -> `Pending Approval` -> `Approved`.
- **Result:** An approved PR ready to be converted into a PO.

---

## 4. Purchase Order (PO)

- **Actors:** Purchasing Staff
- **Trigger:** A Purchase Request has been approved.
- **Preconditions:** An Approved PR exists. Supplier master data exists.
- **Main Flow:**
  1. Purchasing Staff selects an Approved PR.
  2. Staff assigns a Supplier and unit price.
  3. Staff generates the PO.
  4. Staff marks the PO as 'Issued'.
- **Alternative/Error Flows:**
  - *Supplier unavailable:* Staff must create a new supplier in master data before proceeding.
- **Business Rules:** PO must reference at least one Approved PR. Total cost is calculated automatically.
- **State Changes:** PO status: `Draft` -> `Issued`. PR status updates to `Fulfilled` (or linked to PO).
- **Result:** PO is active and awaiting Goods Receipt.

---

## 5. Goods Receipt

- **Actors:** Warehouse Staff
- **Trigger:** Physical materials arrive at the warehouse from a supplier.
- **Preconditions:** An 'Issued' Purchase Order exists.
- **Main Flow:**
  1. Warehouse Staff receives materials and opens the Goods Receipt module.
  2. Staff selects the matching PO.
  3. Staff inputs the actual received quantity.
  4. System verifies the quantity against the PO.
  5. Staff confirms the receipt.
  6. System triggers an inventory update.
- **Alternative/Error Flows:**
  - *Partial Receipt:* Received quantity is less than PO quantity. PO remains open for remaining balance.
  - *Over Receipt:* System flags error if received quantity exceeds PO tolerance (strictly enforced for MVP).
- **Business Rules:** Goods Receipt cannot be processed without a valid PO.
- **State Changes:** PO status: `Issued` -> `Partially Received` / `Completed`.
- **Result:** Materials are physically acknowledged and ready to be added to Inventory.

---

## 6. Inventory

- **Actors:** System, Warehouse Staff
- **Trigger:** Goods Receipt is completed, or Production consumes materials.
- **Preconditions:** Material master data is configured with Minimum Stock Thresholds.
- **Main Flow:**
  1. Goods Receipt completion automatically adds quantity to 'Available Stock'.
  2. System records an Inventory Transaction log (In/Out).
  3. System evaluates 'Available Stock' against 'Minimum Stock Threshold'.
  4. If stock is below threshold, system flags the material as 'Low Stock'.
- **Alternative/Error Flows:**
  - *Manual Adjustment:* Warehouse Staff performs a manual cycle count adjustment (creates a specific transaction log).
- **Business Rules:** Stock quantity cannot be negative.
- **State Changes:** Material Stock Quantity updates. Material Status: `Normal` <-> `Low Stock`.
- **Result:** Accurate, real-time reflection of material availability.

---

## 7. Production Order

- **Actors:** Production Staff
- **Trigger:** Requirement to manufacture finished goods.
- **Preconditions:** Product (Finished Good) master data and its required materials (Bill of Materials concept) exist.
- **Main Flow:**
  1. Production Staff creates a new Production Order (ProdO).
  2. Staff selects the target Product and planned output quantity.
  3. System calculates the total required materials based on the planned quantity.
  4. Staff saves the order as 'Planned'.
- **Alternative/Error Flows:**
  - *Invalid quantity:* System rejects if planned quantity is zero or negative.
- **Business Rules:** A Production Order must specify exactly one target Product.
- **State Changes:** ProdO status: `Planned`.
- **Result:** A formalized plan to produce specific goods.

---

## 8. Material Availability / Reservation

- **Actors:** System, Production Staff
- **Trigger:** A Production Order is ready to start.
- **Preconditions:** ProdO is in 'Planned' state.
- **Main Flow:**
  1. Production Staff initiates a Material Availability Check for the ProdO.
  2. System compares required material quantities against 'Available Stock' in Inventory.
  3. System confirms sufficient stock.
  4. Staff clicks 'Reserve Materials'.
  5. System deducts the required amount from 'Available Stock' and adds it to 'Reserved Stock'.
- **Alternative/Error Flows:**
  - *Insufficient Stock:* System blocks the reservation and highlights which materials are short. ProdO cannot proceed.
- **Business Rules:** Physical stock is not removed from the warehouse during reservation, only logically locked to prevent double-booking.
- **State Changes:** Inventory Available Stock decreases. Inventory Reserved Stock increases. ProdO status: `Ready`.
- **Result:** Materials are secured for the specific Production Order.

---

## 9. Production

- **Actors:** Production Staff
- **Trigger:** Materials are reserved and physical manufacturing begins.
- **Preconditions:** ProdO status is 'Ready'.
- **Main Flow:**
  1. Production Staff marks the ProdO as 'In Progress'.
  2. Physical production occurs (outside the system).
  3. Staff records the actual produced quantity.
  4. System marks ProdO as 'Completed'.
  5. System permanently deducts the 'Reserved Stock' from the Inventory (materials consumed).
- **Alternative/Error Flows:**
  - *Cancellation:* If cancelled while 'In Progress', 'Reserved Stock' is released back to 'Available Stock'.
- **Business Rules:** Produced quantity can vary slightly from planned quantity, but materials consumed remain as reserved for MVP simplicity.
- **State Changes:** ProdO status: `Ready` -> `In Progress` -> `Completed`. Inventory Reserved Stock decreases.
- **Result:** Finished goods are ready for Quality Control. Materials are officially consumed.

---

## 10. Quality Control (QC)

- **Actors:** Quality Control
- **Trigger:** A Production Order is marked as 'Completed'.
- **Preconditions:** Produced goods are physically awaiting inspection.
- **Main Flow:**
  1. QC opens the Quality Inspection module.
  2. QC selects the completed ProdO.
  3. QC enters inspection results (Pass quantity, Fail quantity).
  4. If Failed, QC selects a Defect Category/Reason.
  5. System logs the Inspection Record.
  6. Passed quantity is added to Finished Goods Inventory.
- **Alternative/Error Flows:**
  - *Total Failure:* If all items fail, 0 is added to Finished Goods. The entire batch is recorded as Defective.
- **Business Rules:** Pass Quantity + Fail Quantity must equal the Total Produced Quantity.
- **State Changes:** QC Record: `Completed`. Finished Goods Inventory increases.
- **Result:** Quality is verified, and usable goods are placed in inventory.

---

## 11. Dashboard

- **Actors:** Manager (Primary), All Users (Role-specific views)
- **Trigger:** User navigates to the home/dashboard page.
- **Preconditions:** User is authenticated.
- **Main Flow:**
  1. System queries current operational states (Pending PRs, Open POs, Low Stock items, Active ProdOs, Recent QC failures).
  2. System aggregates data.
  3. Dashboard renders information in tables and simple metrics.
- **Alternative/Error Flows:**
  - *No Data:* System clearly displays "No active records" empty states instead of fake data.
- **Business Rules:** Users only see dashboard widgets relevant to their RBAC permissions. Managers see the consolidated view.
- **State Changes:** None (Read-only).
- **Result:** User gains immediate operational awareness.

---

## 12. Auditability

- **Actors:** System
- **Trigger:** A critical state change occurs (e.g., PR Approved, PO Issued, Goods Received, Inventory Adjusted, ProdO Completed, QC Recorded).
- **Preconditions:** Action is defined as 'auditable' in the system design.
- **Main Flow:**
  1. User performs a critical action.
  2. System processes the core business logic.
  3. System asynchronously (or within the same transaction) writes a record to the Audit Log.
  4. The record includes: Timestamp, User ID, Action Type, Entity ID, and a brief description.
- **Alternative/Error Flows:**
  - *Transaction Failure:* If the main action fails and rolls back, the audit log for that specific success action is not written.
- **Business Rules:** Audit logs are append-only. They cannot be edited or deleted through the UI.
- **State Changes:** New Audit Log entry created.
- **Result:** A permanent, traceable history of who did what and when.
