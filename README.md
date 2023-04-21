This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Configure your local env variables (.env.local):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```


First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Functionality

- Leverages NextJS Static generation and Incremental revalidation. This means we create a static file per each package, best for SEO and speed.
- Consists of two pages. The index and the detailed page of a package.
- Strategy for adding new packages is incremental. Each time you naviagate to /package/[package-name] app will try to pull from database or, if it doesn't exist yet, it will fetch the NPM Registry API and store it the db.
- We are storing most of the package metadata
- Basic client side searching

## Pending Items
- Vulnerability analysis for each package / version
- Dedicated version page for a given package
- Strategy to update the packages after creation
- Similar modules, more robust search method
- General hardening / SEO


## How to add a new package to our db?
Currently the way to get new packages is by searching them in the app. Go to the search input in the header and type the exact name of a package ande then submit. You'll be redirected to the proper /package/[package-name] detail page and the fetching process will start.

NextJS will incrementally build static files for each of these packages so navigation in production will be blazing fast.