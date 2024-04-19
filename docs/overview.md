# Overview

## Build Pipeline

```mermaid
flowchart LR

A[Trigger] -->|args| B(Dispatcher)
B --> C(Prebuild)
C -->|args| D(Common Build)
D --> E(Postbuild)
E --> F[Artifacts]
```

### Trigger

An external call to run a build.

### Dispatcher

- Receive build options(args);
- Select which build process to run;
- Load necessary template files and import correct modules (prebuild and configs);

### Prebuild

Custom prebuild module that runs actions to generate entrypoint and necessary files.

The user is free to run any action in this step. All actions must be called in a `exported default` function.

### Common Build

Module that runs azion common build.

Polyfills can be used to generate the worker(s) file(s).

Some configs can be passed to the builder but if user tries to override `azion worker configs` this passed configs will be ignored.

### Post Build

Optional step to run post build actions after common build (bundlers action).

### Artifacts

The **'.edge'** folder will be generated representing the edge locally. Files generated to run on the infrastructure:

- JS worker(s) => '.edge/workers.js';
- Assets => '.edge/storage/\*';
- Environment variables => '.edge/.env'.

The **'.vulcan'** file also will be generated. This file contains build infos that can be used by local env or other tools.
