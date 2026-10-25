# Passcode UI Visibility Removal

Remove all visual occurrences of the administrative/host passcode (`108`) from public UI elements, headers, tooltips, placeholders, and error messages, ensuring the passcode remains confidential during screen sharing and public displays while preserving authentic authentication mechanics.

> [!IMPORTANT]
> **Confirmed Security Improvement**: The login and authentication system logic continues to function seamlessly with passcode validation, but no visible UI hint, button text, or modal placeholder will display or hint at the passcode (`108`).

---

## 1. Overview & Core Concept
- **Goal**: Clean up user-facing screens (headers, lock buttons, authentication modals) so that hosts and presenters can mirror or broadcast their screens without revealing the host access passcode to players or audiences.
- **Scope**:
  1. `HeaderNav.tsx`: Replace `108` button text with a generic lock/unlock badge (`Unlock` or `Host`), and remove `108` from the tooltip title (`Unlock Host Controls`).
  2. `AuthProtectionModal.tsx`: Update input placeholder to `"Enter passcode"` and error message to `"Incorrect passcode. Please try again."`, removing explicit mentions of `(108)`.

---

## 2. User Experience & Visual Design
- **Header Navigation Bar**:
  - Unlocked button will show `<Lock className="..." /> <span>Host</span>` or `<Lock className="..." /> <span>Unlock</span>` instead of `<span>108</span>`.
  - Tooltip text will cleanly state `"Unlock Host Controls"`.
- **Protected Access Modal**:
  - Clean password input field without hardcoded hints in the placeholder.
  - Neutral, secure error message on invalid attempts without leaking the required code.

---

## 3. Key Product Decisions & Trade-Offs
- **Preserve Passcode Logic**:
  - *Decision*: Maintain the passcode mechanism in `sessionStorage` and `useModeratorAuth` without breaking host workflows.
  - *Rationale*: Hosts who know the passcode can log in normally without exposing the secret to viewers on projector screens.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────┐       ┌────────────────────────────┐
│      HeaderNav UI       │       │   AuthProtectionModal      │
│ (Generic "Host" Badge)  │───────> (Un-hinted Passcode Input) │
└─────────────────────────┘       └─────────────┬──────────────┘
                                                │ Validates "108"
                                                ▼
                                  ┌────────────────────────────┐
                                  │   useModeratorAuth Store   │
                                  │   (sessionStorage Auth)    │
                                  └────────────────────────────┘
```

- **Affected Components**:
  - `components/HeaderNav.tsx`
  - `components/AuthProtectionModal.tsx`
