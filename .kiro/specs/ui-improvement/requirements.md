# Requirements Document

## Introduction

AssetFlow is a full-stack asset rental management application with a React/TypeScript frontend. After a partial revert, the UI is in a broken state: the global CSS (`index.css`) defines a dark theme (near-black background, near-white text) while the component layer (AppLayout, AdminLayout, admin pages) was already migrated to a light Tailwind theme. This mismatch causes visual distortions — dark backgrounds bleeding through, unreadable text, garbled currency symbols, and broken component styles. The goal is a complete, consistent light-theme UI overhaul that is polished and submission-ready.

## Glossary

- **UI**: The React/TypeScript frontend application in `frontend-app/`
- **Light_Theme**: A visual design using white/light-gray backgrounds with dark text, consistent with the existing AppLayout and AdminLayout components
- **CSS_Layer**: The global stylesheet at `frontend-app/src/index.css`
- **Component_Layer**: Individual `.tsx` component and page files
- **Dark_CSS_Class**: A CSS utility class defined in `index.css` that uses dark colors (e.g. `.card`, `.page-title`, `.sidebar`, `.toast-*`)
- **Tailwind_Class**: A utility class provided by Tailwind CSS v4 (e.g. `bg-white`, `text-gray-900`)
- **Encoding_Bug**: A character rendering issue where `₹` (Indian Rupee symbol) appears as `â‚¹` due to incorrect encoding

---

## Requirements

### Requirement 1: Light Theme Global CSS

**User Story:** As a user, I want the application background and base text to be light-themed, so that the UI is readable and consistent throughout.

#### Acceptance Criteria

1. THE CSS_Layer SHALL set `body` background to white or a light gray (e.g. `#f9fafb`) and `body` text color to a dark gray (e.g. `#111827`)
2. THE CSS_Layer SHALL set scrollbar colors to light-theme equivalents (light track, medium-gray thumb)
3. WHEN any page is loaded, THE UI SHALL display a white or light-gray background with no dark regions bleeding through from the CSS_Layer
4. THE CSS_Layer SHALL redefine all dark-themed utility classes (`.card`, `.sidebar`, `.topbar`, `.table`, `.modal-content`, `.toast-*`, `.badge-*`, `.btn-*`, `.form-input`, `.form-select`, `.skeleton`, `.chip`, `.empty-state`, `.stat-card`, `.asset-card`) to use light-theme colors

### Requirement 2: Fix Dark-Theme Component Classes

**User Story:** As a user, I want all pages and components to render correctly in the light theme, so that text is readable and layouts are not distorted.

#### Acceptance Criteria

1. WHEN `AboutPage`, `ContactPage`, or `TermsPage` are rendered, THE UI SHALL display readable dark text on a light background without relying on dark CSS classes
2. WHEN `RentCalculator` is rendered inside `AssetBookingModal`, THE UI SHALL display the cost breakdown with light-theme colors (no `bg-surface-*`, `text-surface-*`, `text-primary-*` dark classes)
3. WHEN a toast notification is shown, THE UI SHALL render it with a light-theme style (white/light background, colored border, dark text)
4. THE `Toast` component SHALL use Tailwind classes directly instead of `.toast`, `.toast-success`, `.toast-error`, `.toast-info` CSS classes

### Requirement 3: Fix Currency Symbol Encoding

**User Story:** As an admin, I want currency amounts to display the ₹ symbol correctly, so that pricing information is legible.

#### Acceptance Criteria

1. WHEN `AdminPlansPage` renders plan form labels or plan cards, THE UI SHALL display `₹` (U+20B9) not the garbled sequence `â‚¹`
2. WHEN `AssetBookingModal` renders plan options in the select dropdown, THE UI SHALL display `₹` correctly
3. THE source files SHALL use the literal UTF-8 character `₹` or the HTML entity `&#8377;` — not a mis-encoded byte sequence

### Requirement 4: Consistent Input Component

**User Story:** As a user, I want form inputs to look consistent and polished in the light theme, so that forms are easy to use.

#### Acceptance Criteria

1. THE `Input` component SHALL render with a white background, light gray border, and dark placeholder text
2. WHEN an `Input` has an error, THE `Input` component SHALL render a red border and red error message below
3. WHEN an `Input` is focused, THE `Input` component SHALL render a blue focus ring

### Requirement 5: Admin Pages Visual Consistency

**User Story:** As an admin, I want all admin pages to have a consistent, polished light-theme appearance, so that the admin panel looks professional.

#### Acceptance Criteria

1. WHEN `AdminCategoriesPage`, `AdminPlansPage`, or `AdminUsersPage` are rendered, THE UI SHALL use white card backgrounds with gray borders and dark text
2. THE admin pages SHALL NOT use any dark-theme CSS classes from the CSS_Layer (`.card`, `.page-title`, `.section-title`, etc.)
3. WHEN the admin sidebar is rendered, THE `AdminLayout` SHALL display a white sidebar with gray borders and dark navigation text

### Requirement 6: Submission-Ready Polish

**User Story:** As a reviewer, I want the application to look polished and professional, so that it is ready for submission evaluation.

#### Acceptance Criteria

1. THE UI SHALL use consistent spacing, border-radius, and typography across all pages
2. WHEN interactive elements (buttons, links, inputs) are hovered, THE UI SHALL show smooth transition effects
3. THE UI SHALL display no broken layouts, overlapping elements, or invisible text on any page
4. WHERE the application uses the `RentCalculator` component, THE UI SHALL render it with a clean light card style matching the surrounding modal
