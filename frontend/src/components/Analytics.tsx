import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Flex,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { ANALYTICS_SUMMARY_QUERY } from '../graphql/analytics';

// Color palette for charts
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300',
  '#00C49F', '#FFBB28', '#FF8042', '#0088FE',
  '#00C49F', '#FFBB28', '#FF8042', '#8884d8'
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const Analytics: React.FC = () => {
  const [dayRange, setDayRange] = useState(30);
  
  const { data, loading, error, refetch } = useQuery(ANALYTICS_SUMMARY_QUERY, {
    variables: { days: dayRange },
    pollInterval: 60000, // Refresh every minute
  });

  const handleRangeChange = (newRange: number) => {
    setDayRange(newRange);
    refetch({ days: newRange });
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="purple.500" />
        <Text mt={4} color="gray.400">Loading analytics...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading analytics: {error.message}
      </Alert>
    );
  }

  const analytics = data?.analyticsSummary;
  if (!analytics) return null;

  // Prepare chart data
  const uploadTrendData = analytics.uploadTrends?.map((trend: any) => ({
    ...trend,
    date: formatDate(trend.date),
    sizeInMB: (trend.size / (1024 * 1024)).toFixed(2),
  })) || [];

  const fileTypeData = analytics.fileTypeStats?.map((stat: any, index: number) => ({
    ...stat,
    name: stat.mimeType.split('/')[1]?.toUpperCase() || stat.mimeType.toUpperCase(),
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <VStack spacing={6} align="stretch">
      {/* Header with time range selector */}
      <Flex justify="space-between" align="center">
        <Text fontSize="2xl" fontWeight="bold" color="white">
          📊 Analytics Dashboard
        </Text>
        <Select
          value={dayRange}
          onChange={(e) => handleRangeChange(Number(e.target.value))}
          width="200px"
          bg="gray.700"
          color="white"
          borderColor="gray.600"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </Select>
      </Flex>

      {/* Key Metrics Cards */}
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.300">Total Storage</StatLabel>
                <StatNumber color="white">
                  {formatBytes(analytics.storageStats?.totalStorage || 0)}
                </StatNumber>
                <StatHelpText color="green.300">
                  <StatArrow type="increase" />
                  {(analytics.storageStats?.savingsPercentage || 0).toFixed(1)}% savings
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.300">Total Shares</StatLabel>
                <StatNumber color="white">
                  {analytics.sharingStats?.totalShares || 0}
                </StatNumber>
                <StatHelpText color="blue.300">
                  {analytics.sharingStats?.userShares || 0} user shares
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.300">Public Files</StatLabel>
                <StatNumber color="white">
                  {analytics.sharingStats?.publicFiles || 0}
                </StatNumber>
                <StatHelpText color="purple.300">
                  {analytics.sharingStats?.publicFolders || 0} public folders
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.300">Active Users</StatLabel>
                <StatNumber color="white">
                  {analytics.userActivity?.length || 0}
                </StatNumber>
                <StatHelpText color="yellow.300">
                  Total registered
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts Row */}
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        {/* Upload Trends Chart */}
        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold" color="white">
                📈 Upload Trends ({dayRange} days)
              </Text>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uploadTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </GridItem>

        {/* File Types Distribution */}
        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold" color="white">
                📁 File Types Distribution
              </Text>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fileTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {fileTypeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* User Activity Table */}
      <Card bg="gray.800" borderColor="gray.600">
        <CardHeader>
          <Text fontSize="lg" fontWeight="semibold" color="white">
            👥 User Activity Overview
          </Text>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color="gray.300">User</Th>
                <Th color="gray.300">Files</Th>
                <Th color="gray.300">Storage Used</Th>
                <Th color="gray.300">Shares</Th>
                <Th color="gray.300">Last Activity</Th>
              </Tr>
            </Thead>
            <Tbody>
              {analytics.userActivity?.slice(0, 10).map((user: any) => (
                <Tr key={user.userId}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text color="white" fontWeight="medium">{user.userName}</Text>
                      <Text color="gray.400" fontSize="sm">{user.userEmail}</Text>
                    </VStack>
                  </Td>
                  <Td color="white">{user.fileCount}</Td>
                  <Td color="white">{formatBytes(user.totalSize)}</Td>
                  <Td>
                    <Badge colorScheme="purple" variant="subtle">
                      {user.sharingCount}
                    </Badge>
                  </Td>
                  <Td color="gray.400" fontSize="sm">
                    {user.lastActivity ? 
                      new Date(user.lastActivity).toLocaleDateString() : 
                      'Never'
                    }
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Most Shared Content */}
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold" color="white">
                🔥 Most Shared Files
              </Text>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {analytics.sharingStats?.mostSharedFiles?.slice(0, 5).map((file: any, index: number) => (
                  <HStack key={file.id} justify="space-between" p={3} bg="gray.700" borderRadius="md">
                    <VStack align="start" spacing={0}>
                      <Text color="white" fontWeight="medium" noOfLines={1}>
                        {file.name}
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        {formatBytes(file.size)} • {file.downloadCount} downloads
                      </Text>
                    </VStack>
                    <Badge colorScheme="blue">#{index + 1}</Badge>
                  </HStack>
                )) || <Text color="gray.400">No shared files yet</Text>}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg="gray.800" borderColor="gray.600">
            <CardHeader>
              <Text fontSize="lg" fontWeight="semibold" color="white">
                📂 Most Shared Folders
              </Text>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {analytics.sharingStats?.mostSharedFolders?.slice(0, 5).map((folder: any, index: number) => (
                  <HStack key={folder.id} justify="space-between" p={3} bg="gray.700" borderRadius="md">
                    <VStack align="start" spacing={0}>
                      <Text color="white" fontWeight="medium" noOfLines={1}>
                        📁 {folder.name}
                      </Text>
                    </VStack>
                    <Badge colorScheme="green">#{index + 1}</Badge>
                  </HStack>
                )) || <Text color="gray.400">No shared folders yet</Text>}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default Analytics;