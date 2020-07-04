# react-new

lets you interactively create react app

<img src="gif/demo.gif" width="560">

## Usage

This app is intended to be used with `npx` without installing with npm install.

```
 npx github:shibayaman/react-new my-app
```

Command above will create a new react project named `my-app` in the current directory.

Currently, you can select optional tools from

- ESlint
- Prettier
- Typescript

(thinking of adding Jest in the list whenever I have time...)

### Dev Server

After the project is created, you can start dev server with

```
npm run dev
```

### Build

When you are ready to deploy your app, you can build the app with

```
npm run build
```

This will create a `buid` directory on the root of the app which contains a base html and the production-ready bundle file.

## Caution

As of now, pressing Ctrl + c while the app is creating the project will not delete the project directory and files inside. You have to manually delete the directory in that case.
