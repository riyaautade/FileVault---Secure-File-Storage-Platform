import React from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  Progress,
  useColorMode,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { STORAGE_STATS_QUERY, FILES_QUERY, ME_QUERY } from '../graphql/queries';
import { useAuth } from '../utils/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { colorMode } = useColorMode();
  
  const { data: statsData, loading: statsLoading } = useQuery(STORAGE_STATS_QUERY, {
    pollInterval: 10000, // Poll every 10 seconds
    errorPolicy: 'all'
  });
  const { data: filesData, loading: filesLoading } = useQuery(FILES_QUERY, {
    variables: { first: 10 },
    pollInterval: 15000, // Poll every 15 seconds
    errorPolicy: 'all'
  });
  
  // Also poll for user data updates (storage used/quota)
  const { data: userData } = useQuery(ME_QUERY, {
    pollInterval: 12000, // Poll every 12 seconds
    errorPolicy: 'all'
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Use polled user data for more up-to-date storage info
  const currentUser = userData?.me || user;
  const storageUsedPercentage = currentUser ? (currentUser.storageUsed / currentUser.storageQuota) * 100 : 0;

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Welcome back, {currentUser?.name}! 👋
          </Heading>
          <Text color="gray.500">
            Here's an overview of your file vault activity
          </Text>
        </Box>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Files</StatLabel>
                  <StatNumber color="brand.500">
                    {filesLoading ? '...' : filesData?.files?.length || 0}
                  </StatNumber>
                  <StatHelpText>Files uploaded</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Storage Used</StatLabel>
                  <StatNumber color="orange.500">
                    {currentUser ? formatBytes(currentUser.storageUsed) : '0 Bytes'}
                  </StatNumber>
                  <StatHelpText>
                    of {currentUser ? formatBytes(currentUser.storageQuota) : '0 Bytes'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Deduplication Savings</StatLabel>
                  <StatNumber color="green.500">
                    {statsLoading ? '...' : 
                     statsData?.storageStats ? 
                     formatBytes(statsData.storageStats.savedStorage) : '0 Bytes'
                    }
                  </StatNumber>
                  <StatHelpText>
                    {statsData?.storageStats ? 
                     `${statsData.storageStats.savingsPercentage.toFixed(1)}% saved` : '0% saved'
                    }
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Storage Usage</StatLabel>
                  <StatNumber fontSize="lg">
                    {storageUsedPercentage.toFixed(1)}%
                  </StatNumber>
                  <Progress 
                    value={storageUsedPercentage} 
                    colorScheme={storageUsedPercentage > 80 ? 'red' : 'brand'}
                    size="sm"
                    mt={2}
                  />
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          <GridItem>
            <Card>
              <CardHeader>
                <Heading size="md">Recent Files</Heading>
              </CardHeader>
              <CardBody>
                {filesLoading ? (
                  <Text>Loading...</Text>
                ) : filesData?.files?.length ? (
                  <VStack spacing={3} align="stretch">
                    {filesData.files.slice(0, 5).map((file: any) => (
                      <HStack 
                        key={file.id}
                        justify="space-between"
                        p={3}
                        borderRadius="md"
                        bg={colorMode === 'dark' ? 'dark.border' : 'gray.50'}
                      >
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium" fontSize="sm">
                            {file.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                          </Text>
                        </VStack>
                        <Text fontSize="xs" color="gray.400">
                          {file.downloadCount} downloads
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">No files uploaded yet</Text>
                )}
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardHeader>
                <Heading size="md">Storage Breakdown</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="sm">Original Storage</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {statsData?.storageStats ? 
                         formatBytes(statsData.storageStats.originalStorage) : '0 Bytes'
                        }
                      </Text>
                    </HStack>
                    <Progress 
                      value={100} 
                      colorScheme="gray" 
                      size="sm" 
                    />
                  </Box>
                  
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="sm">After Deduplication</Text>
                      <Text fontSize="sm" fontWeight="medium" color="green.500">
                        {statsData?.storageStats ? 
                         formatBytes(statsData.storageStats.totalStorage) : '0 Bytes'
                        }
                      </Text>
                    </HStack>
                    <Progress 
                      value={statsData?.storageStats ? 
                             (statsData.storageStats.totalStorage / statsData.storageStats.originalStorage) * 100 : 0
                            } 
                      colorScheme="green" 
                      size="sm" 
                    />
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        <Card>
          <CardHeader>
            <Heading size="md">Quick Actions</Heading>
          </CardHeader>
          <CardBody>
            <Text color="gray.500">
              Upload files, create folders, and manage your storage from the Files page.
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default DashboardPage;