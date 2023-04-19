import { useRouter } from 'next/router'
import Header from '@/components/header'
import { Text, Box, Card, CardHeader, CardBody, Tag, TableContainer, Table, TableCaption, Thead, Tbody, Tfoot, Tr, Th, Td, Link } from '@chakra-ui/react'
import { supabaseServer } from '@/supabaseServer'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import remarkGfm from 'remark-gfm'
import ChakraUIRenderer from 'chakra-ui-markdown-renderer';

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
  const { name } = router.query
  const [clientSide, setClientSide] = useState(false);

  const currentVersion = item && item.versions && item.versions.length > 0 ? item.versions[0] : null;

  useEffect(() => {
    setClientSide(true);
  }, []);

  console.log('Item ', item);

  const currentDependencies = currentVersion && currentVersion.dependencies ? currentVersion.dependencies.filter((d: any) => !d.is_dev) : [];
  const currentDevDependencies = currentVersion && currentVersion.dependencies ? currentVersion.dependencies.filter((d: any) => d.is_dev) : [];

  return <>
    <Header />

    <Box px="32px">
      <Text fontSize='5xl' mb="5" fontWeight="bold">{item?.name} <Text fontSize="lg" display="inline" as="span">v{currentVersion?.version}</Text></Text>
      <Text fontSize='1xl' mb="5">{currentVersion.description}</Text>
      <Text fontSize='1xl' mb="5">
        Last updated on: {clientSide && (new Date(currentVersion.release_date)).toLocaleDateString()}
        {currentVersion.license && <>&nbsp;|&nbsp;License: {currentVersion.license}</>}
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
            currentVersion.readmes.length > 0 && <ReactMarkdown
              components={ChakraUIRenderer(chakraMDRendererTheme)}
              children={currentVersion.readmes[0].content}
              skipHtml
            />

          }
        </CardBody>
      </Card>

      <Card mb="4">
        <CardHeader><Text fontSize='4xl' fontWeight="bold">Dependencies</Text></CardHeader>
        <CardBody>
          {
            currentDependencies.map((dependency: any) => {
              return <Tag colorScheme="primary" mr="2">{dependency.name}</Tag>
            })
          }

        </CardBody>
      </Card>

      <Card mb="4">
        <CardHeader><Text fontSize='4xl' fontWeight="bold">DevDependencies</Text></CardHeader>
        <CardBody>
          {
            currentDevDependencies.map((dependency: any) => {
              return <Tag colorScheme="primary" mr="2">{dependency.name}</Tag>
            })
          }

        </CardBody>
      </Card>
    </Box>


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

async function fetchPackageData(name: string): Promise<any> {

  let { data, error } = await supabaseServer
    .from('packages')
    .select('*, versions(*, dependencies(*), keywords(*), audit_infos(*), readmes(*))')
    .eq('name', name)
    .order('release_date', {
      foreignTable: 'versions',
      ascending: false,
    })
    .single();

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
    const versionData = packageInfo.versions[latestVersion];
    const description = versionData.description;
    const repository_url = versionData.repository?.url || '';
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

    await Promise.all(versions.map(async (version) => {
      let { error: insertError, data: versionData } = await supabaseServer
        .from('versions')
        .insert([{
          package_id: pkgId,
          version: version.version,
          description: version.description,
          license: version.license,
          release_date: packageInfo.time[version.version],
        }])
        .select();

      if (insertError || !versionData || versionData.length === 0) {
        console.error('Error inserting version data:', insertError);
        throw ('Error inserting version data: ' + insertError);
      }
      let vData = versionData[0];

      if (version.version === latestVersion) {
        const { error: readmesError } = await supabaseServer
          .from('readmes')
          .insert([{ version_id: vData.id, content: readme }]);

        if (readmesError) {
          console.error('Error inserting readme:', readmesError);
        }
      }

      if (version.dependencies) {
        Object.keys(version.dependencies).forEach(async (dependency) => {
          const { error: depError } = await supabaseServer
            .from('dependencies')
            .insert([{ version_id: vData.id, name: dependency, version_range: version.dependencies[dependency], is_dev: false }]);
          if (depError) {
            console.error('Error inserting dependencies:', depError);
          }
        })
      }

      if (version.devDependencies) {
        Object.keys(version.devDependencies).forEach(async (dependency) => {
          const { error: depError } = await supabaseServer
            .from('dependencies')
            .insert([{ version_id: vData.id, name: dependency, version_range: version.devDependencies[dependency], is_dev: true }]);
          if (depError) {
            console.error('Error inserting devDependencies:', depError, version.devDependencies[dependency]);
          }
        })
      }

      if (version.keywords) {
        version.keywords.forEach(async (keyword: string) => {
          const { error: keywordError } = await supabaseServer
            .from('keywords')
            .insert([{ version_id: vData.id, value: keyword }]);
          if (keywordError) {
            console.error('Error inserting keywords:', keywordError);
          }
        })
      }
    }));

    data = { name, description, repository_url };
  }

  return data;
}

export default Package