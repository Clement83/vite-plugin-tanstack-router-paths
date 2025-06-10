import { Plugin } from 'vite';
import { promises as fs } from 'fs';
import path from 'path';
import { watch } from 'chokidar';

export interface RoutePathsPluginOptions {
    /**
     * Path to the routeTree.gen.ts file
     * @default 'src/routeTree.gen.ts'
     */
    inputPath?: string;
    /**
     * Output path for the generated file
     * @default 'src/routePaths.gen.ts'
     */
    outputPath?: string;
    /**
     * Name of the generated class
     * @default 'RoutePaths'
     */
    className?: string;
}

interface RouteInfo {
    path: string;
    methodName: string;
    params: string[];
}

/**
 * Vite plugin to automatically generate typed navigation methods from TanStack Router route tree
 */
export function routePathsPlugin(options: RoutePathsPluginOptions = {}): Plugin {
    const {
        inputPath = 'src/routeTree.gen.ts',
        outputPath = 'src/routePaths.gen.ts',
        className = 'RoutePaths'
    } = options;

    let root = '';
    let watcher: any;

    return {
        name: 'vite-route-paths-generator',

        configResolved(config) {
            root = config.root;
        },

        async buildStart() {
            await generateRoutePaths();

            // Watch for changes in development mode
            if (process.env.NODE_ENV !== 'production') {
                const inputFullPath = path.resolve(root, inputPath);
                watcher = watch(inputFullPath);

                watcher.on('change', async () => {
                    console.log(`[route-paths] Detected change in ${inputPath}`);
                    await generateRoutePaths();
                });
            }
        },

        async buildEnd() {
            if (watcher) {
                await watcher.close();
            }
        }
    };

    async function generateRoutePaths() {
        try {
            const inputFullPath = path.resolve(root, inputPath);
            const outputFullPath = path.resolve(root, outputPath);

            // Check if input file exists
            try {
                await fs.access(inputFullPath);
            } catch {
                console.warn(`[route-paths] File ${inputPath} not found, skipping generation`);
                return;
            }

            // Read the routeTree.gen.ts file
            const content = await fs.readFile(inputFullPath, 'utf-8');

            // Extract routes
            const routes = extractRoutes(content);

            // Generate TypeScript code
            const generatedCode = generateTypeScriptCode(routes, className);

            // Write output file
            await fs.writeFile(outputFullPath, generatedCode, 'utf-8');

            console.log(`[route-paths] Generated ${routes.length} methods in ${outputPath}`);

        } catch (error) {
            console.error('[route-paths] Error during generation:', error);
        }
    }

    function extractRoutes(content: string): RouteInfo[] {
        const routes: RouteInfo[] = [];

        // Regex to extract route paths
        // Looks for patterns like: path: '/toto/tata' or path: '/tutu/$id'
        const pathRegex = /path:\s*['"`]([^'"`]+)['"`]/g;

        let match;
        while ((match = pathRegex.exec(content)) !== null) {
            const routePath = match[1];

            // Skip empty routes or simple root routes
            if (!routePath || routePath === '/') continue;

            const routeInfo = parseRoute(routePath);
            if (routeInfo) {
                routes.push(routeInfo);
            }
        }

        // Remove duplicates
        return routes.filter((route, index, self) =>
            index === self.findIndex(r => r.methodName === route.methodName)
        );
    }

    function parseRoute(routePath: string): RouteInfo | null {
        // Extract parameters (segments starting with $)
        const segments = routePath.split('/').filter(Boolean);
        const params: string[] = [];
        const pathSegments: string[] = [];

        for (const segment of segments) {
            if (segment.startsWith('$')) {
                const paramName = segment.slice(1);
                params.push(paramName);
                pathSegments.push(segment);
            } else {
                pathSegments.push(segment);
            }
        }

        // Generate method name
        const methodName = generateMethodName(pathSegments, params);

        return {
            path: routePath,
            methodName,
            params
        };
    }

    function generateMethodName(pathSegments: string[], params: string[]): string {
        let methodName = '';

        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];

            if (segment.startsWith('$')) {
                // For parameters, use "By" + parameter name
                const paramName = segment.slice(1);
                methodName += 'By' + capitalize(paramName);
            } else {
                // For normal segments, capitalize them
                methodName += capitalize(segment);
            }
        }

        return methodName || 'root';
    }

    function capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function generateTypeScriptCode(routes: RouteInfo[], className: string): string {
        const methods = routes.map(route => {
            const { methodName, path, params } = route;

            if (params.length === 0) {
                // Simple method without parameters
                return `  /**
   * Returns the path: ${path}
   */
  static ${methodName}(): string {
    return '${path}';
  }`;
            } else {
                // Method with parameters
                const paramList = params.map(param => `${param}: string | number`).join(', ');
                const pathWithParams = path.replace(/\$(\w+)/g, '${$1}');

                return `  /**
   * Returns the path: ${path}
   */
  static ${methodName}(${paramList}): string {
    return \`${pathWithParams}\`;
  }`;
            }
        });

        return `/**
 * Auto-generated class for route paths
 * Do not modify manually - this file is automatically regenerated
 */
export class ${className} {
${methods.join('\n\n')}
}

/**
 * Default instance of the ${className} class
 */
export const routePaths = ${className};
`;
    }
}

/**
 * Default export for easier usage
 */
export default routePathsPlugin;