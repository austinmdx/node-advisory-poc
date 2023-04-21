import { useRouter } from 'next/router'
import Header from '@/components/header'
import { Text, Box, Card, CardHeader, CardBody, Tag, TableContainer, Table, TableCaption, Thead, Tbody, Tfoot, Tr, Th, Td, Link } from '@chakra-ui/react'
import { supabaseServer } from '@/supabaseServer'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import ChakraUIRenderer from 'chakra-ui-markdown-renderer';
import Head from 'next/head'

const chakraMDRendererTheme = {
  p: (props: any) => {
    const { children } = props;
    return (
      <Text mb={2} fontSize={'16px'}>
        {children}
      </Text>
    );
  },
};

const Package = ({ item }: { item: any }) => {
  const router = useRouter()
  const [clientSide, setClientSide] = useState(false);

  const currentVersion = item && item.versions && item.versions.length > 0 ? item.versions[0] : null;

  useEffect(() => {
    setClientSide(true);
  }, []);

  const currentDependencies = currentVersion && currentVersion.dependencies ? currentVersion.dependencies.filter((d: any) => !d.is_dev) : [];
  const currentDevDependencies = currentVersion && currentVersion.dependencies ? currentVersion.dependencies.filter((d: any) => d.is_dev) : [];

  function onSearchSubmit(query: string) {
    router.push(`/package/${query}`, undefined, { shallow: false });
  }

  useEffect(() => {
    console.log('ITEM ', item);
  }, [item]);

  return <>
    <Head>
      <title>{item.name}</title>
      <meta name="description" content={item.name + ' NPM package advisory'} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <main className="App">
      <Header onSearchSubmit={onSearchSubmit} />

      <Box px="32px">
        <Text fontSize='5xl' mb="5" fontWeight="bold">{item?.name} <Text fontSize="lg" display="inline" as="span">v{currentVersion?.version}</Text></Text>
        <Text fontSize='1xl' mb="5">{currentVersion?.description}</Text>
        <Text fontSize='1xl' mb="5">
          Last updated on: {clientSide && currentVersion && (new Date(currentVersion.release_date)).toLocaleDateString()}
          {currentVersion?.license && <>&nbsp;|&nbsp;License: {currentVersion.license}</>}
          &nbsp;|&nbsp;<Link color="primary.500" href={`https://www.npmjs.com/package/${item.name}`} target="_blank" rel="noreferrer">View on NPM</Link>
        </Text>

        <Box border="1px solid" borderColor="primary.500" p="2" mb="4">
          <Text fontSize='1xl'> &gt; npm install {item?.name}</Text>
        </Box>

        <TableContainer>
          <Table variant='striped' colorScheme='teal'>
            <TableCaption>This information is updated daily</TableCaption>
            <Thead>
              <Tr>
                <Th>Version</Th>
                <Th>Release Date</Th>
                <Th>Vulnerabilities</Th>
              </Tr>
            </Thead>
            <Tbody>
              {item?.versions?.map((version: any) => {
                return <Tr key={version.id}>
                  <Td>{version.version}</Td>
                  <Td>{clientSide && (new Date(version.release_date)).toLocaleDateString()}</Td>
                  <Td isNumeric>{version.audit_infos.length}</Td>
                </Tr>
              })}
            </Tbody>
          </Table>
        </TableContainer>

        <Card mb="4">
          <CardHeader><Text fontSize='4xl' fontWeight="bold">Readme</Text></CardHeader>
          <CardBody>
            {
              currentVersion?.readmes.length > 0 && <ReactMarkdown
                components={ChakraUIRenderer(chakraMDRendererTheme)}
                skipHtml
              >{currentVersion.readmes[0].content}</ReactMarkdown>

            }
          </CardBody>
        </Card>

        <Box display={['block', 'block', 'flex']} gap="4">
          <Card mb="4" flex="1">
            <CardHeader><Text fontSize='4xl' fontWeight="bold">Dependencies</Text></CardHeader>
            <CardBody>
              {
                currentDependencies.map((dependency: any) => {
                  return <Tag colorScheme="primary" mr="2" mb="5" key={dependency.id}>{dependency.name}</Tag>
                })
              }

            </CardBody>
          </Card>

          <Card mb="4" flex="1">
            <CardHeader><Text fontSize='4xl' fontWeight="bold">DevDependencies</Text></CardHeader>
            <CardBody>
              {
                currentDevDependencies.map((dependency: any) => {
                  return <Tag colorScheme="primary" mr="2" mb="5" key={dependency.id}>{dependency.name}</Tag>
                })
              }

            </CardBody>
          </Card>
        </Box>
      </Box>
    </main>
  </>
}

export async function getStaticProps({ params: { name } }: { params: { name: string } }) {
  const curatedName = Array.isArray(name) ? name.join('/') : name;
  const pkg = await fetchPackageData(curatedName);

  return {
    props: {
      item: pkg,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 60 seconds
    revalidate: 60, // In seconds
  }
}

export async function getStaticPaths() {

  const packages = await fetchPackageNames();

  // Get the paths we want to pre-render based on packages
  const paths = packages.map((pkg: any) => ({
    params: { name: pkg },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: 'blocking' } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}

async function fetchPackageNames(): Promise<string[]> {
  const { data, error } = await supabaseServer
    .from('packages')
    .select('name')
    .limit(500);

  if (error) {
    console.error('Error fetching package names:', error);
    return [];
  }

  return data.map((packageObj) => packageObj.name);
}

async function _fetchPackages(name: string) {
  let { data, error } = await supabaseServer
    .from('packages')
    .select('*, versions(*, dependencies(*), keywords(*), audit_infos(*), readmes(*))')
    .eq('name', name)
    .order('release_date', {
      foreignTable: 'versions',
      ascending: false,
    })
    .single();

  return { data, error };
}

async function fetchPackageData(name: string): Promise<any> {

  let { data, error } = await _fetchPackages(name);

  if (!data) {

    // Fetch package data from NPM Registry API if not found in Supabase
    const npmRegistryUrl = `https://registry.npmjs.org/${name}`;
    const response = await axios.get(npmRegistryUrl);
    const packageInfo = response.data;

    // Extract the required data

    let versions: any[] = [];
    Object.keys(packageInfo.versions).forEach((version) => {
      versions.push(packageInfo.versions[version]);
    })

    const latestVersion = packageInfo['dist-tags'].latest;
    const readme = packageInfo.readme;

    // Insert package data into Supabase
    const { error: insertError, data: pkgData } = await supabaseServer
      .from('packages')
      .insert([{ name, time_created: packageInfo.time.created, time_modified: packageInfo.time.modified }])
      .select();

    if (insertError || !pkgData || pkgData.length === 0) {
      console.error('Error inserting package data:', insertError);
      throw ('Error inserting package data');
    }
    const pkgId = (pkgData[0] as any).id;

    let versionsToInsert: any[] = [];
    await Promise.all(versions.map(async (version) => {
      const versionToInsert = {
        package_id: pkgId,
        version: version.version,
        description: version.description || null,
        license: version.license || null,
        release_date: packageInfo.time[version.version],
      };
      versionsToInsert.push(versionToInsert);

    }));

    let { error: versionsInsertionError, data: insertedVersionsData } = await supabaseServer
      .from('versions')
      .insert(versionsToInsert)
      .select();

    if (versionsInsertionError || !insertedVersionsData || insertedVersionsData.length === 0) {
      console.error('Error inserting version data:', versionsInsertionError);
      throw (versionsInsertionError);
    }

    //console.log('Inserted versions:', insertedVersionsData);
    const dependenciesToInsert: any[] = [];
    const keywordsToInsert: any[] = [];

    await Promise.all(versions.map(async (version: any) => {

      let versionId: number | undefined;
      try {
        versionId = (insertedVersionsData!.find((versionData: any) => versionData.version === version.version) as any).id;
        console.log
      } catch (e) {
        return;
      }

      if (version.version === latestVersion) {
        const { error: readmeInsertError } = await supabaseServer
          .from('readmes')
          .insert([{ version_id: versionId, content: readme }]);
        if (readmeInsertError) {
          console.error('Error inserting readme:', readmeInsertError);
          throw (readmeInsertError);
        }
      }

      if (version.dependencies) {
        Object.entries(version.dependencies).forEach((entry) => {
          dependenciesToInsert.push({ version_id: versionId, name: entry[0], version_range: entry[1], is_dev: false });
        });
      }

      if (version.devDependencies) {
        Object.entries(version.devDependencies).forEach((entry) => {
          dependenciesToInsert.push({ version_id: versionId, name: entry[0], version_range: entry[1], is_dev: true });
        });
      }

      if (version.keywords) {
        version.keywords.forEach((keyword: any) => {
          keywordsToInsert.push({ version_id: versionId, value: keyword });
        });
      }
    }));

    if (dependenciesToInsert && dependenciesToInsert.length > 0) {
      const { error: depError } = await supabaseServer
        .from('dependencies')
        .insert(dependenciesToInsert);
      if (depError) {
        console.error('Error inserting dependencies:', depError);
      }
    }

    if (keywordsToInsert && keywordsToInsert.length > 0) {
      const { error: keywordError } = await supabaseServer
          .from('keywords')
          .insert(keywordsToInsert);
        if (keywordError) {
          console.error('Error inserting keywords:', keywordError);
        }
    }

    ({ data: data } = await _fetchPackages(name));
  }

  return data;
}

export default Package