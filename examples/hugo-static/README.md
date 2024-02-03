# Hugo Quickstart

First, an Hugo theme is necessary.
```
git clone https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke
```

Remember to install Vulcan for Development locally.  

Than you can install and forge the exemple.
```
npm install

vulcan build --preset hugo --mode deliver
```

Run it locally.
```
vulcan dev
```

Check it out on http://localhost:3000/.