# Environment Variable Prefixing

Environment variables on Azion are shared across your whole account, not scoped to a single project. That means two projects can accidentally use the same variable name (e.g. `AUTH_SECRET`) with different values, and a project can technically see variables that belong to another one.

Environment variable prefixing lets each project store its values under a unique name in the Azion console, while your application code keeps reading the plain variable name it already expects — no code changes required.

## Enabling it

Pass `--alias-env` when building your project:

```bash
azbundler build --alias-env
```

Without this flag, the bundler behaves exactly as before — this feature is opt-in.

## How the prefix is chosen

1. If the `AZ_BUNDLER_ENV_ALIAS_PREFIX` environment variable is set at build time, it's used as-is.
2. Otherwise, the prefix is derived automatically from your application's name in `azion.config` (uppercased, non-alphanumeric characters replaced with `_`). For example, an application named `My Cool App` gets the prefix `MY_COOL_APP_`.

## Setting up your variables

1. Build your project once with `--alias-env` and check the generated `.edge/.env.azion` file — it lists every variable from your local `.env`, already prefixed:

   ```
   # .env
   AUTH_SECRET=abc123

   # .edge/.env.azion
   MY_COOL_APP_AUTH_SECRET=abc123
   ```

2. In the Azion console, create each variable listed in `.edge/.env.azion` (with the prefixed name) and set it to the real value for that variable in your deployment.
3. Deploy. Your application code keeps using `AUTH_SECRET` (or whatever name it expects) — the bundler takes care of reading the right, prefixed value at that name.

Make sure the prefixed variables exist in the console **before** deploying a build made with `--alias-env`. If a prefixed variable isn't set yet, your app will see that variable as unset, even if the plain-named version exists.

## Local development

`bundler dev` is unaffected — it keeps reading your local `.env` file with the plain variable names, so nothing changes in your local workflow.

## Known limitation

The prefixing happens at build time, by rewriting direct references like `process.env.AUTH_SECRET` in your compiled code. This covers variables your own application code reads directly. Some third-party libraries read `process.env` indirectly (for example, by capturing it into an internal variable first), and those reads aren't rewritten — check with your library's documentation if you're unsure how it resolves environment variables.
