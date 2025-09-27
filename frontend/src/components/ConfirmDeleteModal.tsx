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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Icon,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { DeleteIcon, WarningIcon } from '@chakra-ui/icons';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName: string;
  itemType: 'file' | 'folder';
  itemSize?: string;
  itemOwner?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  itemSize,
  itemOwner
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm();
      toast({
        title: 'Deleted successfully',
        description: `${itemType === 'file' ? '📄' : '📁'} "${itemName}" has been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      
      let errorMessage = 'An unexpected error occurred';
      let errorTitle = 'Delete Failed';
      
      if (err.message) {
        if (err.message.includes('ACCESS_DENIED:')) {
          errorTitle = '❌ Access Denied';
          errorMessage = err.message.replace('ACCESS_DENIED:', '').trim();
        } else if (err.message.includes('FILE_NOT_FOUND:')) {
          errorTitle = '🚫 File Not Found';
          errorMessage = err.message.replace('FILE_NOT_FOUND:', '').trim();
        } else if (err.message.includes('FOLDER_NOT_FOUND:')) {
          errorTitle = '🚫 Folder Not Found';
          errorMessage = err.message.replace('FOLDER_NOT_FOUND:', '').trim();
        } else if (err.message.includes('DATABASE_ERROR:')) {
          errorTitle = '💾 Database Error';
          errorMessage = 'A database error occurred. Please try again or contact support.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(`${errorTitle}\n${errorMessage}`);
      
      // Also show toast for immediate feedback
      toast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
      setError(null);
    }
  };

  const getWarningMessage = () => {
    if (itemType === 'folder') {
      return 'This will permanently delete the folder and ALL files inside it. This action cannot be undone.';
    }
    return 'This will permanently delete the file. This action cannot be undone.';
  };

  const getConfirmText = () => {
    if (itemType === 'folder') {
      return 'Yes, delete folder and all contents';
    }
    return 'Yes, delete file';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.600">
        <ModalHeader color="white" pb={2}>
          <HStack spacing={3}>
            <Icon as={WarningIcon} color="red.400" boxSize={6} />
            <Text>Confirm Deletion</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Item Info */}
            <Box
              p={4}
              bg="gray.700"
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor="red.400"
            >
              <HStack spacing={3} align="start">
                <Text fontSize="2xl">
                  {itemType === 'file' ? '📄' : '📁'}
                </Text>
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontWeight="bold" color="white" wordBreak="break-all">
                    {itemName}
                  </Text>
                  {itemSize && (
                    <Text fontSize="sm" color="gray.300">
                      Size: {itemSize}
                    </Text>
                  )}
                  {itemOwner && (
                    <Text fontSize="sm" color="gray.300">
                      Owner: {itemOwner}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>

            {/* Warning Message */}
            <Alert status="warning" bg="orange.800" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="md">Warning!</AlertTitle>
                <AlertDescription fontSize="sm">
                  {getWarningMessage()}
                </AlertDescription>
              </Box>
            </Alert>

            {/* Error Display */}
            {error && (
              <>
                <Divider borderColor="gray.600" />
                <Alert status="error" bg="red.800" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertDescription fontSize="sm" whiteSpace="pre-line">
                      {error}
                    </AlertDescription>
                  </Box>
                </Alert>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            colorScheme="red"
            leftIcon={<DeleteIcon />}
            onClick={handleConfirm}
            isLoading={isDeleting}
            loadingText="Deleting..."
            isDisabled={!!error && error.includes('Access Denied')}
          >
            {getConfirmText()}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDeleteModal;