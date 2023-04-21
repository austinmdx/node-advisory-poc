import Head from 'next/head'
import { Text, UnorderedList, ListItem, Link, Box, Divider } from '@chakra-ui/react'
import Header from '@/components/header'
import { supabaseServer } from '@/supabaseServer'
import { useState } from 'react'
import { useRouter } from "next/router"

const structData = {
  '@context': 'https://schema.org',
  '@type': 'Advisory',
  headline: 'Advisory for NodeJS packages',
  description: 'Discover the perfect open-source NPM package for your project with NodeJS Advisory. Browse and compare over a million NPM packages to find the best fit for your needs.',
  author: [
    {
      '@type': 'Organization',
      name: 'Hillcroft',
    },
  ],
  datePublished: '2023-04-20T09:00:00.000Z',
};

export default function Home({ packages }: { packages: any[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('');

  function onSearchSubmit(query: string) {
    router.push(`/package/${query}`, undefined, { shallow: false });
  }

  const filteredPackages = searchQuery.length > 2 ? packages.filter((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : packages;

  return (
    <>
      <Head>
        <title>NodeJS Advisory</title>
        <meta name="description" content="Advisory app for node packages" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script
          key="structured-1"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structData) }}
        />
      </Head>
      <main className="App">
        <Header onSearchChange={setSearchQuery} onSearchSubmit={onSearchSubmit}></Header>

        <Box px="32px">
          <Text fontSize='5xl' fontWeight="bold" mb="5">Popular Packages</Text>

          <Divider mb="4" />

          <UnorderedList display="flex" flexWrap="wrap">
            {filteredPackages.map((item: any) => {
              return <ListItem key={item.id} listStyleType="none" width={['100%', '100%', '50%', '33%']} mb="5">
                <Link href={`/package/${item.name}`} color="primary.500">{item.name}</Link>
              </ListItem>
            })}
          </UnorderedList>
        </Box>
      </main>
    </>
  )
}

export async function getServerSideProps() {
  let { data: packages, error } = await supabaseServer
    .from('packages')
    .select('*')
    .order('name')
    .limit(50)

  if (error) {
    console.error(error);
    return {
      props: { packages: [] },
    };
  }

  return {
    props: { packages },
  };
}
