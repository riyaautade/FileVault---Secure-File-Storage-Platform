import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  List,
  ListItem,
  Avatar,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
      role
    }
  }
`;

const SHARE_FILE = gql`
  mutation ShareFile($fileId: ID!, $userId: ID!) {
    shareFile(id: $fileId, userId: $userId) {
      id
      user {
        id
        name
        email
      }
      createdAt
    }
  }
`;

const SHARE_FOLDER = gql`
  mutation ShareFolder($folderId: ID!, $userId: ID!) {
    shareFolder(id: $folderId, userId: $userId) {
      id
      user {
        id
        name
        email
      }
      createdAt
    }
  }
`;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemType: 'file' | 'folder';
  refetchData?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemType,
  refetchData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const toast = useToast();

  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);

  const [shareFile] = useMutation(SHARE_FILE);
  const [shareFolder] = useMutation(SHARE_FOLDER);

  const filteredUsers = usersData?.users?.filter((user: User) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to share with',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSharing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        if (itemType === 'file') {
          await shareFile({
            variables: {
              fileId: itemId,
              userId: userId
            }
          });
        } else {
          await shareFolder({
            variables: {
              folderId: itemId,
              userId: userId
            }
          });
        }
        successCount++;
      } catch (error) {
        console.error(`Failed to share with user ${userId}:`, error);
        errorCount++;
      }
    }

    setIsSharing(false);

    if (successCount > 0) {
      toast({
        title: 'Sharing successful',
        description: `${itemType} "${itemName}" shared with ${successCount} user${successCount !== 1 ? 's' : ''}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (refetchData) {
        refetchData();
      }
      
      onClose();
      setSelectedUsers([]);
      setSearchTerm('');
    }

    if (errorCount > 0) {
      toast({
        title: 'Some shares failed',
        description: `Failed to share with ${errorCount} user${errorCount !== 1 ? 's' : ''}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedUsers([]);
    setSearchTerm('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.600">
        <ModalHeader color="white">
          Share {itemType === 'file' ? '📄' : '📁'} "{itemName}"
        </ModalHeader>
        <ModalCloseButton color="white" />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color="gray.300" fontSize="sm">
              Select users to share this {itemType} with:
            </Text>
            
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              _placeholder={{ color: 'gray.400' }}
            />

            {usersLoading ? (
              <HStack justify="center" py={4}>
                <Spinner color="purple.400" />
                <Text color="gray.400">Loading users...</Text>
              </HStack>
            ) : (
              <List spacing={2} maxH="300px" overflowY="auto">
                {filteredUsers.length === 0 ? (
                  <Alert status="info" bg="blue.800" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      {searchTerm ? 'No users found matching your search' : 'No users available'}
                    </Text>
                  </Alert>
                ) : (
                  filteredUsers.map((user: User) => (
                    <ListItem
                      key={user.id}
                      p={3}
                      borderRadius="md"
                      bg={selectedUsers.includes(user.id) ? "purple.700" : "gray.700"}
                      cursor="pointer"
                      _hover={{ bg: selectedUsers.includes(user.id) ? "purple.600" : "gray.600" }}
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <HStack spacing={3}>
                        <Avatar size="sm" name={user.name} />
                        <VStack align="start" spacing={0} flex={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="medium" color="white">
                              {user.name}
                            </Text>
                            <Badge
                              colorScheme={user.role === 'admin' ? 'red' : user.role === 'moderator' ? 'orange' : 'blue'}
                              size="sm"
                            >
                              {user.role}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.400">
                            {user.email}
                          </Text>
                        </VStack>
                        {selectedUsers.includes(user.id) && (
                          <Badge colorScheme="purple" variant="solid">
                            Selected
                          </Badge>
                        )}
                      </HStack>
                    </ListItem>
                  ))
                )}
              </List>
            )}

            {selectedUsers.length > 0 && (
              <Alert status="info" bg="purple.800" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </Text>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleShare}
            isLoading={isSharing}
            loadingText="Sharing..."
            isDisabled={selectedUsers.length === 0 || usersLoading}
          >
            Share with {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ShareModal;