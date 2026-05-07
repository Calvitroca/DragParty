# Security Spec - Drag Party Extravaganza

## Data Invariants
1. A **Registration** must belong to the authenticated user (`userId == auth.uid`).
2. A **Registration** must have a `dragName` (max 100 chars) and `performanceMusic` (max 200 chars).
3. A **User** profile can only be read/written by the owner.
4. `isAdmin` is an immutable field for regular users.

## The Dirty Dozen Payloads

1. **Identity Theft (Registration)**:
   - Operation: `create` /registrations/bad-id
   - Payload: `{ "userId": "victim-uid", "dragName": "Evil Queen", "performanceMusic": "None" }` (where `request.auth.uid == "attacker-uid"`)
   - Outcome: `PERMISSION_DENIED`

2. **Resource Exhaustion (Drag Name)**:
   - Operation: `create` /registrations/new-id
   - Payload: `{ "userId": "my-uid", "dragName": "A".repeat(10000), ... }`
   - Outcome: `PERMISSION_DENIED` (Size limit exceeded)

3. **Privilege Escalation (User)**:
   - Operation: `update` /users/my-uid
   - Payload: `{ "isAdmin": true, ... }`
   - Outcome: `PERMISSION_DENIED` (Cannot modify admin status)

4. **Orphaned Registration**:
   - Operation: `create` /registrations/new-id
   - Payload: `{ "userId": "my-uid", ... }` (but `/users/my-uid` does not exist yet)
   - Outcome: `PERMISSION_DENIED` (User profile must exist)

5. **Unauthorized Multi-Access**:
   - Operation: `list` /registrations
   - Payload: `query.where("userId", "!=", "my-uid")`
   - Outcome: `PERMISSION_DENIED`

6. **Immutability Breach (CreatedAt)**:
   - Operation: `update` /registrations/my-id
   - Payload: `{ "createdAt": "2000-01-01T00:00:00Z", ... }`
   - Outcome: `PERMISSION_DENIED`

7. **Status Forgery**:
   - Operation: `update` /registrations/my-id
   - Payload: `{ "status": "confirmed", ... }` (when client should only be able to set `pending`)
   - Outcome: `PERMISSION_DENIED` (if restricted)

8. **Shadow Field Injection**:
   - Operation: `create` /registrations/new-id
   - Payload: `{ "userId": "my-uid", "dragName": "Queen", "performanceMusic": "M", "extra": "poison" }`
   - Outcome: `PERMISSION_DENIED` (Strict keys filter)

9. **PII Leakage**:
   - Operation: `get` /users/other-uid
   - Outcome: `PERMISSION_DENIED`

10. **Unauthenticated Write**:
    - Operation: `create` /registrations/new-id
    - Auth: `null`
    - Outcome: `PERMISSION_DENIED`

11. **Malicious ID Poisoning**:
    - Operation: `get` /registrations/very-long-id-with-junk-characters-!@#$%^&*()
    - Outcome: `PERMISSION_DENIED` (isValidId check)

12. **State Shortcutting**:
    - Operation: `update` /registrations/my-id
    - Payload: `{ "status": "cancelled" }` (but registration was already `confirmed` and locked)
    - Outcome: `PERMISSION_DENIED` (Terminal state lock)
