# Mudskipper QMS Application – Requirements Document

## Contents
1. Overview & Purpose  
2. Architectural Principles  
3. Feature Requirements  
4. User Experience Requirements  
5. Permission System  
6. Data Models  
7. API Patterns  
8. Storage Architecture (Files)  
9. Data Storage Architecture (DynamoDB)  
10. Performance Requirements  
11. Security Requirements  
12. Draft Editing Concurrency  
13. Link Integrity and Deletion UX  
14. Audit Logging and Retention  
15. Business Rules & Validation  
16. Limits and Rate Limiting  
17. AI-Ready Architecture  
18. Future Considerations  
19. Implementation Guidelines  

---

## 1. Overview & Purpose

This document defines the functional requirements, business rules, and architectural principles for the Mudskipper Quality Management System (QMS) application. It focuses on **what** the system should do and **how** it should behave, rather than specific implementation technologies.

### 1.1 Application Purpose

The QMS is a document management and quality tracking system that enables organizations to:

- Manage PDF documents with version control and status tracking
- Track operational data through customizable log tables
- Manage tasks with deadlines and links to other entities
- Control access through a hierarchical permission system
- Create and edit markdown-based canvas pages
- Support future AI/ML features through clean, structured data architecture

### 1.2 Core Principles

- **Data Integrity**: All operations must maintain data consistency and audit trails.  
- **Permission-First**: Access control is enforced at every level.  
- **User-Centric**: Operations are tied to authenticated users with clear attribution.  
- **Version-Aware**: Documents and canvas pages maintain full version history with status tracking.  
- **AI-Ready**: Data structures are designed for future AI/ML integration without retrofitting.  
- **Extensible**: System supports custom log structures and future entity types.  

### 1.3 Target Scale

- **Users**: 10–20 users, supporting up to 20 comfortably.  
- **Concurrent Users**: 1–10 concurrent users.  
- **Documents**: Hundreds of documents.  
- **Canvas Pages**: Hundreds of canvas pages.  
- **Logs**: Under 100 custom logs.  
- **Log Records**: Thousands of log rows.  

---

## 2. Architectural Principles

### 2.1 Separation of Concerns

- **Data Layer**: Handles storage, retrieval, and persistence.  
- **Business Logic Layer**: Enforces rules, validation, and workflows.  
- **API Layer**: Exposes operations with authentication and authorization.  
- **Presentation Layer**: Renders UI and handles user interactions.  

### 2.2 Data Storage Rules

- All entities must have unique, stable identifiers (UUIDs recommended).  
- Timestamps must be in ISO 8601 format with UTC timezone.  
- User attribution (`created_by`, `updated_by`) must be preserved.  
- Soft deletes are preferred over hard deletes for auditability.  
- Relationships between entities use ID references, not names.  
- Content stored in structured, queryable formats (not raw HTML blobs).  
- All resources have clean, standardized metadata schemas.  

### 2.3 AI-Ready Data Structure (High-Level)

- **Structured Content**: Content stored in parseable, queryable formats (Markdown, typed fields, structured metadata).  
- **Rich Metadata**: All resources include comprehensive metadata (type, category, tags, relationships).  
- **Semantic Structure**: Content organized with semantic meaning preserved (e.g., SOP vs. contract).  
- **Extensible Schema**: Metadata schemas can be extended without breaking changes.  
- **Relationship Tracking**: Relationships inferred from links and stored for future AI processing.  

### 2.4 API Design Principles

- RESTful patterns with clear resource naming.  
- Consistent error response format: `{ error: string }` with appropriate HTTP status codes.  
- Authentication required for all operations (except public endpoints, if any).  
- Authorization checked before any data modification.  
- Pagination for large result sets.  
- Filtering and sorting capabilities where appropriate.  

### 2.5 Validation Rules

- Input validation at API boundaries.  
- Business rule validation in service layer.  
- User-friendly error messages.  
- Never trust client-side validation alone.  

---

## 3. Feature Requirements

### 3.1 Authentication & Session Management

#### Authentication Provider

- AWS Cognito User Pools (Amplify). Email-based login only.  
- Accounts are admin-invite-only (no self-signup). Admin invites create users; invited users complete signup via email flow.  
- Only users with `status = "active"` may authenticate; `suspended` and `deleted` are blocked.  

#### Sessions

- Token-based sessions via Cognito. Target session timeout: 8 hours (tokens aligned accordingly).  
- Concurrent sessions limited to 2 per user; new logins revoke the oldest session.  
- All sessions are invalidated upon password change.  
- No “remember me” functionality.  

#### Security

- Passwords never transmitted or stored in plain text (managed by Cognito).  
- Basic rate limiting on login/signup/forgot-password endpoints.  

#### User Experience

- Login prompt for unauthenticated users.  
- Session persists across page refreshes.  
- Clear indication of current user and permission level.  
- Logout option always available.  

---

### 3.2 Document Management

#### Core Operations

- Upload new PDF document to folder (creates as draft).  
- Upload new version of existing document (creates as draft).  
- View document in browser (PDF preview).  
- Download specific version or latest current version.  
- View version history with metadata and status.  
- Rename document display name.  
- Move document between folders.  
- Publish draft version (changes to current, previous current becomes superseded).  
- Discard draft version.  
- Void current version (requires note, reinstates previous current).  
- Un-void voided version (requires note).  
- Archive document (super admin only, via folder archiving).  

#### Version Management

- Semantic versioning (major.minor).  
- Version status: `draft`, `current`, `superseded`, `void`.  
- Choose version bump type (minor/major) on publish.  
- Optional PDF stamping with version label.  
- Working document attachment (source file).  
- Review date tracking.  
- Change notes for each version.  
- Void notes required and visible in history.  
- Only one draft per document at a time.  

#### Version Status Workflow

- **New document**: First upload creates `v1.0` as **draft**.  
- **Publishing draft**: Draft becomes **current**, previous current becomes **superseded**.  
- **New version**: “New version” on current creates the next version as **draft**.  
- **Voiding current**: Voiding current version reinstates previous current (similar to Git revert).  
- **Voided versions**: Remain accessible, clearly marked, can be un-voided.  

#### Organization

- Hierarchical folder structure.  
- Drag-and-drop folder/document organization.  
- Create/rename/archive folders (super admin only).  
- Search/filter folder tree.  
- Folder permissions inheritance via classifications and inheritance mode.  
- Archived folders in separate section (super admin only).  

#### UI Requirements

- Version list shows current + superseded by default.  
- “Show voided versions” toggle to display voided versions.  
- Status badges with colors (draft, current, superseded, void).  
- Actions: “Upload new version”, “Publish version”, “Mark as void”, “Discard draft”.  

#### Business Rules

- Only PDF files accepted (max 100MB).  
- Document names sanitized for filesystem safety.  
- Cannot move to non-existent folder.  
- Cannot create duplicate folder names in same parent.  
- Version numbers are sequential and cannot be skipped.  
- Working documents max 50MB.  

---

### 3.3 Log Management (Custom Data Tables)

#### Log Configuration

- Create custom log with configurable columns (super admin only).  
- Column types: `text`, `checkbox`, `dropdown`, `date`, `deadline`, `hyperlink`, `images`, `attachments`, `id`.  
- Configure dropdown options.  
- Set default filters.  
- Modify column structure (requires configure permission).  
- Classification inheritance from parent folder by default.  

#### Record Management

- Add/edit/delete records (based on classification permissions).  
- Filter records by column values.  
- Search across records.  
- Pagination for large datasets.  
- Export to CSV (respecting current filters).  
- View record history/audit trail.  

#### File Attachments

- Upload images to image columns (max 10MB per image).  
- Upload files to attachment columns (max 100MB per file).  
- View images inline.  
- Download attachments individually or as ZIP archive.  
- File metadata preserved (name, size, content type, upload date).  

#### History Tracking

- Every record change creates a history entry.  
- History preserves column structure at time of change (`columnsSnapshot`).  
- Shows before/after values.  
- Tracks user and timestamp.  
- History is filterable/searchable.  

#### Business Rules
- ID columns increment via a server-managed counter (DynamoDB transaction); clients cannot set them manually (read-only from client).  
- The server-managed counter is stored per-log (a single “counter” item per log). This is acceptable at current scale; consider ULIDs/time-ordered IDs later if contention grows.  
- Deadline columns can trigger automatic task creation on change (implementation can be deferred).  
- Image/attachment columns validate file types.  
- History entries cannot be modified.  
- Column structure changes preserve existing data.  
- Classification inherits from parent folder by default.  

---

### 3.4 Task Management

#### Task Operations

- Create task with name, assignee, deadline, notes.  
- Edit task (all fields).  
- Delete task (soft delete, super admin only).  
- Filter tasks by status, assignee, deadline.  
- View tasks in list or calendar view.  
- Link tasks to documents, logs, other tasks, external URLs, canvas pages.  

#### Task Statuses

- `new`: Initial state.  
- `acknowledged`: User has seen task.  
- `disputed`: Issue raised with task.  
- `complete`: Task finished.  
- `void`: Invalidated (separate from soft-delete).  

#### Task Links

- Support multiple link types.  
- Links use ID references (not names) where possible.  
- External links use full URLs.  
- Links can have notes/descriptions.  
- Clicking link navigates to referenced entity (with permission checks).  

#### Business Rules

- Tasks ordered by creation date (newest first).  
- Deadline is optional.  
- Assigned user must be valid user label.  
- Workflow status transitions are unrestricted (any status to any status).  
- Deleted tasks are soft-deleted.  

---

### 3.5 User Administration

#### Operations (Super Admin Only)

- List all users.  
- Invite new user (creates account with invitation).  
- Edit user (all fields including permission level).  
- Suspend/activate user.  
- Soft delete user (`status = "deleted"`, email cannot be reused).  

#### User Fields

- Email (unique, required, cannot be reused after deletion).  
- First name, last name.  
- Permission level (1–5).  
- Status (`active`, `suspended`, `deleted`).  

#### Business Rules

- Email must be unique (including deleted users).  
- Cannot change own permission level (prevents lockout).  
- Suspended users cannot log in.  
- Deleted users are soft-deleted via status only; historical attribution preserved.  
- Password is set by the invited user via Cognito’s flow.  
- Users created via admin invitation only.  

---

### 3.6 Canvas Pages

#### Core Operations

- Create canvas page in folder (super admin only).  
- Edit canvas title and blocks.  
- Save draft (unpublished).  
- Publish as new version (minor/major bump).  
- View version history.  
- Void/un-void versions (same workflow as documents).  
- Move/rename canvas pages.  
- Archive canvas pages via folder archiving (super admin only).  

#### Block Management

- Add text blocks.  
- Edit block content (raw Markdown with custom syntax).  
- Delete blocks.  
- Toggle between source (Markdown) and rendered (HTML) views.  
- Blocks maintain order.  
- Only one draft per canvas page at a time.  

#### Version Management

- Same semantic versioning as documents.  
- Same version status workflow (`draft`, `current`, `superseded`, `void`).  
- Draft state is separate from published versions.  
- Publishing creates a new version and clears the draft.  
- Version history is immutable.  

#### Linking

- Support same link types as tasks.  
- Markdown link syntax: `[Text](type:canvas id:canvas-123)` (example).  
- Links navigate to referenced entities with permission checks.  

#### Search

- Canvas Markdown content searchable (searches rendered HTML / underlying Markdown).  
- Can search all canvas pages or within a specific folder.  

#### Business Rules

- Classification inheritance from parent folder by default (via classification_mode).  
- Markdown stored as raw text (parseable later for AI).  
- Same version workflow as documents.  

---

### 3.7 Search Functionality

#### Default Search

- Searches sidebar navigation (folder names, document names, canvas titles, log names).  
- Simple text matching.  
- Results grouped by folder location.  

#### Focus Search

- Search within specific content types:  
  - Canvas markdown content (rendered HTML / Markdown text).  
  - Document metadata.  
  - Log record values.  
  - Task content.  
- Can search all items or within a specific folder.  
- Results grouped by folder location.  
- Simple text matching (no complex query syntax).  

#### Search Results

- Grouped by folder location.  
- Show type indicators (Document, Canvas, Log, Folder, Task).  
- Simple list format (no snippets/previews required at this stage).  
- Clicking result navigates to item (respecting permissions).  

#### Business Rules

- Search is client-side for current scale.  
- Full-text search across canvas content.  
- Search respects permission filters (server filters results where necessary).  

---

### 3.8 Archive System

#### Folder Archiving

- Super admin only.  
- Requires confirmation before archiving.  
- Archived folders and all contents are hidden by default.  
- Tasks under archived folders are hidden by default (still retained and discoverable by admins).  
- Archived items accessible in separate **Archived** section.  
- Super admins can unarchive folders.  
- Archive preserves all data and relationships.  
- Archiving a folder cascades to all child resources (documents, canvas pages, logs, tasks).  

#### UI Requirements

- Separate “Archived” section in sidebar.  
- Clear indication of archived status.  
- Unarchive option for super admins.  

---

### 3.9 Folder Operations

- Folders can be moved and renamed in the same way as documents/canvas/logs.  
- Maximum folder depth is **7**.  
- Archived folders can be moved and unarchived later; child resources remain archived until unarchived.  

---

## 4. User Experience Requirements

### 4.1 Navigation

- **Sidebar Tree**: Hierarchical view of folders, documents, logs, canvas pages.  
- **Search**: Filter tree by name (client-side filtering).  
- **Selection**: Click item to view/edit.  
- **Breadcrumbs**: Show current location in hierarchy.  
- **Active State**: Clear indication of selected item.  
- **Archived Section**: Separate section for archived folders (super admin only).  

### 4.2 Document Viewing

- **PDF Preview**: In-browser PDF viewer.  
- **Version List**: Table showing versions with status badges (colored).  
  - Default: Show current + superseded.  
  - Toggle: “Show voided versions”.  
- **Status Colors**: Visual status indicators (draft, current, superseded, void).  
- **Download Options**: Download latest current or specific version.  
- **Working Documents**: Download source files if available.  
- **Actions**: Upload new version, Publish draft, Mark as void, Discard draft.  

### 4.3 Log Viewing

- **Table View**: Sortable, filterable data table.  
- **Pagination**: Handle large datasets.  
- **Inline Editing**: Edit records in modal/dialog.  
- **History Toggle**: Switch between data and history views.  
- **Export**: CSV export with current filters applied.  

### 4.4 Task Management

- **List View**: All tasks with filters.  
- **Calendar View**: Tasks organized by deadline date.  
- **Task Dialog**: Create/edit task with all fields.  
- **Link Management**: Add/remove links to other entities.  
- **Status Indicators**: Visual status representation.  

### 4.5 Canvas Viewing

- **Editor Mode**: Edit title and blocks.  
- **Source/Rendered Toggle**: Switch between Markdown and HTML views.  
- **Version History**: List of published versions.  
- **Status Management**: Same as documents (draft, current, superseded, void).  

### 4.6 Responsive Design

- **Desktop First**: Optimized for desktop use.  
- **Mobile Support**: Functional on iPad and mobile devices (may have reduced features).  
- **Touch Support**: Drag-and-drop works on touch devices.  

### 4.7 Accessibility

- **Keyboard Navigation**: All features accessible via keyboard.  
- **Screen Readers**: Semantic HTML and ARIA labels.  
- **Focus Management**: Clear focus indicators.  
- **Error Announcements**: Screen reader announcements for errors where possible.  

---

## 5. Permission System

### 5.1 Permission Levels

Five hierarchical numeric levels:

- **Level 1 (Viewer)**: Can view content (documents, canvas, logs).  
- **Level 2 (Contributor)**: Level 1 + can create drafts.  
- **Level 3 (Editor)**: Level 2 + can publish versions.  
- **Level 4 (Admin)**: Level 3 + can configure resources (edit structure/metadata).  
- **Level 5 (Super Admin)**: Level 4 + can delete/archive and manage users.  

### 5.2 Resource Classifications

Each resource (document, canvas, log, folder) has a classification defining minimum permission levels:

- `view_min_level`: Minimum level to view the resource.  
- `draft_min_level`: Minimum level to create drafts.  
- `publish_min_level`: Minimum level to publish versions.  
- `configure_min_level`: Minimum level to configure (edit structure/metadata).  

### 5.3 Classification Inheritance

- Each resource has a `classification_mode`: `"inherit"` | `"explicit"`.  
  - `"inherit"`: Resource follows the parent folder’s current classification values at access time.  
  - `"explicit"`: Resource stores its own classification values and ignores parent changes.  
- New resources default to `"inherit"`. Root folder has default classification (typically all levels = 1).  
- Switching a resource from `"inherit"` to `"explicit"` captures the current effective values into the resource.  
- Switching from `"explicit"` to `"inherit"` discards the stored values and resumes following the parent.  
- No cascade update mechanism beyond `"inherit"` to keep maintenance simple.  

### 5.4 Page-Level Permissions

Pages are gated by permission checks:

- **documents**: All authenticated users can view (Level 1+).  
- **logs**: All authenticated users can view (Level 1+).  
- **tasks**: All authenticated users can view (Level 1+).  
- **admin**: Super admin only (Level 5).  
- **canvas**: All authenticated users can view (Level 1+).  

### 5.5 Feature-Level Permissions

Specific operations require appropriate permission levels:

- **View Resource**: Check resource classification `view_min_level`.  
- **Create Draft**: Check `draft_min_level`.  
- **Publish Version**: Check `publish_min_level`.  
- **Configure Resource**: Check `configure_min_level`.  
- **Archive/Delete**: Super admin only (Level 5).  
- **User Management**: Super admin only (Level 5).  

### 5.6 Permission Enforcement Rules

- Check permissions before any data access.  
- Filter results based on user permissions.  
- Return `403 Forbidden` for unauthorized operations.  
- Never expose existence of resources user cannot access (no “leaking” via error messages).  
- Permission checks must be server-side (never client-side only).  
- Classification checks are additive to page-level permissions.  

---

## 6. Data Models

### 6.1 User

```typescript
{
  id: string                    // Unique identifier (UUID)
  email: string                 // Unique, normalized to lowercase, cannot be reused after deletion
  first_name: string
  last_name: string
  permission_level: 1 | 2 | 3 | 4 | 5  // Numeric permission level
  status: "active" | "suspended" | "deleted"  // Soft delete
  created_at: ISO8601
  updated_at: ISO8601
  invited_by?: string           // User ID of admin who invited
}
```

**Business Rules**

- Email must be unique across all users (including deleted users).  
- Permission levels are hierarchical: `1 < 2 < 3 < 4 < 5`.  
- Only `active` users can authenticate.  
- Password management is handled by Cognito.  
- Users created via admin invitation only.  
- Deleted users are soft-deleted (`status = "deleted"`); email cannot be reused.  

---

### 6.2 Document

```typescript
{
  id: string                    // Unique identifier (UUID), stable across moves/renames
  path: string                  // Relative path from storage root
  display_name: string          // User-friendly name
  created_at: ISO8601
  created_by: string            // User ID
  updated_at: ISO8601
  updated_by: string            // User ID
  parent_path: string           // Folder containing document
  classification: {
    view_min_level: number
    draft_min_level: number
    publish_min_level: number
    configure_min_level: number
  }
  classification_mode: "inherit" | "explicit"

  // AI-Ready Metadata
  document_type?: string        // e.g., "SOP", "contract", "certificate"
  category?: string
  tags?: string[]
  summary?: string
  description?: string
  related_entities?: {
    documents?: string[]
    tasks?: string[]
    logs?: string[]
    canvas?: string[]
  }

  versions: DocumentVersion[]
}
```

**DocumentVersion**

```typescript
{
  version: number               // Sequential version number
  version_label: string         // Semantic version (e.g., "1.2")
  status: "draft" | "current" | "superseded" | "void"
  filename: string              // Physical file name (e.g., "file.pdf")
  uploaded_at: ISO8601
  uploader: string              // User label (name or email)
  note: string                  // Change description
  review_date?: ISO8601
  voided_at?: ISO8601
  voided_by?: string            // User ID who voided
  void_note?: string            // Required note when voiding
  unvoided_at?: ISO8601
  unvoided_by?: string          // User ID who un-voided
  unvoid_note?: string          // Required note when un-voiding
  working_template?: {
    filename: string
    content_type: string
  }
}
```

**Business Rules**

- Documents are PDF files only.  
- First version is always `v1.0` (`major = 1`, `minor = 0`) and starts as `draft`.  
- Only one draft version per document at a time.  
- New documents start in draft state until first publish.  
- Publishing a draft changes it to `current` and previous current to `superseded`.  
- Version bump: **minor** increments minor; **major** increments major and resets minor to 0.  
- Each version creates a new file; the “current” version is resolved via metadata pointer (no separate `latest.pdf`).  
- Display name is separate from folder name (can be renamed independently).  
- Voided versions remain accessible but clearly marked.  
- Voiding current version reinstates previous current version (Git-like revert).  
- Classification inherits from parent folder by default when `classification_mode = "inherit"`.  

---

### 6.3 Folder

```typescript
{
  name: string                  // Folder name (sanitized)
  path: string                  // Relative path from storage root
  parent_path: string           // Parent folder path (empty for root)
  classification: {
    view_min_level: number
    draft_min_level: number
    publish_min_level: number
    configure_min_level: number
  }
  classification_mode: "inherit" | "explicit"
  status: "active" | "archived"
  archived_at?: ISO8601
  archived_by?: string          // User ID
  created_at: ISO8601
  created_by: string            // User ID
}
```

**Business Rules**

- Folder names must be sanitized (remove invalid filesystem characters).  
- Folders can be nested to a maximum depth of 7.  
- Root folder has empty path string.  
- Folders can contain documents, canvas pages, logs, and other folders.  
- Archiving a folder requires confirmation.  
- Archived folders and contents are hidden by default.  
- Only super admins can archive/unarchive folders.  
- Classification is inherited by child resources when in `inherit` mode.  

---

### 6.4 Log (Custom Data Table)

```typescript
{
  id: string
  name: string                  // Log table name
  parent_path: string           // Folder location
  classification: {
    view_min_level: number
    draft_min_level: number
    publish_min_level: number
    configure_min_level: number
  }
  classification_mode: "inherit" | "explicit"
  columns: LogColumn[]
  records: LogRecord[]
  history: LogHistoryEntry[]
  defaultFilters?: {
    [columnId: string]: FilterConfig
  }

  // AI-Ready Metadata
  log_type?: string
  category?: string
  tags?: string[]
  description?: string

  created_at: ISO8601
  created_by: string            // User ID
  updated_at: ISO8601
  updated_by: string            // User ID
}
```

**LogColumn**

```typescript
{
  id: string
  name: string                  // Column display name
  type: "text input" | "check box" | "drop down" | "date" | "deadline" | 
        "hyperlink" | "images" | "attachments" | "id"
  options?: DropdownOption[]    // Required for drop down type
}
```

**LogRecord**

```typescript
{
  id: string
  values: {
    [columnId: string]: any     // Type depends on column type
  }
  created_at: ISO8601
  created_by: string            // User ID
  updated_at: ISO8601
  updated_by: string            // User ID
}
```

**LogHistoryEntry**

```typescript
{
  id: string
  recordId: string
  action: "created" | "updated" | "deleted"
  timestamp: ISO8601
  user: string                  // User label
  columnsSnapshot: LogColumn[]  // Column structure at time of change
  beforeValues?: { [columnId: string]: any }
  afterValues?: { [columnId: string]: any }
}
```

**Business Rules**

- Column types determine validation and UI behavior.  
- Image/attachment columns store file references, not file data.  
- History entries preserve column structure at time of change.  
- ID columns increment via a server-managed counter (DynamoDB transaction).  
- Deadline columns can trigger automatic task creation on change.  
- History entries cannot be modified.  
- Column structure changes preserve existing data.  
- Classification inherits from parent folder by default when `classification_mode = "inherit"`.  

---

### 6.5 Task

```typescript
{
  id: string
  name: string                  // Task title
  created_by: string            // User label
  assigned_to: string           // User label
  deadline?: ISO8601
  workflow_status: "new" | "acknowledged" | "disputed" | "complete" | "void"
  notes: string
  links: TaskLink[]
  created_at: ISO8601
  updated_at: ISO8601
  deletion_status: "active" | "deleted"
  deleted_at?: ISO8601
  deleted_by?: string           // User ID
}
```

**TaskLink**

```typescript
{
  id: string
  type: "document" | "task" | "log" | "log-row" | "canvas" | 
        "canvas-block" | "external" | "other"
  label: string                 // Display text
  reference: string             // ID or path depending on type
  notes?: string
}
```

**Business Rules**

- Tasks are ordered by creation date (newest first).  
- Deadline is optional.  
- Assigned user must be valid user label.  
- Workflow status transitions are unrestricted.  
- Deleted tasks are soft-deleted via `deletion_status = "deleted"`.  
- Resources created by deleted users remain attributed to their original user ID.  
- Tasks assigned to deleted/suspended users remain assigned; UI should indicate this.  
- Links use ID-based references where possible to prevent broken links.  
- External links use full URLs in `reference`.  

---

### 6.6 Canvas Page

```typescript
{
  id: string
  title: string
  parent_path: string
  created_at: ISO8601
  created_by: string            // User ID
  updated_at: ISO8601
  updated_by: string            // User ID
  semver_major: number
  semver_minor: number
  classification: {
    view_min_level: number
    draft_min_level: number
    publish_min_level: number
    configure_min_level: number
  }
  classification_mode: "inherit" | "explicit"
  versions: CanvasVersion[]
  draft?: {
    blocks: CanvasBlock[]
    updated_at: ISO8601
    updated_by: string          // User ID
  }

  // AI-Ready Metadata
  canvas_type?: string
  category?: string
  tags?: string[]
  summary?: string
  description?: string
  related_entities?: {
    documents?: string[]
    tasks?: string[]
    logs?: string[]
    canvas?: string[]
  }
}
```

**CanvasVersion**

```typescript
{
  version: number
  version_label: string         // Semantic version (e.g., "2.1")
  status: "draft" | "current" | "superseded" | "void"
  blocks: CanvasBlock[]
  published_at: ISO8601
  published_by: string          // User ID
  voided_at?: ISO8601
  voided_by?: string
  void_note?: string
  unvoided_at?: ISO8601
  unvoided_by?: string
  unvoid_note?: string
}
```

**CanvasBlock**

```typescript
{
  id: string
  type: "text"                  // Currently only text supported
  content: string               // Raw Markdown with custom syntax
  created_at: ISO8601
  created_by: string            // User ID
  modified_at: ISO8601
  modified_by: string           // User ID
}
```

**Business Rules**

- Canvas pages use same semantic versioning as documents.  
- Same version status workflow as documents.  
- Draft state is separate from published versions.  
- Publishing creates new version; draft is cleared.  
- Only one draft at a time.  
- Version history is immutable.  
- Classification inherits from parent folder by default when `classification_mode = "inherit"`.  
- Markdown content stored as raw text (parseable later for AI).  

---

### 6.7 Standard Metadata Schema (Common Fields)

All resources share common metadata fields:

```typescript
{
  // Common Fields
  id: string
  created_at: ISO8601
  created_by: string            // User ID
  updated_at: ISO8601
  updated_by: string            // User ID
  classification: {
    view_min_level: number
    draft_min_level: number
    publish_min_level: number
    configure_min_level: number
  }
  classification_mode: "inherit" | "explicit"
  
  // AI-Ready Common Fields
  resource_type: string         // "document" | "canvas" | "log" | "folder"
  type?: string                 // Resource-specific type (e.g., "SOP", "contract")
  category?: string
  tags?: string[]
  summary?: string
  description?: string
  related_entities?: {
    documents?: string[]
    tasks?: string[]
    logs?: string[]
    canvas?: string[]
  }
  
  // Resource-Specific Fields
  // (varies by resource type)
}
```

---

## 7. API Patterns

### 7.1 Authentication Endpoints

- `GET /api/auth/session` – Return current user claims and validity from Cognito token.  

### 7.2 Document Endpoints

- `GET /api/tree` – Get folder/document tree (filtered by permissions).  
- `POST /api/upload` – Upload new document (creates as draft).  
- `POST /api/document/<path>/upload-version` – Upload new version (creates as draft).  
- `POST /api/document/<path>/publish` – Publish draft version.  
- `POST /api/document/<path>/discard-draft` – Discard draft version.  
- `POST /api/document/<path>/void-version` – Void current version (requires note).  
- `POST /api/document/<path>/unvoid-version` – Un-void voided version (requires note).  
- `GET /api/document/<path>/metadata` – Get document metadata.  
- `GET /documents/<path>/latest` – Serve latest current PDF.  
- `GET /documents/<path>/versions/<n>` – Serve specific version.  
- `PATCH /api/document/<path>/rename` – Rename document.  
- `POST /api/move` – Move document/folder.  
- `POST /api/folder/<path>/archive` – Archive folder (super admin).  
- `POST /api/folder/<path>/unarchive` – Unarchive folder (super admin).  

> Note: Documents are addressed by `path` for UX clarity; other resources use IDs. All file-serving routes (including `/documents/...`) enforce authorization checks.
> Path is mutable (changes with moves/renames); the canonical identifier is the document `id`. Moves/renames update `path` only, not `id`.

### 7.3 Log Endpoints

- `GET /api/logs` – List all logs (filtered by permissions).  
- `POST /api/logs` – Create/update logs (requires configure permission) or update records only.  
- `POST /api/logs/<logId>/records/<recordId>/images` – Upload images.  
- `POST /api/logs/<logId>/records/<recordId>/attachments` – Upload attachments.  
- `GET /api/logs/<logId>/records/<recordId>/images/<imageId>` – Get image.  
- `GET /api/logs/<logId>/records/<recordId>/attachments/<attachmentId>` – Get attachment.  

### 7.4 Task Endpoints

- `GET /api/tasks` – List all tasks.  
- `POST /api/tasks` – Create task.  
- `PUT /api/tasks/<taskId>` – Update task.  
- `DELETE /api/tasks/<taskId>` – Delete task (soft delete, super admin).  

### 7.5 User Endpoints

- `GET /api/users` – List all users (super admin only).  
- `POST /api/users/invite` – Invite new user (super admin only).  
- `PUT /api/users/<userId>` – Update user (super admin only).  

### 7.6 Canvas Endpoints

- `GET /api/canvases` – List all canvases (filtered by permissions).  
- `GET /api/canvas/<canvasId>` – Get specific canvas.  
- `POST /api/canvas` – Create new canvas (super admin only).  
- `PUT /api/canvas/<canvasId>/draft` – Save draft.  
- `POST /api/canvas/<canvasId>/publish` – Publish version.  
- `POST /api/canvas/<canvasId>/discard-draft` – Discard draft.  
- `POST /api/canvas/<canvasId>/void-version` – Void current version.  
- `POST /api/canvas/<canvasId>/unvoid-version` – Un-void version.  
- `GET /api/canvas/<canvasId>/versions` – List all versions.  
- `GET /api/canvas/<canvasId>/versions/<version>` – Get specific version.  
- `PUT /api/canvas/<canvasId>/move` – Move canvas.  
- `PATCH /api/canvas/<canvasId>/rename` – Rename canvas.  

### 7.7 Search Endpoints

- `GET /api/search?q=<query>` – Default search (sidebar nav).  
- `GET /api/search?q=<query>&type=<type>&folder=<path>` – Focus search.  

### 7.8 Response Patterns

**Success Response**

```typescript
{
  // Resource data and/or:
  message?: string
}
```

**Error Response**

```typescript
{
  error: string  // Human-readable error message
}
```

**List Response**

```typescript
{
  [resourceName]: Resource[]  // e.g., { users: User[] }
}
```

### 7.9 Additional Simple Endpoints

- `GET /api/folder/<path>/metadata` – Get folder metadata.  
- `GET /api/folder/<path>/contents` – List folder contents.  
- `GET /api/resource/<type>/<id>/permissions` – Get effective permissions for current user.  
- `GET /api/resource/<type>/<id>/draft/status` – Check if draft exists and who is editing.  
- `POST /api/resource/<type>/<id>/draft/takeover` – Take over draft lock (editor/admin).  

---

## 8. Storage Architecture (Files)

### 8.1 Storage Backend

- Amazon S3 for binary file storage (PDFs, images, attachments).  
- Metadata and indices stored in DynamoDB (see Section 9).  

### 8.2 Path Structure and Validation

- Logical resource path is stored in metadata; physical S3 keys are generated and normalized.  
- Prevent directory traversal by:  
  - Rejecting `..`, leading slashes, and control characters in any user-supplied path segments.  
  - Allowing only whitelisted characters: `[A-Za-z0-9-_./ ]`, trimming and normalizing spaces.  
  - Server constructs S3 keys from sanitized identifiers; clients never provide raw S3 keys.  

### 8.3 File Naming

- Each version stored under a deterministic key, independent of status:  
  - `documents/<documentId>/versions/<version>/file.pdf`  
  - `documents/<documentId>/versions/<version>/working.<ext>` (optional).  
- Filenames presented to users may include the resource title and version label (e.g., `SOP-Widget-1.2.pdf`), but S3 keys do not include status to avoid churn.  
- Status changes never rename existing files; only metadata determines which version is “current”.  

### 8.4 Concurrent Upload Handling

- Single draft per resource enforced; uploading a new version obtains the draft lock.  
- Server rejects a second concurrent upload for the same resource/version if a draft/upload is in progress.  
- Simple idempotency keys for upload initiation to safely retry failed starts.  

### 8.5 Content Validation

- PDFs: Validate MIME type and magic bytes; reject non-PDFs.  
- Images/attachments for logs: Validate MIME type; size limits enforced (see Section 16).  
- No virus scanning at this stage.  

---

## 9. Data Storage Architecture (DynamoDB)

### 9.1 Tech Choice

- DynamoDB as the primary metadata store for users, documents, versions, folders, logs, records, tasks, and canvas pages.  

### 9.2 Relationships

- Use ID-based references (no name-based links).  
- Relationships are denormalized where needed (e.g., document has `related_entities`).  
- Where feasible, relationships are validated on write (e.g., referenced ID exists).  
- Broken links are allowed but handled in UX (see Section 13).  

### 9.3 Indexing (Simple Strategy)

- Primary keys per entity type; add GSIs as needed for:  
  - By parent folder (`parent_path` or `parent_id`).  
  - By `created_by` / `updated_by`.  
  - By status/classification filters.  
- Keep indexing minimal; expand as usage patterns emerge.  

### 9.4 Transactions

- Use DynamoDB transactions for multi-item atomicity where necessary (e.g., publishing a version updates version record and document “current” pointer).  

---

## 10. Performance Requirements

### 10.1 Response Times

- **Page Load**: Initial load < 2 seconds.  
- **API Responses**: < 500 ms for most operations.  
- **File Uploads**: Progress indication for large files.  
- **Tree Rendering**: Handle 1000+ items without noticeable lag.  

### 10.2 Scalability

- Keep approaches simple and pragmatic for current scale:  
  - **Pagination**: Required for lists > 100 items.  
  - **Lazy Loading**: Load tree nodes on demand if needed.  
  - **Caching**: Light caching of user permissions and tree structure where appropriate.  
  - **File Storage**: Efficient storage for large numbers of documents.  
  - **Search**: Client-side for current scale (can be enhanced later).  

### 10.3 Concurrent Users

- Support 1–10 concurrent users.  
- Session management handles multiple concurrent sessions.  
- No real-time updates required; page refresh acceptable.  

---

## 11. Security Requirements

### 11.1 Authentication Security

- Password hashing managed by Cognito (secure one-way hashing).  
- Session security via tokens (e.g., JWT), stored securely (HTTP-only cookies if applicable).  
- CSRF protection for state-changing operations.  
- Rate limiting to prevent brute-force attacks on login (simple sliding window).  

### 11.2 Data Security

- Input sanitization for all user inputs.  
- Path traversal prevention for all file paths.  
- File type validation (verify by MIME and magic bytes, not only extension).  
- XSS prevention: escape all user-generated content in UI.  

### 11.3 Access Control

- **Principle of Least Privilege**: Users get minimum required access.  
- Validation of permissions on the server for every request.  
- Audit logging for permission-denied attempts.  
- Data isolation: users cannot access data outside permissions.  
- File downloads: enforce authorization checks on file content responses (not only metadata).  

---

## 12. Draft Editing Concurrency

### 12.1 Single-Editor Drafts
- Only one user may hold an edit lock for a draft at a time (documents and canvas).  
- Lock records store `locked_by` (user id) and `locked_at` (timestamp).  
- UI shows who is editing and since when, with “Take over” option (where permitted).  
- Locks auto-expire after 30 minutes of inactivity (no save/heartbeat), to prevent stale locks.

### 12.2 Takeover

- “Take over” action is available to users with publish permission or admins.  
- Takeover records `taken_over_by` and timestamp in audit logs.  

### 12.3 Deleted/Suspended Users

- Soft-deleted users do not lose their drafts; drafts remain with original attribution.  
- Locks held by deleted/suspended users can be taken over by admins.  

---

## 13. Link Integrity and Deletion UX

### 13.1 Pre-Deletion Check

- When deleting or archiving a resource, show a modal listing inbound links (tasks, documents, logs, canvas) discovered via metadata.  
- User can proceed or update links; system does not auto-rewrite links.  

### 13.2 Post-Deletion Behavior

- Following a link to a deleted/missing resource shows a **“Broken Link (404)”** modal with options to:  
  - Dismiss.  
  - Open the linking item’s metadata or editor (if permitted) to repair the link.  

---

## 14. Audit Logging and Retention

### 14.1 Scope

- **View events**: Not logged.  
- **Download events**: Logged (resource id, user, timestamp).  
- **Modification events** (create/update/delete/void/unvoid/publish/takeover): Logged with necessary context (resource id, user, timestamp, action type, key metadata).  

### 14.2 Retention

- Download logs retained for **2 years**.  
- Modification logs retained **indefinitely**.  
- Exporting audit logs is not a requirement for MVP.  

---

## 15. Business Rules & Validation

### 15.1 Data Validation

- **Required Fields**: Enforced at API level, with clear error messages.  
- **Format Validation**: Email format, date format (ISO 8601), URL format.  
- **Uniqueness**: Email, folder names in same parent, document names in same folder where applicable.  
- **Type Validation**: Column types in logs, link types in tasks.  
- **Range Validation**:  
  - Version numbers must be positive.  
  - Dates must be valid ISO 8601 and logically consistent.  
  - Permission levels must be within 1–5.  
- **File Size Limits** (see also Section 16):  
  - PDF documents: 100MB.  
  - Log images: 10MB per image.  
  - Log attachments: 100MB per file.  
  - Working documents: 50MB.  

### 15.2 Workflow Rules

- **Document Upload**: Must specify folder, uploader, and file (creates as draft).  
- **Version Publishing**: Draft must be published to become `current`.  
- **Version Voiding**: Requires note; can be un-voided with note.  
- **Task Creation**: Name, creator, and assignee required.  
- **Log Record Update**: Must preserve column structure; only values change.  
- **User Creation**: Email required; admin invitation only. Password set via Cognito flow.  
- **Draft Management**: Only one draft per resource at a time; draft can be discarded.  

### 15.3 Audit Trail Requirements

- **User Attribution**: All creates/updates track user ID.  
- **Timestamps**: All entities have `created_at`; updates have `updated_at`.  
- **History Preservation**: Logs maintain full change history.  
- **Version Immutability**: Published versions cannot be modified (only voided).  
- **Soft Deletes**: All deletions are soft (status flags, not hard deletes).  
- **Void Tracking**: Void/un-void actions tracked with notes and timestamps.  

### 15.4 Error Handling

- **Validation Errors**: `400 Bad Request` with descriptive message.  
- **Not Found**: `404 Not Found` with clear resource identification.  
- **Permission Errors**: `403 Forbidden` when permission level is insufficient.  
- **Authentication Errors**: `401 Unauthorized` when token missing/invalid.  
- **Server Errors**: `500 Internal Server Error` with generic message (details in server logs only).  

---

## 16. Limits and Rate Limiting

### 16.1 File Size and Uploads

- Max PDF: **100MB**.  
- Max working document: **50MB**.  
- Log images: **10MB** per image.  
- Log attachments: **100MB** per file.  
- Max files per bulk upload: **100** at a time (if/when bulk upload is implemented).  

### 16.2 Rate Limiting (Simple)
- Auth endpoints: **5 requests/min/IP** (sliding window or token bucket).  
- Upload endpoints: **60 requests/min/IP**.  
- Other API endpoints: **120 requests/min/IP**.  
- Implementation can be simple at first; tune as needed.  
- Limits are enforced per-IP and are configurable per environment (dev/staging/prod).

### 16.3 Tree Loading

- No complex prefetch strategy initially; paginate folder contents > 100 items.  

---

## 17. AI-Ready Architecture

### 17.1 Data Structure Principles

- **Structured Content**: All content stored in parseable, queryable formats (Markdown, typed fields in logs, structured metadata).  
- **No HTML Blobs**: Avoid storing raw HTML as primary content; HTML is a render target, not a storage format.  
- **Raw Markdown**: Canvas content stored as raw Markdown (parseable later into a structured AST).  
- **Metadata Rich**: All resources include comprehensive metadata to support later AI use-cases.  
- **Relationship Tracking**: Relationships inferred from links and stored in `related_entities` fields.  

### 17.2 Metadata Standards

- **Standard Schema**: All resources share common metadata fields (see Section 6.7).  
- **Extensible**: Schema can be extended with new fields without breaking existing ones.  
- **Semantic Structure**: Content organized with semantic meaning preserved (e.g., `type: "SOP"` vs. `type: "contract"`).  
- **Type System**: Resources have `type`, `category`, and `tags` for classification and AI filtering.  

### 17.3 Content Storage

- **Documents**: PDF files + rich metadata (type, category, tags, summary, description).  
- **Canvas**: Raw Markdown with custom syntax (parseable to structured formats later).  
- **Logs**: Structured records with typed columns (easily queryable).  
- **Relationships**: Inferred from links; can be extracted to build graphs for AI/analytics.  

### 17.4 Future AI Integration Points

- **Content Extraction**: PDF text extraction can be added later.  
- **Semantic Parsing**: Canvas Markdown can be parsed into structured representations for AI.  
- **Vector Embeddings**: Metadata and text fields can be embedded; design supports attaching vector IDs externally.  
- **Relationship Graphs**: Link structure supports graph-based AI (e.g., “which SOPs relate to this non-conformance?”).  
- **Search Enhancement**: Structured data supports semantic search or hybrid search (keyword + vector).  

---

## 18. Future Considerations

### 18.1 Planned Features (Post-MVP)

- **Notifications**:  
  - Task deadline reminders.  
  - Document review alerts.  
  - Log deadline alerts.  
- **Slack Integration**: Simple webhook support for notifications.  
- **Advanced Search**: Full-text search with semantic capabilities.  
- **Reporting**: Generate reports from log data (e.g., non-conformance trends).  
- **Bulk Operations**: Bulk upload, bulk edit capabilities (documents and logs).  
- **Canvas Enhancements**: Additional block types (tables, diagrams), templates, export to PDF.  

### 18.2 Extensibility Points

- **Custom Column Types**: Allow pluggable new log column types in future.  
- **Workflow Engine**: Configurable approval workflows (e.g., document approval chains).  
- **Integration APIs**: Webhook support, external system integration (ERP, CRM).  
- **Multi-tenancy**: Support for multiple organizations if needed in future (currently single-tenant).  

### 18.3 Technical Debt Considerations

- **Migration Path**: Plan for data migration from current system into Mudskipper.  
- **Backup Strategy**: Automated backup and recovery for DynamoDB and S3.  
- **Monitoring**: Application performance and error monitoring.  
- **Documentation**: Up-to-date API documentation, user guides, admin guides.  

---

## 19. Implementation Guidelines

### 19.1 Code Organization

- **Modular Structure**: Separate concerns into modules/services (auth, documents, logs, tasks, canvas, permissions, audit).  
- **Reusable Components**: Build reusable UI components (tables, dialogs, sidebars, status badges).  
- **Consistent Naming**: Follow established naming conventions for resources, endpoints, and fields.  
- **Type Safety**: Use TypeScript (frontend/backend) where possible.  

### 19.2 Testing Requirements

- **Unit Tests**: Test business logic and utilities.  
- **Integration Tests**: Test API endpoints and workflows (e.g., publish document, create log record).  
- **E2E Tests**: Test critical user flows (login, upload doc, publish, create task, etc.).  
- **Permission Tests**: Verify access control works correctly at all levels and for all resource types.  

### 19.3 Documentation Requirements

- **API Documentation**: Document all endpoints with request/response examples.  
- **Code Comments**: Explain complex business logic where non-obvious.  
- **User Guides**: Document how to use core features (documents, logs, tasks, canvas, archive).  
- **Architecture Docs**: Document system design decisions and rationale (e.g., why DynamoDB + S3, why classification model).  

---

**Target Platform**: React + AWS Amplify Gen 2
