import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { AuditLogsSystem } from '../components/AuditLogsSystem';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ChevronDownIcon,
  ViewIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { useQuery, useMutation, gql } from '@apollo/client';
import Analytics from '../components/Analytics';

// GraphQL Queries and Mutations
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      name
      role
      storageUsed
      storageQuota
      createdAt
      updatedAt
    }
  }
`;

const GET_USER_FILE_COUNTS = gql`
  query GetUserFileCounts {
    files(first: 1000) {
      id
      size
      owner {
        id
      }
    }
  }
`;

const GET_STORAGE_STATS = gql`
  query GetStorageStats {
    storageStats {
      totalStorage
      originalStorage
      savedStorage
      savingsPercentage
    }
  }
`;

const GET_ALL_FILES_COUNT = gql`
  query GetAllFilesCount {
    files(first: 1000) {
      id
      name
      size
      createdAt
    }
  }
`;

const GET_AUDIT_LOGS = gql`
  query GetAuditLogs {
    auditLogs {
      id
      userId
      action
      resourceType
      resourceId
      details
      createdAt
    }
  }
`;

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      name
      role
      storageUsed
      storageQuota
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_USER_ROLE = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      name
      role
      storageUsed
      storageQuota
      createdAt
      updatedAt
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    signup(input: $input) {
      user {
        id
        email
        name
        role
      }
    }
  }
`;

const GET_ALL_FILES = gql`
  query GetAllFiles($filter: FileFilter, $first: Int) {
    files(filter: $filter, first: $first) {
      id
      name
      mimeType
      size
      createdAt
      downloadCount
      isPublic
      owner {
        id
        email
      }
    }
  }
`;

const UPLOAD_FILE_ADMIN = gql`
  mutation UploadFileAdmin($file: Upload!, $folderId: ID, $isPublic: Boolean) {
    uploadFile(file: $file, folderId: $folderId, isPublic: $isPublic) {
      id
      name
      mimeType
      size
      createdAt
      owner {
        email
      }
    }
  }
`;

const DELETE_FILE_ADMIN = gql`
  mutation DeleteFileAdmin($id: ID!) {
    deleteFile(id: $id)
  }
`;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  storageUsed: number;
  storageQuota: number;
  createdAt: string;
  updatedAt: string;
}

interface File {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadCount: number;
  isPublic: boolean;
  owner: {
    id: string;
    email: string;
  };
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
  user: {
    email: string;
  };
}

interface StorageStats {
  totalStorage: number;
  originalStorage: number;
  savedStorage: number;
  savingsPercentage: number;
}

const AdminPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingRole, setEditingRole] = useState('');
  
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState(2);
  
  // Debug tab changes
  const handleTabChange = (index: number) => {
    console.log('Tab changed to:', index);
    setActiveTab(index);
  };

  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
  const [viewingUser, setViewingUser] = useState<any>(null);
  const toast = useToast();

  // GraphQL Queries
  const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery(GET_USERS, {
    errorPolicy: 'all'
  });
  const { data: userFilesData, loading: userFilesLoading } = useQuery(GET_USER_FILE_COUNTS, {
    errorPolicy: 'all'
  });
  const { data: storageData, loading: storageLoading, error: storageError } = useQuery(GET_STORAGE_STATS, {
    errorPolicy: 'all'
  });
  const { data: allFilesData, loading: allFilesLoading, error: allFilesError } = useQuery(GET_ALL_FILES_COUNT, {
    errorPolicy: 'all'
  });
  const { data: logsData, loading: logsLoading, error: logsError } = useQuery(GET_AUDIT_LOGS, {
    errorPolicy: 'all'
  });
  
  const { data: filesData, loading: filesLoading, refetch: refetchFiles } = useQuery(GET_ALL_FILES, {
    variables: {
      first: 1000, // Get all files, filter on frontend
    },
  });

  // GraphQL Mutations
  const [updateUserRole] = useMutation(UPDATE_USER_ROLE, {
    onCompleted: () => {
      refetchUsers();
      onEditModalClose();
      toast({
        title: 'User role updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update user role',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => {
      refetchUsers();
      toast({
        title: 'User deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete user',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      refetchUsers();
      setNewUserEmail('');
      setNewUserRole('user');
      setNewUserPassword('');
      onCreateModalClose();
      toast({
        title: `User created successfully: ${data.signup.user.email}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create user',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleCreateUser = () => {
    if (newUserEmail.trim() && newUserPassword.trim()) {
      createUser({
        variables: {
          input: {
            email: newUserEmail.trim(),
            name: newUserEmail.split('@')[0], // Use email prefix as name
            password: newUserPassword.trim(),
          },
        },
      });
    }
  };

  const handleViewDetails = (user: any) => {
    setViewingUser(user);
    onDetailsModalOpen();
  };

  const handleUpdateRole = () => {
    if (selectedUser && editingRole) {
      updateUserRole({ 
        variables: { 
          id: selectedUser.id, 
          input: { role: editingRole } 
        } 
      });
    }
  };

  const handleDeleteUser = (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      deleteUser({ variables: { id: userId } });
    }
  };

  const [uploadFileAdmin] = useMutation(UPLOAD_FILE_ADMIN, {
    onCompleted: () => {
      refetchFiles();
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to upload file',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [deleteFileAdmin] = useMutation(DELETE_FILE_ADMIN, {
    onCompleted: () => {
      refetchFiles();
      toast({
        title: 'File deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete file',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadFileAdmin({
      variables: {
        file: file,
        isPublic: false, // Default to private for admin uploads
      },
    });
  };

  const handleDeleteFile = (fileId: string, filename: string) => {
    if (window.confirm(`Are you sure you want to delete file "${filename}"?`)) {
      deleteFileAdmin({ variables: { id: fileId } });
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditingRole(user.role);
    onEditModalOpen();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'moderator':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Calculate file counts per user
  const getUserFileCount = (userId: string) => {
    if (!userFilesData?.files) return 0;
    return userFilesData.files.filter((file: any) => file.owner.id === userId).length;
  };

  const filteredUsers = usersData?.users?.filter((user: User) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredFiles = filesData?.files?.filter((file: File) =>
    file.name.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
    file.owner.email.toLowerCase().includes(fileSearchTerm.toLowerCase())
  ) || [];

  return (
    <Box p={6} bg="gray.900" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Admin Panel
            </Text>
            <Text fontSize="sm" color="gray.400">
              Debug: Token exists: {localStorage.getItem('token') ? 'Yes' : 'No'}
            </Text>
          </VStack>
        </Flex>

        {/* Admin Stats */}
        {(storageLoading || allFilesLoading) ? (
          <Spinner color="purple.400" />
        ) : (storageError || allFilesError) ? (
          <Text color="red.400">Error loading stats: {storageError?.message || allFilesError?.message}</Text>
        ) : (
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <GridItem>
              <Card bg="gray.800" borderColor="gray.700">
                <CardBody>
                  <Stat>
                    <StatLabel color="gray.400">Total Users</StatLabel>
                    <StatNumber color="white">{usersData?.users?.length || 0}</StatNumber>
                    <StatHelpText color="purple.300">
                      {usersData?.users?.filter((u: any) => u.role === 'admin' || u.role === 'moderator').length || 0} admin/mod
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg="gray.800" borderColor="gray.700">
                <CardBody>
                  <Stat>
                    <StatLabel color="gray.400">Total Files</StatLabel>
                    <StatNumber color="white">{allFilesData?.files?.length || 0}</StatNumber>
                    <StatHelpText color="green.300">
                      {allFilesData?.files?.filter((f: any) => {
                        const uploadDate = new Date(f.createdAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return uploadDate >= weekAgo;
                      }).length || 0} this week
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg="gray.800" borderColor="gray.700">
                <CardBody>
                  <Stat>
                    <StatLabel color="gray.400">Storage Used</StatLabel>
                    <StatNumber color="white">
                      {formatBytes(storageData?.storageStats?.totalStorage || 0)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg="gray.800" borderColor="gray.700">
                <CardBody>
                  <Stat>
                    <StatLabel color="gray.400">Space Saved</StatLabel>
                    <StatNumber color="white">
                      {formatBytes(storageData?.storageStats?.savedStorage || 0)}
                    </StatNumber>
                    <StatHelpText color="green.300">
                      {(storageData?.storageStats?.savingsPercentage || 0).toFixed(1)}% saved
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        )}

        {/* Quick Navigation */}
        <HStack mb={4} spacing={2}>
          <Button size="sm" onClick={() => setActiveTab(0)} variant={activeTab === 0 ? 'solid' : 'outline'} colorScheme="purple">
            📊 Analytics
          </Button>
          <Button size="sm" onClick={() => setActiveTab(1)} variant={activeTab === 1 ? 'solid' : 'outline'} colorScheme="purple">
            👥 Users
          </Button>
          <Button size="sm" onClick={() => setActiveTab(2)} variant={activeTab === 2 ? 'solid' : 'outline'} colorScheme="purple">
            📁 Files
          </Button>
          <Button size="sm" onClick={() => setActiveTab(3)} variant={activeTab === 3 ? 'solid' : 'outline'} colorScheme="purple">
            📋 Audit Logs
          </Button>
        </HStack>

        {/* Tabbed Interface */}
        {/* Content displayed based on active tab */}




        {/* Render content based on active tab */}
        {activeTab === 0 && (
          <Box>
            <Analytics />
          </Box>
        )}

        {activeTab === 1 && (
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold" color="white">
                Users Management
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="purple"
                onClick={onCreateModalOpen}
              >
                Create User
              </Button>
            </Flex>
            
            <Card bg="gray.800" borderColor="gray.700">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Text fontSize="lg" fontWeight="semibold" color="white">
                    Users Management
              </Text>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  bg="gray.700"
                  border="1px solid"
                  borderColor="gray.600"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                />
              </InputGroup>
            </Flex>
          </CardHeader>
          <CardBody>
            {(usersLoading || userFilesLoading) ? (
              <Spinner color="purple.400" />
            ) : usersError ? (
              <VStack spacing={2}>
                <Text color="red.400">Error loading users: {usersError.message}</Text>
                <Text color="gray.400" fontSize="sm">
                  Network Error: {usersError.networkError?.message || 'Unknown'} - Make sure you're logged in as admin
                </Text>
              </VStack>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="gray.400" borderColor="gray.600">Email</Th>
                    <Th color="gray.400" borderColor="gray.600">Role</Th>
                    <Th color="gray.400" borderColor="gray.600">Files</Th>
                    <Th color="gray.400" borderColor="gray.600">Storage</Th>
                    <Th color="gray.400" borderColor="gray.600">Last Updated</Th>
                    <Th color="gray.400" borderColor="gray.600">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map((user: User) => (
                    <Tr key={user.id}>
                      <Td color="white" borderColor="gray.600">{user.email}</Td>
                      <Td borderColor="gray.600">
                        <Badge colorScheme={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </Td>
                      <Td color="gray.300" borderColor="gray.600">{getUserFileCount(user.id)}</Td>
                      <Td color="gray.300" borderColor="gray.600">{formatBytes(user.storageUsed)}</Td>
                      <Td color="gray.300" borderColor="gray.600">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </Td>
                      <Td borderColor="gray.600">
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<ChevronDownIcon />}
                            variant="ghost"
                            size="sm"
                            color="gray.400"
                          />
                          <MenuList bg="gray.700" borderColor="gray.600">
                            <MenuItem
                              icon={<ViewIcon />}
                              bg="gray.700"
                              color="white"
                              _hover={{ bg: "gray.600" }}
                              onClick={() => handleViewDetails(user)}
                            >
                              View Details
                            </MenuItem>
                            <MenuItem
                              icon={<EditIcon />}
                              bg="gray.700"
                              color="white"
                              _hover={{ bg: "gray.600" }}
                              onClick={() => openEditModal(user)}
                            >
                              Edit Role
                            </MenuItem>
                            <Divider borderColor="gray.600" />
                            <MenuItem
                              icon={<DeleteIcon />}
                              bg="gray.700"
                              color="red.300"
                              _hover={{ bg: "red.800" }}
                              onClick={() => handleDeleteUser(user.id, user.email)}
                            >
                              Delete User
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

          </VStack>
        )}

        {activeTab === 2 && (
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold" color="white">
                File Management
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="purple"
                as="label"
                cursor="pointer"
              >
                Upload File
                <Input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                  accept="*/*"
                />
              </Button>
            </Flex>

            <Card bg="gray.800" borderColor="gray.700">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="lg" fontWeight="semibold" color="white">
                        All Files
                      </Text>
                      <InputGroup maxW="300px">
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search files or uploaders..."
                          value={fileSearchTerm}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFileSearchTerm(e.target.value)}
                          bg="gray.700"
                          border="1px solid"
                          borderColor="gray.600"
                          color="white"
                          _placeholder={{ color: 'gray.400' }}
                        />
                      </InputGroup>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {filesLoading ? (
                      <Spinner color="purple.400" />
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color="gray.400" borderColor="gray.600">Filename</Th>
                            <Th color="gray.400" borderColor="gray.600">Type</Th>
                            <Th color="gray.400" borderColor="gray.600">Size</Th>
                            <Th color="gray.400" borderColor="gray.600">Uploader</Th>
                            <Th color="gray.400" borderColor="gray.600">Downloads</Th>
                            <Th color="gray.400" borderColor="gray.600">Uploaded</Th>
                            <Th color="gray.400" borderColor="gray.600">Status</Th>
                            <Th color="gray.400" borderColor="gray.600">Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredFiles.map((file: File) => (
                            <Tr key={file.id}>
                              <Td color="white" borderColor="gray.600">
                                <Text>{file.name}</Text>
                              </Td>
                              <Td color="gray.300" borderColor="gray.600">{file.mimeType}</Td>
                              <Td color="gray.300" borderColor="gray.600">{formatBytes(file.size)}</Td>
                              <Td color="gray.300" borderColor="gray.600">{file.owner.email}</Td>
                              <Td color="gray.300" borderColor="gray.600">
                                <Badge colorScheme={file.downloadCount > 10 ? 'green' : 'gray'}>
                                  {file.downloadCount} downloads
                                </Badge>
                              </Td>
                              <Td color="gray.300" borderColor="gray.600">
                                {new Date(file.createdAt).toLocaleDateString()}
                              </Td>
                              <Td borderColor="gray.600">
                                <Badge colorScheme={file.isPublic ? 'blue' : 'orange'}>
                                  {file.isPublic ? 'Public' : 'Private'}
                                </Badge>
                              </Td>
                              <Td borderColor="gray.600">
                                <IconButton
                                  icon={<DeleteIcon />}
                                  variant="ghost"
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDeleteFile(file.id, file.name)}
                                  aria-label="Delete file"
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </CardBody>
                </Card>
          </VStack>
        )}

        {activeTab === 3 && (
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="white">
              Audit Logs & Activity Monitoring
            </Text>
            {/* Comprehensive Audit Logs System */}
            <AuditLogsSystem maxHeight="600px" />
          </VStack>
        )}
      </VStack>

      {/* Create User Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="white">Create New User</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="Email"
                type="email"
                value={newUserEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserEmail(e.target.value)}
                bg="gray.700"
                border="1px solid"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.400' }}
              />
              <Input
                placeholder="Password"
                type="password"
                value={newUserPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserPassword(e.target.value)}
                bg="gray.700"
                border="1px solid"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.400' }}
              />
              <Select
                value={newUserRole}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUserRole(e.target.value)}
                bg="gray.700"
                border="1px solid"
                borderColor="gray.600"
                color="white"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateModalClose} color="gray.400">
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateUser}
              isDisabled={!newUserEmail.trim() || !newUserPassword.trim()}
            >
              Create User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="white">Edit User Role</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <VStack spacing={4}>
              <Text color="gray.300">
                Editing role for: <strong>{selectedUser?.email}</strong>
              </Text>
              <Select
                value={editingRole}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingRole(e.target.value)}
                bg="gray.700"
                border="1px solid"
                borderColor="gray.600"
                color="white"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose} color="gray.400">
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleUpdateRole}
              isDisabled={editingRole === selectedUser?.role}
            >
              Update Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* User Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={onDetailsModalClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>User Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewingUser && (
              <VStack align="start" spacing={4}>
                <Box>
                  <Text fontWeight="bold" color="gray.400">Email:</Text>
                  <Text>{viewingUser.email}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.400">Name:</Text>
                  <Text>{viewingUser.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.400">Role:</Text>
                  <Badge
                    colorScheme={viewingUser.role === 'admin' ? 'red' : viewingUser.role === 'moderator' ? 'orange' : 'blue'}
                    fontSize="0.8em"
                  >
                    {viewingUser.role?.toUpperCase()}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.400">Storage Used:</Text>
                  <Text>{formatBytes(viewingUser.storageUsed)} / {formatBytes(viewingUser.storageQuota)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.400">Files Count:</Text>
                  <Text>{getUserFileCount(viewingUser.id)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.400">Account Created:</Text>
                  <Text>{new Date(viewingUser.createdAt).toLocaleDateString()}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.400">Last Updated:</Text>
                  <Text>{new Date(viewingUser.updatedAt).toLocaleDateString()}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailsModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminPage;
