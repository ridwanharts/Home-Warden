# Security Specification - The Home Warden

This document defines the security rules, invariants, and threat models for the Firestore Database configuration of **The Home Warden**.

## 1. Core Data Invariants

1. **User Identity Isolation**: A user can only access, view, list, create, update, or delete their own data under `users/{userId}/*` collections. Accessing another user's sub-collection is strictly forbidden.
2. **Schema & Field Integrity**: All writes (`create`, `update`) must validate against strict key sizes, specific field types, and value limits (e.g., scores must be 0-100, health must be 0-100).
3. **Temporal Integrity**: Fields like `createdAt` and `updatedAt` / `lastUpdated` can only be populated using the database server time (`request.time`).
4. **Verification Safeguard**: Users must be signed-in and have a valid token (where applicable, email verification checks can be conducted).

---

## 2. The "Dirty Dozen" Attack Vectors (Vulnerability Payloads)

Here are the 12 payload attacks designed to violate safety properties. Our security rules must reject all of these with `PERMISSION_DENIED`.

1. **Spoofed Ownership ID on Creation**
   - *Target*: `/users/attacker-uid/zones/exterior`
   - *Attack*: Attacker (UID: `victim-uid`) attempts to write a document inside another user's namespace.
2. **Ghost Field Poisoning (Shadow Upgrading)**
   - *Target*: `/users/victim-uid/zones/interior`
   - *Attack*: Modifying allowed properties while inserting a malicious hidden state field like `{"isAdmin": true, "score": 90}`.
3. **Out-of-Bound Score Corruption**
   - *Target*: `/users/victim-uid/zones/exterior`
   - *Attack*: Updating a maintenance zone's score to `-250` or `9999` to break average calculation systems.
4. **Tool Health Size Exhaustion Attack**
   - *Target*: `/users/victim-uid/inventory/tool-1`
   - *Attack*: Writing a massive string (e.g. 500KB) into physical fields or range parameters to consume wallet quota.
5. **Wrong Type Injection**
   - *Target*: `/users/victim-uid/inventory/tool-2`
   - *Attack*: Passing a boolean or list to field `quantity` instead of an integer.
6. **Immutable Property Bypass**
   - *Target*: `/users/victim-uid/zones/exterior`
   - *Attack*: Changing the zone ID property itself after creation.
7. **Client-Provided Backward Timestamp Attack**
   - *Target*: `/users/victim-uid/zones/exterior`
   - *Attack*: Writing `lastMaintained` with a custom past date like `1990-01-01` to trigger false alarms.
8. **Malicious ID Character Injection (Path Poisoning)**
   - *Target*: `/users/victim-uid/inventory/malicious-item-<>?!`
   - *Attack*: Injecting SQL-like or script characters inside document IDs.
9. **Blanket Query Scraping Bypass**
   - *Target*: Collection group search on `zones`
   - *Attack*: Performing an unfiltered read across all user lists without specifying a secure individual collection restriction.
10. **Orphan Category Injection**
    - *Target*: `/users/victim-uid/inventory/item-5`
    - *Attack*: Creating an item with an empty or unsupported type (e.g. `{"type": "MaliciousType"}`).
11. **Negative Tool Quantity Exploitation**
    - *Target*: `/users/victim-uid/inventory/item-6`
    - *Attack*: Adjusting the quantity count to a negative integer like `-50`.
12. **Null/Mock Auth Injection**
    - *Target*: `/users/null/zones/test`
    - *Attack*: Unauthenticated user passing random tokens trying to gain direct read access.

---

## 3. Threat Model Checklist

| Vulnerability Threat | Mitigation logic | Success Condition |
| --- | --- | --- |
| Identity Spoofing | Enforce `request.auth.uid == userId` | Pass (Mathematically enforced) |
| State Shortcutting | Block unauthorized updates to key properties | Pass |
| Resource Poisoning | Enforce structure length (`.size() < X`) | Pass |
| No-Auth Read | Default block `match /{document=**} { allow read, write: if false; }` | Pass |
