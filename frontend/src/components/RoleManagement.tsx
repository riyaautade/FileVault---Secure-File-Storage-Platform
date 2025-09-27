import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  useDisclosure,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SettingsIcon } from '@chakra-ui/icons';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL Queries
const GET_ROLES_QUERY = gql`
  query GetRoles {
    roles {
      id
      name
      description
      isSystem
      permissions {
        id
        name
        description
        category
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_PERMISSIONS_QUERY = gql`
  query GetPermissions {
    permissions {
      id
      name
      description
      category
    }
  }
`;

const GET_USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      name
      email
      role
    }
  }
`;

const GET_USER_PERMISSIONS_QUERY = gql`
  query GetUserPermissions($userId: ID!) {
    userPermissions(userId: $userId) {
      user {
        id
        name
        email
      }
      roles {
        id
        name
        description
      }
      permissions {
        id
        name
        description
        category
      }
    }
  }
`;

// GraphQL Mutations
const CREATE_ROLE_MUTATION = gql`
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
      description
      permissions {
        id
        name
      }
    }
  }
`;

const ASSIGN_ROLE_MUTATION = gql`
  mutation AssignRole($input: AssignRoleInput!) {
    assignRoleToUser(input: $input) {
      id
      user {
        id
        name
      }
      role {
        id
        name
      }
    }
  }
`;

const DELETE_ROLE_MUTATION = gql`
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`;

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const RoleManagement: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    isOpen: isCreateRoleOpen,
    onOpen: onCreateRoleOpen,
    onClose: onCreateRoleClose,
  } = useDisclosure();

  const {
    isOpen: isAssignRoleOpen,
    onOpen: onAssignRoleOpen,
    onClose: onAssignRoleClose,
  } = useDisclosure();

  const toast = useToast();

  // Queries
  const { data: rolesData, loading: rolesLoading, refetch: refetchRoles } = useQuery(GET_ROLES_QUERY);
  const { data: permissionsData, loading: permissionsLoading } = useQuery(GET_PERMISSIONS_QUERY);
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS_QUERY);

  // Mutations
  const [createRole, { loading: createRoleLoading }] = useMutation(CREATE_ROLE_MUTATION, {
    onCompleted: () => {
      toast({
        title: 'Role Created',
        description: 'The role has been created successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onCreateRoleClose();
      refetchRoles();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error Creating Role',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [assignRole, { loading: assignRoleLoading }] = useMutation(ASSIGN_ROLE_MUTATION, {
    onCompleted: () => {
      toast({
        title: 'Role Assigned',
        description: 'The role has been assigned successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onAssignRoleClose();
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: 'Error Assigning Role',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [deleteRole] = useMutation(DELETE_ROLE_MUTATION, {
    onCompleted: () => {
      toast({
        title: 'Role Deleted',
        description: 'The role has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetchRoles();
    },
    onError: (error) => {
      toast({
        title: 'Error Deleting Role',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const resetForm = () => {
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions([]);
  };

  const handleCreateRole = () => {
    if (!newRoleName || selectedPermissions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a role name and select at least one permission.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    createRole({
      variables: {
        input: {
          name: newRoleName,
          description: newRoleDescription,
          permissionIds: selectedPermissions,
        },
      },
    });
  };

  const handleAssignRole = (roleId: string) => {
    if (!selectedUser) return;

    assignRole({
      variables: {
        input: {
          userId: selectedUser.id,
          roleId: roleId,
        },
      },
    });
  };

  const handleDeleteRole = (roleId: string) => {
    deleteRole({ variables: { id: roleId } });
  };

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin': return 'red';
      case 'manager': return 'orange';
      case 'editor': return 'blue';
      case 'viewer': return 'green';
      case 'file_manager': return 'purple';
      default: return 'gray';
    }
  };

  if (rolesLoading || permissionsLoading || usersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  const permissions = permissionsData?.permissions || [];
  const roles = rolesData?.roles || [];
  const users = usersData?.users || [];
  const groupedPermissions = groupPermissionsByCategory(permissions);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            🔐 Role-Based Access Control
          </Text>
          <HStack>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onCreateRoleOpen}
            >
              Create Role
            </Button>
            <Button
              leftIcon={<SettingsIcon />}
              colorScheme="green"
              onClick={onAssignRoleOpen}
            >
              Assign Roles
            </Button>
          </HStack>
        </HStack>

        {/* Roles Overview */}
        <Card>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">System Roles</Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {roles.map((role) => (
                <Card key={role.id} variant="outline">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" width="100%">
                        <Badge colorScheme={getRoleColor(role.name)}>
                          {role.name.toUpperCase()}
                        </Badge>
                        {role.isSystem && (
                          <Badge colorScheme="gray" size="sm">
                            System
                          </Badge>
                        )}
                      </HStack>
                      
                      <Text fontWeight="medium">{role.name}</Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {role.description}
                      </Text>
                      
                      <Divider />
                      
                      <Text fontSize="sm" fontWeight="medium">
                        Permissions ({role.permissions.length}):
                      </Text>
                      <Box maxHeight="100px" overflowY="auto" width="100%">
                        {role.permissions.map((perm) => (
                          <Badge
                            key={perm.id}
                            size="sm"
                            colorScheme="gray"
                            mr={1}
                            mb={1}
                            title={perm.description}
                          >
                            {perm.name}
                          </Badge>
                        ))}
                      </Box>

                      <HStack spacing={2} width="100%">
                        <Button size="sm" variant="outline" flex={1}>
                          View Details
                        </Button>
                        {!role.isSystem && (
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDeleteRole(role.id)}
                            aria-label="Delete role"
                          />
                        )}
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Create Role Modal */}
        <Modal isOpen={isCreateRoleOpen} onClose={onCreateRoleClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Role</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text mb={2} fontWeight="medium">Role Name</Text>
                  <Input
                    placeholder="Enter role name (e.g., Content Manager)"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">Description</Text>
                  <Textarea
                    placeholder="Describe what this role can do..."
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text mb={4} fontWeight="medium">Select Permissions</Text>
                  <CheckboxGroup
                    value={selectedPermissions}
                    onChange={(values) => setSelectedPermissions(values as string[])}
                  >
                    <VStack align="stretch" spacing={4}>
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                        <Box key={category}>
                          <Text fontWeight="medium" mb={2} textTransform="capitalize">
                            {category} Permissions
                          </Text>
                          <SimpleGrid columns={2} spacing={2}>
                            {categoryPermissions.map((permission) => (
                              <Checkbox key={permission.id} value={permission.id}>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm">{permission.name}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {permission.description}
                                  </Text>
                                </VStack>
                              </Checkbox>
                            ))}
                          </SimpleGrid>
                        </Box>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onCreateRoleClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleCreateRole}
                isLoading={createRoleLoading}
              >
                Create Role
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Assign Role Modal */}
        <Modal isOpen={isAssignRoleOpen} onClose={onAssignRoleClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Assign Role to User</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info" size="sm">
                  <AlertIcon />
                  Select a user and then choose a role to assign to them.
                </Alert>

                <Box>
                  <Text mb={2} fontWeight="medium">Select User</Text>
                  <VStack align="stretch" spacing={2} maxHeight="200px" overflowY="auto">
                    {users.map((user) => (
                      <Card
                        key={user.id}
                        variant={selectedUser?.id === user.id ? "filled" : "outline"}
                        cursor="pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <CardBody py={2}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{user.name}</Text>
                              <Text fontSize="sm" color="gray.500">{user.email}</Text>
                            </VStack>
                            <Badge>{user.role}</Badge>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </Box>

                {selectedUser && (
                  <Box>
                    <Text mb={2} fontWeight="medium">Available Roles</Text>
                    <SimpleGrid columns={1} spacing={2}>
                      {roles.map((role) => (
                        <Button
                          key={role.id}
                          variant="outline"
                          justifyContent="space-between"
                          onClick={() => handleAssignRole(role.id)}
                          isLoading={assignRoleLoading}
                        >
                          <VStack align="start" spacing={0}>
                            <Text>{role.name}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {role.description}
                            </Text>
                          </VStack>
                          <Badge colorScheme={getRoleColor(role.name)}>
                            {role.permissions.length} perms
                          </Badge>
                        </Button>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onAssignRoleClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};