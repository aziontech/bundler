# Hugo Quickstart

First, an Hugo theme is necessary.
```
git init
git submodule add -f https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke
```

Than you can forge it.
```
vulcan build --preset hugo --mode deliver
```

And run it locally
```
vulcan dev
```