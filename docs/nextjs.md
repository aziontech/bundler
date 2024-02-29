# Nextjs Support

Vulcan supports Nextjs in compute and deliver modes.

## Deliver

Static site delivered by edge without a function.
Check static examples in [Nextjs examples dir](/examples//next/) for more details.

### References

- [Pages Router - Static Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [App Router - Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

## Compute

In compute mode the nextjs handler uses a routing system (based on vercel multiple steps routing) to handle the request.

After a route match in the routing system takes one of these actions:

- deliver a static;
- make a request override;
- call a builded edge module;
- call a node custom server;

This solution was created based on fastly ([next-compute-js v1](https://github.com/fastly/next-compute-js)) and cloudflare ([next-on-pages](https://github.com/cloudflare/next-on-pages)) Nextjs solutions.

Check edge or node examples in [Nextjs examples dir](/examples//next/) for more details.

### Supported Features

| Runtime | Versions                                       | Format/Router | Feature                                                                                                                                          |
| ------- | ---------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Edge    | 12.2.x, 12.3.x                                 | Pages Router  | Static Pages                                                                                                                                     |
|         |                                                |               | SSR                                                                                                                                              |
|         |                                                |               | SSG                                                                                                                                              |
|         |                                                |               | Edge API Routes                                                                                                                                  |
|         |                                                |               | Dynamic Routes                                                                                                                                   |
|         |                                                |               | Middleware (rewrite, redirect, continue to response, set request header, throw error, set response header, set response cookie)                  |
|         |                                                |               | Next configs (rewrite before files, rewrite after files, rewrite fallback, redirects, header definition)                                         |
|         |                                                |               | i18n routing                                                                                                                                     |
| Edge    | 13.0.x, 13.1.x, 13.2.x, 13.3.x, 13.4.x, 13.5.x | Pages Router  | Static Pages                                                                                                                                     |
|         |                                                |               | SSR                                                                                                                                              |
|         |                                                |               | SSG                                                                                                                                              |
|         |                                                |               | Edge API Routes                                                                                                                                  |
|         |                                                |               | Dynamic Routes                                                                                                                                   |
|         |                                                |               | Middleware (rewrite, redirect, continue to response, set request header, throw error, return response, set response header, set response cookie) |
|         |                                                |               | Next configs (rewrite before files, rewrite after files, rewrite fallback, redirects, header definition)                                         |
|         |                                                |               | i18n routing                                                                                                                                     |
|         |                                                |               | Custom Errors                                                                                                                                    |
| Edge    | 13.0.x, 13.1.x, 13.2.x, 13.3.x, 13.4.x, 13.5.x | App Router    | App router (basic structure, routing, layouts)                                                                                                   |
|         |                                                |               | Server Components                                                                                                                                |
|         |                                                |               | Route Handlers                                                                                                                                   |
|         |                                                |               | Dynamic Routes                                                                                                                                   |
|         |                                                |               | Middleware (rewrite, redirect, continue to response, set request header, throw error, return response, set response header, set response cookie) |
|         |                                                |               | Next configs (rewrite before files, rewrite after files, redirects, header definition)                                                           |
|         |                                                |               | Internationalization                                                                                                                             |
|         |                                                |               | Custom Errors (error.js and not-found.js)                                                                                                        |
| Node    | 12.3.x                                         | Pages Router  | Static Pages                                                                                                                                     |
|         |                                                |               | SSR                                                                                                                                              |
|         |                                                |               | SSG                                                                                                                                              |
|         |                                                |               | API Routes                                                                                                                                       |
|         |                                                |               | Dynamic Routes                                                                                                                                   |
|         |                                                |               | Next configs (rewrite before files, rewrite after files, rewrite fallback, redirects, header definition)                                         |
|         |                                                |               | i18n routing                                                                                                                                     |
|         |                                                |               | Custom Errors                                                                                                                                    |
