import { useRouter } from 'next/router'
import Header from '@/components/header'
import { Text, Box, Card, CardHeader, CardBody, Tag, TableContainer, Table, TableCaption, Thead, Tbody, Tfoot, Tr, Th, Td } from '@chakra-ui/react'

const Package = () => {
  const router = useRouter()
  const { name } = router.query

  return <>
    <Header />

    <Box px="32px">
      <Text fontSize='4xl'>{name} <Text fontSize="lg" display="inline" as="span">v1.0.0</Text></Text>
      <Text fontSize='1xl' mb="5">An Express project generator with command-line interface that is easy to use For more information about how to use this package see</Text>

      <Box border="1px solid" borderColor="primary.500" p="2" mb="4">
        <Text fontSize='1xl'>npm install express-generate</Text>
      </Box>

      <TableContainer>
        <Table variant='striped' colorScheme='teal'>
          <TableCaption>Imperial to metric conversion factors</TableCaption>
          <Thead>
            <Tr>
              <Th>Version</Th>
              <Th>Release Date</Th>
              <Th>Vulnerabilities</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>1.0.3</Td>
              <Td>01/14/23</Td>
              <Td isNumeric>0</Td>
            </Tr>
            <Tr>
              <Td>1.0.2</Td>
              <Td>12/20/21</Td>
              <Td isNumeric>3</Td>
            </Tr>
            <Tr>
              <Td>1.0.0</Td>
              <Td>10/23/21</Td>
              <Td isNumeric>3</Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>

      <Card mb="4">
        <CardHeader>Readme</CardHeader>
        <CardBody>
          Readme content here
        </CardBody>
      </Card>

      <Card mb="4">
        <CardHeader>Dependencies</CardHeader>
        <CardBody>
          <Tag colorScheme="primary" mr="2">React</Tag>
          <Tag colorScheme="primary" mr="2">Angular</Tag>
          <Tag colorScheme="primary" mr="2">Docker</Tag>
        </CardBody>
      </Card>
    </Box>


  </>
}

export default Package