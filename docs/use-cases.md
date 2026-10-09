# Use Cases

This document details the functional use cases for the Manufacturing Digital Operations System MVP. It maps the business workflows defined in `docs/business-process.md` into specific interactions between actors and the system, derived from `PRD.md`.

## 1. Authentication
**Use Case ID:** UC-001  
**Name:** User Authentication  
**Primary Actor:** Any User  
**Goal:** Authenticate the user and provide a session based on their role.  
**Preconditions:** User account exists.  
**Trigger:** User navigates to the application.  
**Main Success Flow:** 
1. User enters credentials.
2. System validates credentials.
3. System establishes a session with role claims.
4. System redirects user to their role-specific dashboard.  
**Alternative / Exception Flows:** 
- Invalid credentials: Error message displayed.  
**Business Rules:** Passwords must be hashed. One primary role per user.  
**Postconditions:** User is logged in.  
**Related PRD:** FR-AUTH-001, FR-AUTH-002

## 2. User and Role Management
**Use Case ID:** UC-002  
**Name:** Manage Users and Roles  
**Primary Actor:** Admin  
**Goal:** Create, update, or disable users and assign roles.  
**Preconditions:** Admin is logged in.  
**Trigger:** Admin navigates to User Management.  
**Main Success Flow:** 
1. Admin views list of users. 
2. Admin creates a new user, assigns a role, and sets a temporary password.
3. System saves the user record.  
**Alternative / Exception Flows:** 
- Duplicate email: System rejects creation.  
**Business Rules:** Admin cannot delete their own account.  
**Postconditions:** User directory is updated.  
**Related PRD:** FR-AUTH-001, FR-AUTH-002

## 3. Material Management
**Use Case ID:** UC-003  
**Name:** Manage Material Master Data  
**Primary Actor:** Admin or Warehouse Staff (depending on config)  
**Goal:** Maintain records of raw materials.  
**Preconditions:** User has appropriate role.  
**Trigger:** User needs to add a new material type to the system.  
**Main Success Flow:** 
1. User enters material name, SKU, and unit of measure.
2. User sets a minimum stock threshold.
3. System saves the material record.  
**Alternative / Exception Flows:** 
- Duplicate SKU: System rejects.  
**Business Rules:** SKU must be unique.  
**Postconditions:** Material is available for PRs and ProdOs.  
**Related PRD:** FR-INV-001

## 4. Supplier Management
**Use Case ID:** UC-004  
**Name:** Manage Suppliers  
**Primary Actor:** Purchasing Staff  
**Goal:** Maintain supplier records for procurement.  
**Preconditions:** User is Purchasing Staff.  
**Trigger:** Need to source materials from a new supplier.  
**Main Success Flow:** 
1. Staff enters supplier name, contact info, and terms.
2. System saves the supplier record.  
**Business Rules:** Supplier name must be unique.  
**Postconditions:** Supplier is available for PO creation.  
**Related PRD:** FR-PROC-004

## 5. Product Management
**Use Case ID:** UC-005  
**Name:** Manage Product Master Data (Finished Goods)  
**Primary Actor:** Admin or Production Manager  
**Goal:** Define products and their Bill of Materials (BoM).  
**Preconditions:** Material master data exists.  
**Trigger:** A new product is introduced to manufacturing.  
**Main Success Flow:** 
1. User creates a Product record (Name, SKU).
2. User adds required Materials and quantities (BoM).
3. System saves the Product.  
**Business Rules:** A product must have at least one material in its BoM.  
**Postconditions:** Product is available for Production Orders.  
**Related PRD:** FR-PROD-001, FR-PROD-003

## 6. Purchase Request
**Use Case ID:** UC-006  
**Name:** Create Purchase Request (PR)  
**Primary Actor:** Purchasing Staff  
**Goal:** Request procurement of materials.  
**Preconditions:** Material exists in master data.  
**Trigger:** Identified material shortage.  
**Main Success Flow:** 
1. Staff selects Material and enters quantity needed.
2. Staff submits PR.
3. System sets status to 'Pending Approval'.  
**Alternative / Exception Flows:** 
- Quantity <= 0: Validation error.  
**Business Rules:** PR requires managerial approval.  
**Postconditions:** PR is awaiting review.  
**Related PRD:** US-003, FR-PROC-001, FR-PROC-002

## 7. Purchase Request Approval
**Use Case ID:** UC-007  
**Name:** Approve/Reject Purchase Request  
**Primary Actor:** Manager  
**Goal:** Authorize or decline a pending PR.  
**Preconditions:** A 'Pending Approval' PR exists.  
**Trigger:** Manager reviews pending PRs.  
**Main Success Flow:** 
1. Manager reviews PR details.
2. Manager clicks 'Approve'.
3. System updates PR status to 'Approved'.  
**Alternative / Exception Flows:** 
- Manager clicks 'Reject': System updates status to 'Rejected'.  
**Business Rules:** Only Managers can approve PRs.  
**Postconditions:** PR is ready for PO creation, or closed.  
**Related PRD:** FR-PROC-001, FR-PROC-002

## 8. Purchase Order
**Use Case ID:** UC-008  
**Name:** Create Purchase Order (PO)  
**Primary Actor:** Purchasing Staff  
**Goal:** Issue a formal order to a supplier.  
**Preconditions:** An 'Approved' PR exists. Supplier exists.  
**Trigger:** Staff processes approved PRs.  
**Main Success Flow:** 
1. Staff selects Approved PR(s).
2. Staff assigns a Supplier and unit prices.
3. System generates PO.
4. Staff marks PO as 'Issued'.  
**Business Rules:** PO must link back to at least one Approved PR.  
**Postconditions:** PO is 'Issued' and awaiting receipt.  
**Related PRD:** FR-PROC-003, FR-PROC-004

## 9. Goods Receipt
**Use Case ID:** UC-009  
**Name:** Receive Goods  
**Primary Actor:** Warehouse Staff  
**Goal:** Record physical receipt of ordered materials.  
**Preconditions:** 'Issued' PO exists.  
**Trigger:** Materials arrive at warehouse.  
**Main Success Flow:** 
1. Staff opens Goods Receipt form.
2. Staff selects PO.
3. Staff enters received quantity.
4. System verifies quantity.
5. System records receipt and triggers UC-011 (Inventory Transaction).
6. System updates PO status ('Partially Received' or 'Completed').  
**Alternative / Exception Flows:** 
- Quantity > PO remaining quantity: System rejects (no over-receipt in MVP).  
**Business Rules:** Cannot receive without PO.  
**Postconditions:** Materials are acknowledged.  
**Related PRD:** US-004, FR-PROC-005

## 10. Inventory Management
**Use Case ID:** UC-010  
**Name:** View Inventory  
**Primary Actor:** Warehouse Staff / Manager  
**Goal:** View current stock levels.  
**Preconditions:** None.  
**Trigger:** User navigates to Inventory page.  
**Main Success Flow:** 
1. System queries Inventory table.
2. System displays materials, Available Stock, Reserved Stock, and Minimum Thresholds.  
**Business Rules:** Read-only view for general staff.  
**Postconditions:** User sees accurate stock.  
**Related PRD:** US-001, FR-INV-002

## 11. Inventory Transaction
**Use Case ID:** UC-011  
**Name:** Record Inventory Transaction  
**Primary Actor:** System (Triggered by Warehouse/Production)  
**Goal:** Maintain an auditable history of stock changes.  
**Preconditions:** A stock-altering event occurs (Receipt, Reservation, Consumption).  
**Trigger:** Goods Receipt completed OR Materials Reserved OR Production Completed.  
**Main Success Flow:** 
1. System calculates new stock level.
2. System inserts a record into InventoryTransaction log (Material, Quantity Change, Type, Reference ID).
3. System updates Material Available/Reserved Stock.  
**Business Rules:** Stock changes must be strictly transactional (ACID).  
**Postconditions:** Inventory numbers are updated and historically traceable.  
**Related PRD:** FR-INV-003, FR-INV-005

## 12. Low Stock Monitoring
**Use Case ID:** UC-012  
**Name:** Identify Low Stock  
**Primary Actor:** System / Warehouse Staff  
**Goal:** Flag materials that need replenishment.  
**Preconditions:** Material threshold > 0.  
**Trigger:** Inventory transaction reduces stock below threshold, OR user opens Dashboard.  
**Main Success Flow:** 
1. System evaluates Available Stock < Minimum Threshold.
2. System flags Material state as 'Low Stock'.
3. Dashboard/Inventory UI displays warning badge.  
**Business Rules:** Low stock applies only to 'Available Stock' (excluding reserved).  
**Postconditions:** Staff is aware of shortage.  
**Related PRD:** US-002, FR-INV-004

## 13. Production Order
**Use Case ID:** UC-013  
**Name:** Create Production Order  
**Primary Actor:** Production Staff  
**Goal:** Plan the manufacturing of a product.  
**Preconditions:** Product (with BoM) exists.  
**Trigger:** Production schedule demands it.  
**Main Success Flow:** 
1. Staff selects Product and enters planned quantity.
2. System calculates total required materials.
3. System saves ProdO with status 'Planned'.  
**Alternative / Exception Flows:** 
- Missing BoM: System prevents creation.  
**Business Rules:** Target Product and Quantity > 0 required.  
**Postconditions:** ProdO is created.  
**Related PRD:** US-005, FR-PROD-001, FR-PROD-002, FR-PROD-003

## 14. Material Availability Check
**Use Case ID:** UC-014  
**Name:** Check Material Availability  
**Primary Actor:** Production Staff  
**Goal:** Ensure enough materials exist to start production.  
**Preconditions:** ProdO is 'Planned'.  
**Trigger:** Staff views ProdO details.  
**Main Success Flow:** 
1. System compares ProdO required quantities vs Inventory Available Stock.
2. System visually indicates sufficient or insufficient stock per material.  
**Alternative / Exception Flows:** 
- Insufficient Stock: System disables the 'Reserve' or 'Start' button.  
**Business Rules:** Check must evaluate 'Available Stock', not 'Total Physical Stock'.  
**Postconditions:** Staff knows if production can proceed.  
**Related PRD:** US-006, FR-PROD-004

## 15. Material Reservation
**Use Case ID:** UC-015  
**Name:** Reserve Materials  
**Primary Actor:** Production Staff  
**Goal:** Logically lock materials for a specific ProdO.  
**Preconditions:** Material Availability Check passes.  
**Trigger:** Staff clicks 'Reserve Materials'.  
**Main Success Flow:** 
1. System moves quantities from 'Available Stock' to 'Reserved Stock'.
2. System logs Inventory Transactions (Reservation).
3. System updates ProdO status to 'Ready'.  
**Business Rules:** Cannot reserve more than Available Stock.  
**Postconditions:** Materials are secured. ProdO can start.  
**Related PRD:** US-006, FR-PROD-004

## 16. Production Recording
**Use Case ID:** UC-016  
**Name:** Record Production Output  
**Primary Actor:** Production Staff  
**Goal:** Log the completion of manufacturing and consume materials.  
**Preconditions:** ProdO is 'Ready' or 'In Progress'.  
**Trigger:** Physical manufacturing finishes.  
**Main Success Flow:** 
1. Staff marks ProdO as 'Completed'.
2. Staff enters actual produced quantity.
3. System triggers consumption of 'Reserved Stock' (permanently removed from inventory).
4. System forwards output to Quality Control.  
**Business Rules:** Consumes reserved materials based on planned BoM (MVP simplification).  
**Postconditions:** ProdO is finished, output awaits QC.  
**Related PRD:** FR-PROD-005

## 17. Quality Inspection
**Use Case ID:** UC-017  
**Name:** Perform Quality Inspection  
**Primary Actor:** Quality Control  
**Goal:** Inspect production output.  
**Preconditions:** A 'Completed' ProdO exists.  
**Trigger:** QC receives physical goods.  
**Main Success Flow:** 
1. QC selects the completed ProdO.
2. QC enters Pass Quantity and Fail Quantity.
3. System validates Total == Produced Quantity.
4. System logs QC Record.  
**Alternative / Exception Flows:** 
- Quantities mismatch: System rejects form submission.  
**Business Rules:** Inspection is mandatory before Finished Goods are registered.  
**Postconditions:** QC record is saved.  
**Related PRD:** US-007, FR-QC-001, FR-QC-002, FR-QC-003

## 18. Defect Recording
**Use Case ID:** UC-018  
**Name:** Record Defects  
**Primary Actor:** Quality Control  
**Supporting Actors:** System  
**Goal:** Categorize reasons for failed quality inspection.  
**Preconditions:** QC Inspection has Fail Quantity > 0.  
**Trigger:** QC enters a Fail Quantity.  
**Main Success Flow:** 
1. System prompts for defect categories/descriptions.
2. QC inputs defect details.
3. System links defect data to the QC Record.  
**Business Rules:** Defect reason is mandatory if Fail Quantity > 0.  
**Postconditions:** Defect is traceable to the ProdO.  
**Related PRD:** US-007, FR-QC-004

## 19. Finished Goods Recording
**Use Case ID:** UC-019  
**Name:** Register Finished Goods  
**Primary Actor:** System  
**Goal:** Add passed goods to inventory.  
**Preconditions:** QC Inspection logs a Pass Quantity > 0.  
**Trigger:** QC Inspection is successfully submitted.  
**Main Success Flow:** 
1. System creates an Inventory Transaction (In) for the target Product.
2. System increases Available Stock for the Product by the Pass Quantity.  
**Business Rules:** Only Pass Quantity becomes usable inventory.  
**Postconditions:** Finished Goods are available.  
**Related PRD:** Extrapolated from Workflow & QC Pass

## 20. Operational Dashboard
**Use Case ID:** UC-020  
**Name:** Monitor Operations  
**Primary Actor:** Manager  
**Supporting Actors:** All Users (limited view)  
**Goal:** Provide an overview of system status.  
**Preconditions:** User is logged in.  
**Trigger:** User views home page.  
**Main Success Flow:** 
1. System aggregates data (e.g., Pending PRs, Active ProdOs, Low Stock count).
2. System renders UI based on user role (RBAC).  
**Business Rules:** Do not display fabricated data. Adhere to strict RBAC visibility.  
**Postconditions:** User consumes operational insights.  
**Related PRD:** US-008

## 21. Audit Log
**Use Case ID:** UC-021  
**Name:** Record Audit Event  
**Primary Actor:** System  
**Goal:** Maintain system traceability.  
**Preconditions:** An auditable action occurs (e.g., PO Issued, Status Change).  
**Trigger:** Business logic completes successfully.  
**Main Success Flow:** 
1. System formats audit data (User ID, Action, Target, Timestamp).
2. System appends record to Audit Log table.  
**Business Rules:** Logs are append-only. No UI deletion capability.  
**Postconditions:** Action is traceable.  
**Related PRD:** FR-AUD-001, FR-AUD-002
