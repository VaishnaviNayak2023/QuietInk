# Security Specification for QuietInk Vault

## Data Invariants
- A VaultItem must be owned by the user who created it (`ownerId == auth.uid`).
- Encrypted payloads must be strings and have a reasonable size limit.
- Emergency contacts must be linked to the user's UID.
- Notes must be linked to the user's UID.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create a `VaultItem` with `ownerId` set to another user's UID.
2. **Path Injection**: Attempt to write to `/users/someone_else_uid/vault/item1`.
3. **Ghost Fields**: Attempt to add an `isAdmin: true` field to a `VaultItem`.
4. **Metadata Overload**: Attempt to send 1MB of garbage in the `label` field.
5. **Type Poisoning**: Sending a number where a string `encryptedPayload` is expected.
6. **Cross-User Leak**: Authenticated User A attempting to `list` documents in User B's vault path.
7. **Unverified Auth**: Attempting to write without an authenticated session.
8. **Immutable Field Change**: User attempting to change the `id` or `ownerId` of an existing `VaultItem`.
9. **State Locking Bypass**: (Not applicable yet, but good for future status fields).
10. **System Field Injection**: (Not applicable yet).
11. **Orphaned Writes**: Attempting to write a note without a valid user path.
12. **Recursive Cost Attack**: Extremely long strings in IDs to trigger expensive matching operations.

## Security Rules Strategy
- Reusable `isValidId`, `isValidVaultItem`, `isValidContact`, `isValidNote` helpers.
- `ownerId` must match `request.auth.uid`.
- Strict size and type checks on all strings.
- IMMUTABLE fields: `id`, `ownerId`, `timestamp` (for creation).
