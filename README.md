# vite-plugin-tanstack-router-paths

A Vite plugin that automatically generates type-safe navigation helpers for TanStack Router routes. This plugin watches your `routeTree.gen.ts` file and generates static methods to build route paths with full TypeScript support.

## Why this plugin?

When using TanStack Router, you often need to navigate to specific routes programmatically. Instead of writing hardcoded strings like `/users/123/posts/456`, this plugin generates type-safe methods like `RoutePaths.usersByUserIdPostsByPostId(123, 456)`.

## Features

- 🔄 **Auto-generates** typed navigation methods from your TanStack Router route tree
- 🔍 **Watches** for changes in development mode and regenerates automatically  
- 🛡️ **Type-safe** with full TypeScript support
- ⚙️ **Configurable** input/output paths and class names
- 🚀 **Zero runtime overhead** - generates static methods
- 📝 **Well-documented** generated code with JSDoc comments

## Installation

```bash
npm install vite-plugin-tanstack-router-paths --save-dev
# or
yarn add vite-plugin-tanstack-router-paths --dev
# or  
pnpm add vite-plugin-tanstack-router-paths --save-dev
```

## Usage

### 1. Add the plugin to your Vite config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { routePathsPlugin } from 'vite-plugin-tanstack-router-paths'

export default defineConfig({
  plugins: [
    // Your other plugins...
    routePathsPlugin({
      inputPath: 'src/routeTree.gen.ts',   // default
      outputPath: 'src/routePaths.gen.ts', // default  
      className: 'RoutePaths'              // default
    })
  ]
})
```

### 2. The plugin will generate a file with navigation methods

Given these routes in your TanStack Router setup:
```typescript
// Example routes in your app
/users
/users/$userId  
/users/$userId/posts/$postId
/admin/settings
/products/$category
```

The plugin generates:
```typescript
// src/routePaths.gen.ts (auto-generated)
export class RoutePaths {
  /**
   * Returns the path: /users
   */
  static users(): string {
    return '/users';
  }

  /**
   * Returns the path: /users/$userId
   */  
  static usersByUserId(userId: string | number): string {
    return `/users/${userId}`;
  }

  /**
   * Returns the path: /users/$userId/posts/$postId
   */
  static usersByUserIdPostsByPostId(userId: string | number, postId: string | number): string {
    return `/users/${userId}/posts/${postId}`;
  }

  /**
   * Returns the path: /admin/settings
   */
  static adminSettings(): string {
    return '/admin/settings';
  }

  /**
   * Returns the path: /products/$category
   */
  static productsByCategory(category: string | number): string {
    return `/products/${category}`;
  }
}

export const routePaths = RoutePaths;
```

### 3. Use the generated methods in your code

```typescript
import { RoutePaths, routePaths } from './routePaths.gen'
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()

  const handleNavigation = () => {
    // Type-safe navigation with autocomplete
    navigate({ to: RoutePaths.usersByUserId(123) })
    // → navigates to "/users/123"
    
    navigate({ to: RoutePaths.usersByUserIdPostsByPostId(123, 456) })
    // → navigates to "/users/123/posts/456"
    
    navigate({ to: routePaths.adminSettings() })
    // → navigates to "/admin/settings"
  }

  return (
    <div>
      <button onClick={handleNavigation}>Navigate</button>
    </div>
  )
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inputPath` | `string` | `'src/routeTree.gen.ts'` | Path to your TanStack Router route tree file |
| `outputPath` | `string` | `'src/routePaths.gen.ts'` | Path where the generated file will be created |
| `className` | `string` | `'RoutePaths'` | Name of the generated class |

### Custom Configuration Example

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    routePathsPlugin({
      inputPath: 'src/router/routeTree.gen.ts',
      outputPath: 'src/utils/navigation.gen.ts', 
      className: 'AppRoutes'
    })
  ]
})
```

## How it Works

1. The plugin watches your `routeTree.gen.ts` file for changes
2. It parses the file to extract route paths using regex patterns
3. For each route path, it generates a corresponding static method:
   - Static segments become camelCase method names (`/admin/settings` → `adminSettings()`)
   - Dynamic segments with `$` become method parameters (`/users/$userId` → `usersByUserId(userId)`)
4. The generated file is written with full TypeScript types and JSDoc documentation

## Method Naming Convention

The plugin converts route paths to method names using these rules:

- `/users` → `users()`
- `/admin/settings` → `adminSettings()`  
- `/users/$userId` → `usersByUserId(userId: string | number)`
- `/users/$userId/posts/$postId` → `usersByUserIdPostsByPostId(userId: string | number, postId: string | number)`
- `/products/$category/$productId` → `productsByCategoryByProductId(category: string | number, productId: string | number)`

Parameters accept both `string` and `number` types for maximum flexibility.

## Integration with TanStack Router

This plugin is designed to complement TanStack Router perfectly:

```typescript
import { createRouter } from '@tanstack/react-router'
import { RoutePaths } from './routePaths.gen'

// Use with router navigation
router.navigate({ to: RoutePaths.usersByUserId(123) })

// Use with Link components  
<Link to={RoutePaths.adminSettings()}>Admin Settings</Link>

// Use in route matching
const currentPath = RoutePaths.usersByUserIdPostsByPostId(userId, postId)
```

## Development

The plugin automatically watches for changes in development mode. When you modify your routes and TanStack Router regenerates the `routeTree.gen.ts` file, this plugin will automatically update the generated navigation methods.

## Requirements

- Vite 2.0+
- TanStack Router (any version that generates `routeTree.gen.ts`)
- TypeScript (recommended)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues

If you encounter any issues or have feature requests, please create an issue on GitHub.

---

Made with ❤️ for the TanStack Router community