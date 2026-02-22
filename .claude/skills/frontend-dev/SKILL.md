---
description: Frontend development patterns and conventions for misoauto. Use when working in the frontend directory, implementing frontend features, or when /implement involves frontend changes.
---

# Frontend Development Guide — MisoAuto

Follow these patterns when developing in `/Users/misodope/work/misoauto/frontend/`.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **UI Library**: Radix UI Themes (`@radix-ui/themes`) — dark mode, accent `yellow`, gray `slate`, radius `medium`
- **Data Fetching**: TanStack React Query v5 (`@tanstack/react-query`)
- **HTTP Client**: Axios with custom interceptors (`frontend/src/app/lib/axios.ts`)
- **Styling**: Radix UI layout primitives first; CSS Modules + SCSS only as a last resort
- **Package Manager**: npm
- **Monorepo Tool**: Nx

## Directory Structure

```
frontend/src/app/
├── components/          # Shared, non-page-specific UI components
├── contexts/            # React Context providers (Auth, Upload)
├── hooks/               # Custom hooks
│   ├── apis/            # API hooks organized by feature
│   │   ├── auth/
│   │   ├── videos/
│   │   ├── video-posts/
│   │   └── integrations/
│   └── index.ts         # Barrel exports for ALL hooks and types
├── lib/
│   ├── api/             # React Query client setup
│   └── axios.ts         # Axios instance with auth interceptors
├── pages/               # Route pages (auth, home, videos, integrations, legal)
├── layout.tsx           # Root layout — provider nesting order matters
├── page.tsx             # Landing page
├── globals.css
└── layout.scss
```

---

## Styling Rules (IMPORTANT)

### 1. Use Radix UI components — always prefer the component library

Before building any UI element, check if Radix UI already provides it. Always use Radix components over custom implementations.

**Layout & spacing** — use Radix layout primitives instead of SCSS for layout:
```tsx
import { Box, Flex, Grid, Container, Section } from '@radix-ui/themes';

// Padding, margin, sizing → Box props
<Box p="4" mb="3" width="100%">...</Box>

// Flex layouts
<Flex align="center" justify="between" gap="3">...</Flex>

// Grid layouts
<Grid columns="3" gap="4">...</Grid>
```

**Typography** — use `<Text />` and `<Heading />`:
```tsx
import { Text, Heading } from '@radix-ui/themes';

<Heading size="5" mb="2">Title</Heading>
<Text size="2" color="gray">Subtitle</Text>
```

**Interactive elements** — use Radix UI components:
```tsx
import { Button, IconButton, Badge, Callout, Card, Separator } from '@radix-ui/themes';
```

**Full list of available Radix UI components**: https://www.radix-ui.com/themes/docs/components/

### 2. SCSS is a last resort — only for overriding default behavior

Write SCSS **only** when:
- Overriding Radix UI default styles that cannot be controlled via props
- Applying pseudo-selectors (`:hover`, `:focus`, `::before`) where inline props don't work
- Responsive breakpoints that Radix props don't handle

**Do not** use SCSS for spacing, colors, font sizes, flex/grid layout, or anything Radix UI props can express.

```scss
// GOOD — override a Radix default that has no prop equivalent
.dataTable {
  :global(.rt-TableCell) {
    vertical-align: middle;
  }
}

// BAD — use <Box p="4"> instead
.wrapper {
  padding: 16px;
}
```

### 3. No inline `style` prop

Use Radix layout props (`p`, `m`, `width`, `style` is last resort only).

---

## Component Pattern

**Shared components belong in**: `frontend/src/app/components/{ComponentName}/`

Components used across **more than one page** go in `components/`. Page-specific components stay co-located with their page.

### File structure per component:
```
ComponentName/
├── ComponentName.tsx          # Main component file
├── ComponentName.module.scss  # Only if SCSS override is needed
├── index.ts                   # Re-export: export { default } from './ComponentName'
```

### Conventions:
- PascalCase for component name and directory
- Export props interface: `export interface ComponentNameProps { ... }`
- `'use client'` directive on all components and pages
- Build with Radix UI primitives first

### Existing shared components — check before creating new ones:

| Component | Path | Purpose |
|-----------|------|---------|
| `Modal` | `components/Modal/Modal.tsx` | Dialog modals |
| `DataTable` | `components/DataTable/DataTable.tsx` | Sortable, selectable, expandable table |
| `Drawer` | `components/Drawer/Drawer.tsx` | Slide-out panel |
| `ActionMenu` | `components/ActionMenu/ActionMenu.tsx` | Context/dropdown menu |
| `DashboardCard` | `components/DashboardCard/DashboardCard.tsx` | Card container |
| `Toaster` | `components/Toaster/` | Toast notifications |
| `Navigation` | `components/Navigation/` | Top nav + sidebar |
| `ProtectedRoute` | `components/ProtectedRoute/` | Auth-gated wrapper |

---

## API Hook Pattern (CRITICAL — Follow This Exactly)

When asked to **"implement an API"**, **"add an endpoint"**, or **"integrate an API"** on the frontend, always create:

1. A hook file in `frontend/src/app/hooks/apis/{feature}/use-{feature}.ts`
2. Barrel exports added to `frontend/src/app/hooks/index.ts`
3. Use the hooks wherever the data is consumed — never call `api.get()` directly in components

### Hook file structure — three sections always in this order:

```typescript
// frontend/src/app/hooks/apis/things/use-things.ts
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@frontend/app/lib/axios';

// ============================================================================
// Types
// ============================================================================

export interface CreateThingRequest {
  name: string;
  description?: string;
}

export interface Thing {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThingError {
  message: string;
  statusCode?: number;
  error?: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const thingKeys = {
  all: ['things'] as const,
  lists: () => [...thingKeys.all, 'list'] as const,
  list: () => [...thingKeys.lists()] as const,
  details: () => [...thingKeys.all, 'detail'] as const,
  detail: (id: number) => [...thingKeys.details(), id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

const fetchThings = async (): Promise<Thing[]> => {
  const response = await api.get('/things');
  return response.data;
};

const fetchThing = async (id: number): Promise<Thing> => {
  const response = await api.get(`/things/${id}`);
  return response.data;
};

const createThing = async (data: CreateThingRequest): Promise<Thing> => {
  const response = await api.post('/things', data);
  return response.data;
};

const deleteThing = async (id: number): Promise<void> => {
  await api.delete(`/things/${id}`);
};

// ============================================================================
// Hooks
// ============================================================================

export const useThings = (): UseQueryResult<Thing[], AxiosError<ThingError>> => {
  return useQuery<Thing[], AxiosError<ThingError>>({
    queryKey: thingKeys.list(),
    queryFn: fetchThings,
  });
};

export const useThing = (id: number): UseQueryResult<Thing, AxiosError<ThingError>> => {
  return useQuery<Thing, AxiosError<ThingError>>({
    queryKey: thingKeys.detail(id),
    queryFn: () => fetchThing(id),
    enabled: !!id,
  });
};

export const useCreateThing = (): UseMutationResult<
  Thing,
  AxiosError<ThingError>,
  CreateThingRequest
> => {
  const queryClient = useQueryClient();

  return useMutation<Thing, AxiosError<ThingError>, CreateThingRequest>({
    mutationFn: createThing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thingKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create thing:', error.response?.data?.message || error.message);
    },
  });
};

export const useDeleteThing = (): UseMutationResult<void, AxiosError<ThingError>, number> => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ThingError>, number>({
    mutationFn: deleteThing,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: thingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: thingKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete thing:', error.response?.data?.message || error.message);
    },
  });
};
```

### Reference files to read for real patterns:
- `frontend/src/app/hooks/apis/videos/use-videos.ts` — uploads, queries, cache management
- `frontend/src/app/hooks/apis/auth/auth.ts` — mutations with auth context integration
- `frontend/src/app/hooks/apis/video-posts/use-video-posts.ts` — POST/GET/DELETE patterns

### Always update `hooks/index.ts` barrel exports:

```typescript
export {
  useThings,
  useThing,
  useCreateThing,
  useDeleteThing,
  type Thing,
  type CreateThingRequest,
  type ThingError,
} from './apis/things/use-things';
```

### Using hooks in components/pages:

```tsx
import { useThings, useCreateThing } from '@frontend/app/hooks';

function ThingsPage() {
  const { data: things, isLoading, error } = useThings();
  const { mutate: createThing, isPending } = useCreateThing();

  if (isLoading) return <Spinner />;
  if (error) return <Text color="red">{error.response?.data?.message}</Text>;

  return (
    <Box p="4">
      <Flex direction="column" gap="3">
        {things?.map((thing) => <ThingCard key={thing.id} thing={thing} />)}
      </Flex>
      <Button onClick={() => createThing({ name: 'New Thing' })} loading={isPending}>
        Create
      </Button>
    </Box>
  );
}
```

---

## HTTP Client

**Always import from**: `import api from '@frontend/app/lib/axios'`

- Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'`
- Auth token automatically injected via request interceptor
- 401 responses trigger automatic token refresh with request queuing
- `withCredentials: true` for httpOnly refresh token cookies

**Never create a new Axios instance.**

---

## State Management

### Server state → React Query hooks
All server-fetched data uses hooks from `hooks/apis/`. Never call `api.get()` directly in a component.

### Client state → Context

| Context | Hook | File |
|---------|------|------|
| Auth (user, login, logout) | `useAuth()` | `contexts/AuthContext/authContext.tsx` |
| File uploads (progress, cancel) | `useUploads()` | `contexts/UploadContext/uploadContext.tsx` |
| Sidebar collapse | `useNavigation()` | `components/Navigation/NavigationContext.tsx` |

### Provider order in layout.tsx (do not change):
```
QueryProvider → AuthProvider → UploadProvider → Theme → ToastProvider → NavigationProvider
```

---

## Authentication / Protected Pages

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) return <LoadingState />;
  if (!isLoggedIn) return null;

  return <PageContent />;
}
```

---

## Forms

- Native HTML forms + React state (no form libraries)
- Radix UI form components for inputs
- Handle submission with mutation hooks
- Show errors from `error.response?.data?.message`

---

## Error Handling

```tsx
// Toast notifications
import { useToast } from '@frontend/app/components/Toaster/useToast';
const toast = useToast();
toast.error('Upload failed', error.response?.data?.message);
toast.success('Saved successfully');

// Inline error
{error && <Callout.Root color="red"><Callout.Text>{error.response?.data?.message}</Callout.Text></Callout.Root>}
```

---

## Adding a New Page Route

1. Create page at `frontend/src/app/pages/{feature}/page.tsx`
2. Add URL rewrite in `next.config.js`:
   ```js
   { source: '/feature', destination: '/pages/feature' }
   ```

---

## Checklist for Any Frontend Feature

- [ ] Read existing patterns in similar hook files before writing new ones
- [ ] Use existing shared components (Modal, DataTable, Drawer, etc.) before creating new ones
- [ ] Layout and spacing done with `<Box />`, `<Flex />`, `<Grid />` — not SCSS
- [ ] Radix UI components used for all interactive elements
- [ ] SCSS only written if overriding Radix UI defaults with no prop equivalent
- [ ] API hook file in `hooks/apis/{feature}/` with all three sections (Types, API Functions, Hooks)
- [ ] Query keys factory defined
- [ ] All hooks and types exported from `hooks/index.ts`
- [ ] Hooks consumed in components (no raw `api.get()` in components)
- [ ] Cache invalidated on mutations
- [ ] Auth guard on protected pages
- [ ] Errors surfaced via toast or Radix `<Callout />`
