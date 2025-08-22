# Route Implementation Patterns

## Basic Route Definition

```typescript
// pages/{{pageName}}/route.ts
import { createRoute } from "@tanstack/react-router";
import { {{parentRoute}} } from "@/core/router/routes/{{parentPath}}";

export const {{pageName}}Route = createRoute({
  getParentRoute: () => {{parentRoute}},
  path: "/{{path}}",
  component: () => import("./page").then((m) => m.{{PageName}}),
  beforeLoad: ({ context, params }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/auth/login" });
    }

    // Add parameter validation if needed
    if (!params.{{requiredParam}}) {
      throw new Error("Missing required parameter");
    }
  },
});
```

## Lazy Route Loading

```typescript
// pages/{{pageName}}/route.lazy.ts
import { createLazyRoute } from "@tanstack/react-router";

export const {{pageName}}RouteLazy = createLazyRoute("/{{path}}")({
  component: () => import("./page").then((m) => m.{{PageName}}),
});
```

## Page Component Structure

```typescript
// pages/{{pageName}}/page.tsx
import React from 'react';
import { {{PageName}}View } from './view';

export const {{PageName}}: React.FC = () => {
  return (
    <{{PageName}}ContextProvider>
      <{{PageName}}View />
    </{{PageName}}ContextProvider>
  );
};
```

## View Component Structure

```typescript
// pages/{{pageName}}/view.tsx
import React from 'react';
import { useParams } from '@tanstack/react-router';
import { Section } from '@/core/components/Section';

export const {{PageName}}View: React.FC = () => {
  const { {{param1}}, {{param2}} } = useParams({
    from: '/{{fullPath}}'
  });

  return (
    <Section title="{{title}}" description="{{description}}">
      <div>
        {/* Page content */}
      </div>
    </Section>
  );
};
```

## Parameterized Route with Validation

```typescript
export const {{resourceName}}DetailRoute = createRoute({
  getParentRoute: () => clusterRoute,
  path: "/{{resourceName}}s/$name",
  validateSearch: z.object({
    tab: z.string().optional(),
    filter: z.string().optional(),
  }),
  loader: ({ params, context }) => {
    return {
      resource: await load{{ResourceName}}(params.name),
      permissions: await loadPermissions(context.user, "{{resourceName}}"),
    };
  },
  component: {{ResourceName}}DetailPage,
});
```

## Navigation Integration

```typescript
// Update navigation in app-sidebar.tsx
const createNav = (clusterName: string, namespace: string): NavItem[] => [
  {
    title: "{{NavTitle}}",
    icon: {{IconName}},
    route: {
      to: {{pageName}}Route.fullPath,
      params: { clusterName, namespace },
    },
  },
  // ... other nav items
];
```

## Route Registration

```typescript
// @/core/router/index.ts
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    authRoute.addChildren([loginRoute, callbackRoute]),
    contentLayoutRoute.addChildren([
      clusterRoute.addChildren([
        {{pageName}}Route,
        // ... other routes
      ]),
    ]),
  ]),
});
```
