# Handler Patterns

This documentation explains the different handler patterns supported by Azion Edge Functions and how to migrate between them.

## Supported Patterns

### ES Modules Pattern (Recommended)

The ES Modules pattern is the recommended way to structure your Edge Functions on Azion.

```javascript
export default {
  fetch: (request, env, ctx) => {
    return new Response('Hello World');
  },
  firewall: (request, env, ctx) => {
    // Firewall logic
    ctx.deny();
  }
};
```

**Advantages:**
- Modern and clean syntax
- Native support in production
- Better performance
- Easy to test

### Service Worker Pattern (Legacy)

The Service Worker pattern is maintained for legacy code compatibility.

```javascript
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

addEventListener('firewall', (event) => {
  // Firewall logic
  event.deny(); // Block the request
});

async function handleRequest(request) {
  return new Response('Hello World');
}
```

**Note:** This pattern is considered legacy and we recommend migrating to ES Modules.

## Handler Parameters

### Handler fetch(request, env, ctx)

- **request**: [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) - HTTP request object
- **env**: Object - Environment variables and bindings
- **ctx**: Object - Execution context
  - `ctx.waitUntil(promise)` - Extends the worker's lifetime

### Handler firewall(request, env, ctx)

- **request**: [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) - HTTP request object
- **env**: Object - Environment variables and bindings
- **ctx**: Object - Execution context
  - `ctx.deny()` - Blocks the request immediately (ES Modules pattern only)
  - If `ctx.deny()` is not called, the request continues to the fetch handler

### Service Worker Firewall Event

- **event**: FirewallEvent - Firewall event object
  - `event.deny()` - Blocks the request immediately (Service Worker pattern only)
  - `event.request` - Access to the Request object
  - If `event.deny()` is not called, the request continues to the fetch handler

## Practical Examples

### Basic Example - ES Modules

```javascript
export default {
  fetch: async (request, env, ctx) => {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/hello') {
      return new Response(JSON.stringify({ message: 'Hello World' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

### Example with Firewall

```javascript
export default {
  fetch: async (request, env, ctx) => {
    return new Response('Access granted');
  },
  
  firewall: async (request, env, ctx) => {
    const clientIP = request.headers.get('CF-Connecting-IP');
    
    // Block specific IPs
    if (clientIP === '192.168.1.100') {
      ctx.deny();
      return;
    }
    
    // Continue to fetch handler
    return;
  }
};
```

### Example with Context

```javascript
export default {
  fetch: async (request, env, ctx) => {
    // Use waitUntil for async tasks
    ctx.waitUntil(logRequest(request));
    
    return new Response('Hello World');
  }
};

async function logRequest(request) {
  // Log request asynchronously
  console.log(`Request to: ${request.url}`);
}
```

### Advanced Firewall Example

```javascript
export default {
  fetch: async (request, env, ctx) => {
    return new Response('Access granted');
  },
  
  firewall: async (request, env, ctx) => {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent');
    const clientIP = request.headers.get('CF-Connecting-IP');
    
    // Block bot requests
    if (userAgent && userAgent.includes('bot')) {
      ctx.deny();
      return;
    }
    
    // Block specific paths
    if (url.pathname.startsWith('/admin')) {
      // Allow only from specific IP range
      if (!clientIP || !clientIP.startsWith('192.168.')) {
        ctx.deny();
        return;
      }
    }
    
    // Allow request to continue to fetch handler
    return;
  }
};
```

### Service Worker Firewall Example

```javascript
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

addEventListener('firewall', (event) => {
  const clientIP = event.request.headers.get('CF-Connecting-IP');
  const userAgent = event.request.headers.get('User-Agent');
  
  // Block bot requests
  if (userAgent && userAgent.includes('bot')) {
    event.deny();
    return;
  }
  
  // Block specific IPs
  if (clientIP === '192.168.1.100') {
    event.deny();
    return;
  }
  
  // Allow request to continue to fetch handler
});

async function handleRequest(request) {
  return new Response('Hello World');
}
```

## Migration from Service Worker to ES Modules

### Before (Service Worker)

```javascript
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  return new Response('Hello World');
}
```

### After (ES Modules)

```javascript
export default {
  fetch: async (request, env, ctx) => {
    return new Response('Hello World');
  }
};
```

## Unsupported Patterns

Some common patterns from other platforms are not directly supported:

```javascript
// ❌ Direct function export
export default function(request) {
  return new Response('Hello');
}

// ❌ Named exports
export function fetch(request) {
  return new Response('Hello');
}

// ❌ No export
function handleRequest(request) {
  return new Response('Hello');
}
```

For these cases, use the recommended **ES Modules Pattern**.

## Troubleshooting

### "Unsupported handler pattern detected"

This message appears when your code doesn't follow any of the supported patterns. To resolve:

1. **Migrate to ES Modules** (recommended):
   ```javascript
   export default { fetch };
   ```

2. **Or use Service Worker** (legacy):
   ```javascript
   addEventListener('fetch', (event) => {
     event.respondWith(handleRequest(event.request));
   });
   ```

### ES Modules Issues

If you're having problems with "export" syntax, check:

1. **package.json** contains `"type": "module"`
2. **Or** rename file to `.mjs`
3. **Or** use CommonJS: `module.exports = { fetch }`

## Additional Resources

- [Azion Edge Functions Documentation](https://www.azion.com/en/documentation/products/edge-functions/)
- [Web API Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [Web API Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 