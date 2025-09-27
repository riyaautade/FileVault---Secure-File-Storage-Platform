import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  Tooltip,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stack,
  Divider,
  Tag,
  TagLabel,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiUser,
  FiFile,
  FiFolder,
  FiShield,
  FiActivity,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiEdit,
  FiEye,
  FiShare,
  FiLock,
  FiUnlock,
  FiAlertTriangle,
  FiInfo,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL Query
const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($resourceId: ID) {
    auditLogs(resourceId: $resourceId) {
      id
      user {
        id
        email
        name
        role
      }
      action
      resourceType
      resourceId
      details
      createdAt
    }
  }
`;

// Types
interface AuditLog {
  id: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  action: string;
  resourceType: string;
  resourceId: string;
  details?: string;
  createdAt: string;
}

interface AuditDetails {
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  error_message?: string;
  duration?: string;
  file_size?: number;
  file_mime_type?: string;
  shared_with_id?: string;
  parent_id?: string;
  success: boolean;
  timestamp: string;
}

// Action type mappings
const ACTION_TYPES = {
  // User actions
  USER_LOGIN: { label: 'Login', icon: FiUser, color: 'green' },
  USER_LOGOUT: { label: 'Logout', icon: FiUser, color: 'gray' },
  USER_REGISTER: { label: 'Registration', icon: FiUser, color: 'blue' },
  USER_UPDATE: { label: 'Profile Update', icon: FiEdit, color: 'yellow' },
  USER_DELETE: { label: 'Account Deletion', icon: FiTrash2, color: 'red' },

  // File actions
  FILE_UPLOAD: { label: 'File Upload', icon: FiUpload, color: 'green' },
  FILE_DOWNLOAD: { label: 'File Download', icon: FiDownload, color: 'blue' },
  FILE_DELETE: { label: 'File Deletion', icon: FiTrash2, color: 'red' },
  FILE_UPDATE: { label: 'File Update', icon: FiEdit, color: 'yellow' },
  FILE_SHARE: { label: 'File Shared', icon: FiShare, color: 'purple' },
  FILE_UNSHARE: { label: 'File Unshared', icon: FiLock, color: 'orange' },
  FILE_MOVE: { label: 'File Moved', icon: FiFolder, color: 'teal' },
  FILE_COPY: { label: 'File Copied', icon: FiFile, color: 'cyan' },
  FILE_VIEW: { label: 'File Viewed', icon: FiEye, color: 'gray' },
  FILE_PREVIEW: { label: 'File Previewed', icon: FiEye, color: 'gray' },

  // Folder actions
  FOLDER_CREATE: { label: 'Folder Created', icon: FiFolder, color: 'green' },
  FOLDER_DELETE: { label: 'Folder Deleted', icon: FiTrash2, color: 'red' },
  FOLDER_UPDATE: { label: 'Folder Updated', icon: FiEdit, color: 'yellow' },
  FOLDER_SHARE: { label: 'Folder Shared', icon: FiShare, color: 'purple' },
  FOLDER_UNSHARE: { label: 'Folder Unshared', icon: FiLock, color: 'orange' },
  FOLDER_MOVE: { label: 'Folder Moved', icon: FiFolder, color: 'teal' },
  FOLDER_VIEW: { label: 'Folder Viewed', icon: FiEye, color: 'gray' },

  // Permission actions
  PERMISSION_GRANT: { label: 'Permission Granted', icon: FiUnlock, color: 'green' },
  PERMISSION_REVOKE: { label: 'Permission Revoked', icon: FiLock, color: 'red' },
  ROLE_CHANGE: { label: 'Role Changed', icon: FiShield, color: 'yellow' },

  // Security actions
  SECURITY_FAILED_LOGIN: { label: 'Failed Login', icon: FiXCircle, color: 'red' },
  SECURITY_PASSWORD_RESET: { label: 'Password Reset', icon: FiShield, color: 'yellow' },
  SECURITY_SUSPICIOUS_ACTIVITY: { label: 'Suspicious Activity', icon: FiAlertTriangle, color: 'red' },

  // System actions
  SYSTEM_STARTUP: { label: 'System Startup', icon: FiCheckCircle, color: 'green' },
  SYSTEM_SHUTDOWN: { label: 'System Shutdown', icon: FiXCircle, color: 'orange' },
  SYSTEM_ERROR: { label: 'System Error', icon: FiXCircle, color: 'red' },
  SYSTEM_WARNING: { label: 'System Warning', icon: FiAlertTriangle, color: 'yellow' },
};

// Resource type mappings
const RESOURCE_TYPES = {
  USER: { label: 'User', icon: FiUser, color: 'blue' },
  FILE: { label: 'File', icon: FiFile, color: 'green' },
  FOLDER: { label: 'Folder', icon: FiFolder, color: 'yellow' },
  SYSTEM: { label: 'System', icon: FiActivity, color: 'purple' },
  AUTH: { label: 'Authentication', icon: FiShield, color: 'red' },
};

interface AuditLogsSystemProps {
  resourceId?: string;
  maxHeight?: string;
}

export const AuditLogsSystem: React.FC<AuditLogsSystemProps> = ({
  resourceId,
  maxHeight = '600px'
}) => {
  const { data, loading, error, refetch } = useQuery(GET_AUDIT_LOGS, {
    variables: { resourceId },
    pollInterval: 30000, // Poll every 30 seconds
  });

  // State for filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal for detailed view
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const lightCardBg = useColorModeValue('gray.50', 'gray.700');
  const codeBg = useColorModeValue('gray.100', 'gray.600');
  const errorBg = useColorModeValue('red.50', 'red.900');
  const successBg = useColorModeValue('green.50', 'green.900');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (!data?.auditLogs) return [];

    return data.auditLogs.filter((log: AuditLog) => {
      // Action filter
      if (actionFilter && !log.action.includes(actionFilter)) return false;

      // Resource filter
      if (resourceFilter && log.resourceType !== resourceFilter) return false;

      // User filter
      if (userFilter && (!log.user || !log.user.email.toLowerCase().includes(userFilter.toLowerCase()))) return false;

      // Date filter
      if (dateFilter) {
        const logDate = new Date(log.createdAt);
        const filterDate = new Date(dateFilter);
        if (logDate.toDateString() !== filterDate.toDateString()) return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          log.action,
          log.resourceType,
          log.user?.email || '',
          log.user?.name || '',
          log.details || ''
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      return true;
    });
  }, [data?.auditLogs, actionFilter, resourceFilter, userFilter, dateFilter, searchQuery]);

  // Parse details JSON safely
  const parseDetails = (detailsStr?: string): AuditDetails | null => {
    if (!detailsStr) return null;
    try {
      return JSON.parse(detailsStr);
    } catch {
      return null;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get action info
  const getActionInfo = (action: string) => {
    return ACTION_TYPES[action as keyof typeof ACTION_TYPES] || {
      label: action,
      icon: FiActivity,
      color: 'gray'
    };
  };

  // Get resource info
  const getResourceInfo = (resourceType: string) => {
    return RESOURCE_TYPES[resourceType as keyof typeof RESOURCE_TYPES] || {
      label: resourceType,
      icon: FiActivity,
      color: 'gray'
    };
  };

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error loading audit logs!</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load audit logs. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
      <CardHeader>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiActivity as any} color="purple.400" />
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Audit Logs
              </Text>
              {!loading && (
                <Badge colorScheme="purple" variant="subtle">
                  {filteredLogs.length} entries
                </Badge>
              )}
            </HStack>
            <Button size="sm" onClick={() => refetch()} isLoading={loading}>
              Refresh
            </Button>
          </HStack>

          {/* Filters */}
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <GridItem>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch as any} color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </GridItem>
            <GridItem>
              <Select
                placeholder="All Actions"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                {Object.entries(ACTION_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </Select>
            </GridItem>
            <GridItem>
              <Select
                placeholder="All Resources"
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
              >
                {Object.entries(RESOURCE_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </Select>
            </GridItem>
            <GridItem>
              <Input
                placeholder="User email..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </GridItem>
            <GridItem>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </GridItem>
            <GridItem>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setActionFilter('');
                  setResourceFilter('');
                  setUserFilter('');
                  setDateFilter('');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </GridItem>
          </Grid>
        </VStack>
      </CardHeader>

      <CardBody>
        {loading ? (
          <Flex justify="center" p={8}>
            <Spinner size="lg" color="purple.400" />
          </Flex>
        ) : filteredLogs.length === 0 ? (
          <Flex justify="center" align="center" p={8}>
            <VStack>
              <Icon as={FiInfo as any} size="40px" color={mutedColor} />
              <Text color={mutedColor}>No audit logs found</Text>
            </VStack>
          </Flex>
        ) : (
          <Box maxHeight={maxHeight} overflowY="auto">
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                  <Tr>
                    <Th>Timestamp</Th>
                    <Th>User</Th>
                    <Th>Action</Th>
                    <Th>Resource</Th>
                    <Th>Details</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredLogs.map((log: AuditLog) => {
                    const actionInfo = getActionInfo(log.action);
                    const resourceInfo = getResourceInfo(log.resourceType);
                    const details = parseDetails(log.details);

                    return (
                      <Tr
                        key={log.id}
                        _hover={{ bg: hoverBg }}
                        cursor="pointer"
                        onClick={() => {
                          setSelectedLog(log);
                          onOpen();
                        }}
                      >
                        <Td>
                          <Tooltip label={new Date(log.createdAt).toLocaleString()}>
                            <Text fontSize="xs" color={mutedColor}>
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {log.user?.name || 'System'}
                            </Text>
                            <Text fontSize="xs" color={mutedColor}>
                              {log.user?.email || 'N/A'}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Icon as={actionInfo.icon as any} color={`${actionInfo.color}.400`} />
                            <Badge colorScheme={actionInfo.color} variant="subtle">
                              {actionInfo.label}
                            </Badge>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Icon as={resourceInfo.icon as any} color={`${resourceInfo.color}.400`} />
                            <Text fontSize="sm">{resourceInfo.label}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color={mutedColor} noOfLines={2}>
                            {details?.metadata?.file_name ||
                             details?.metadata?.email ||
                             details?.error_message ||
                             'No additional details'}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={details?.success ? 'green' : 'red'}
                            variant="subtle"
                          >
                            {details?.success ? 'Success' : 'Failed'}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardBody>

      {/* Detailed Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={cardBg} maxH="80vh" overflowY="auto">
          <ModalHeader>
            <HStack>
              <Icon as={FiInfo as any} color="purple.400" />
              <Text>Audit Log Details</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedLog && (
              <VStack align="stretch" spacing={4}>
                {/* Basic Info */}
                <Card bg={lightCardBg}>
                  <CardBody>
                    <Grid templateColumns="1fr 1fr" gap={4}>
                      <VStack align="start">
                        <Text fontSize="sm" color={mutedColor}>Timestamp</Text>
                        <Text fontWeight="medium">
                          {new Date(selectedLog.createdAt).toLocaleString()}
                        </Text>
                      </VStack>
                      <VStack align="start">
                        <Text fontSize="sm" color={mutedColor}>User</Text>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">
                            {selectedLog.user?.name || 'System'}
                          </Text>
                          <Text fontSize="sm" color={mutedColor}>
                            {selectedLog.user?.email || 'N/A'}
                          </Text>
                          {selectedLog.user?.role && (
                            <Badge size="sm" colorScheme="blue">
                              {selectedLog.user.role}
                            </Badge>
                          )}
                        </VStack>
                      </VStack>
                      <VStack align="start">
                        <Text fontSize="sm" color={mutedColor}>Action</Text>
                        <HStack>
                          <Icon as={getActionInfo(selectedLog.action).icon as any} />
                          <Badge colorScheme={getActionInfo(selectedLog.action).color}>
                            {getActionInfo(selectedLog.action).label}
                          </Badge>
                        </HStack>
                      </VStack>
                      <VStack align="start">
                        <Text fontSize="sm" color={mutedColor}>Resource</Text>
                        <HStack>
                          <Icon as={getResourceInfo(selectedLog.resourceType).icon as any} />
                          <Text>{getResourceInfo(selectedLog.resourceType).label}</Text>
                        </HStack>
                      </VStack>
                    </Grid>
                  </CardBody>
                </Card>

                {/* Detailed Information */}
                {(() => {
                  const details = parseDetails(selectedLog.details);
                  if (!details) return null;

                  return (
                    <Card bg={lightCardBg}>
                      <CardHeader>
                        <Text fontWeight="bold">Detailed Information</Text>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          {/* Status */}
                          <HStack>
                            <Text fontSize="sm" color={mutedColor} minW="120px">Status:</Text>
                            <Badge colorScheme={details.success ? 'green' : 'red'}>
                              {details.success ? 'Success' : 'Failed'}
                            </Badge>
                          </HStack>

                          {/* File Details */}
                          {details.file_size && (
                            <HStack>
                              <Text fontSize="sm" color={mutedColor} minW="120px">File Size:</Text>
                              <Text>{formatFileSize(details.file_size)}</Text>
                            </HStack>
                          )}
                          
                          {details.file_mime_type && (
                            <HStack>
                              <Text fontSize="sm" color={mutedColor} minW="120px">File Type:</Text>
                              <Tag size="sm">
                                <TagLabel>{details.file_mime_type}</TagLabel>
                              </Tag>
                            </HStack>
                          )}

                          {/* IP Address */}
                          {details.ip_address && (
                            <HStack>
                              <Text fontSize="sm" color={mutedColor} minW="120px">IP Address:</Text>
                              <Text fontFamily="mono">{details.ip_address}</Text>
                            </HStack>
                          )}

                          {/* User Agent */}
                          {details.user_agent && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" color={mutedColor}>User Agent:</Text>
                              <Text fontSize="xs" fontFamily="mono" p={2} bg={codeBg} borderRadius="md">
                                {details.user_agent}
                              </Text>
                            </VStack>
                          )}

                          {/* Error Message */}
                          {details.error_message && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" color={mutedColor}>Error Message:</Text>
                              <Alert status="error" variant="subtle">
                                <AlertIcon />
                                <Text fontSize="sm">{details.error_message}</Text>
                              </Alert>
                            </VStack>
                          )}

                          {/* Metadata */}
                          {details.metadata && Object.keys(details.metadata).length > 0 && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" color={mutedColor}>Metadata:</Text>
                              <Box p={2} bg={codeBg} borderRadius="md" w="full">
                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                  {JSON.stringify(details.metadata, null, 2)}
                                </pre>
                              </Box>
                            </VStack>
                          )}

                          {/* Old/New Values for updates */}
                          {details.old_values && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" color={mutedColor}>Previous Values:</Text>
                              <Box p={2} bg={errorBg} borderRadius="md" w="full">
                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                  {JSON.stringify(details.old_values, null, 2)}
                                </pre>
                              </Box>
                            </VStack>
                          )}

                          {details.new_values && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" color={mutedColor}>New Values:</Text>
                              <Box p={2} bg={successBg} borderRadius="md" w="full">
                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                  {JSON.stringify(details.new_values, null, 2)}
                                </pre>
                              </Box>
                            </VStack>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })()}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default AuditLogsSystem;