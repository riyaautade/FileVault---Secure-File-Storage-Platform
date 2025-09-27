import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  IconButton,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
} from '@chakra-ui/react';
import {
  DownloadIcon,
  ArrowBackIcon,
} from '@chakra-ui/icons';
import { useQuery, gql } from '@apollo/client';

const PUBLIC_FOLDER_QUERY = gql`
  query PublicFolder($id: ID!) {
    publicFolder(id: $id) {
      id
      name
      isPublic
      files {
        id
        name
        mimeType
        size
        downloadCount
        createdAt
      }
      subfolders {
        id
        name
        isPublic
      }
      owner {
        id
        name
      }
      createdAt
    }
  }
`;

interface PublicFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  downloadCount: number;
  createdAt: string;
}

interface PublicSubfolder {
  id: string;
  name: string;
  isPublic: boolean;
}

interface PublicFolderData {
  id: string;
  name: string;
  isPublic: boolean;
  files: PublicFile[];
  subfolders: PublicSubfolder[];
  owner: {
    id: string;
    name: string;
  };
  createdAt: string;
}

const PublicFolderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data, loading, error } = useQuery(PUBLIC_FOLDER_QUERY, {
    variables: { id },
    errorPolicy: 'all'
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📎';
  };

  const handleDownloadFile = (fileId: string, fileName: string) => {
    // Create download URL - using the same pattern as the authenticated version
    const downloadUrl = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/download/${fileId}`;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <Box 
        minH="100vh" 
        bg="gray.900" 
        color="white" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.400" />
          <Text>Loading public folder...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !data?.publicFolder) {
    return (
      <Box minH="100vh" bg="gray.900" color="white" p={8}>
        <VStack spacing={6} align="center" justify="center" minH="80vh">
          <Alert status="error" bg="red.800" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Folder Not Found!</AlertTitle>
              <AlertDescription>
                This folder is either private, doesn't exist, or you don't have permission to view it.
              </AlertDescription>
            </Box>
          </Alert>
          <Button leftIcon={<ArrowBackIcon />} colorScheme="purple" onClick={goBack}>
            Go Back
          </Button>
        </VStack>
      </Box>
    );
  }

  const folder: PublicFolderData = data.publicFolder;

  if (!folder.isPublic) {
    return (
      <Box minH="100vh" bg="gray.900" color="white" p={8}>
        <VStack spacing={6} align="center" justify="center" minH="80vh">
          <Alert status="warning" bg="orange.800" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Private Folder!</AlertTitle>
              <AlertDescription>
                This folder is not publicly accessible.
              </AlertDescription>
            </Box>
          </Alert>
          <Button leftIcon={<ArrowBackIcon />} colorScheme="purple" onClick={goBack}>
            Go Back
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" color="white">
      {/* Header */}
      <Box bg="gray.800" px={8} py={6} borderBottom="1px" borderColor="gray.700">
        <VStack spacing={4} align="start">
          <HStack spacing={4}>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              colorScheme="purple"
              onClick={goBack}
            >
              Back
            </Button>
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              Public Folder
            </Badge>
          </HStack>
          
          <VStack align="start" spacing={1}>
            <HStack spacing={3} align="center">
              <Text fontSize="3xl" fontWeight="bold" color="purple.300">
                📁 {folder.name}
              </Text>
            </HStack>
            
            <Text color="gray.400" fontSize="sm">
              Shared by {folder.owner.name} • Created {new Date(folder.createdAt).toLocaleDateString()}
            </Text>
            
            <HStack spacing={4} mt={2}>
              <Text fontSize="sm" color="gray.300">
                {folder.files.length} file{folder.files.length !== 1 ? 's' : ''}
              </Text>
              {folder.subfolders.filter(sf => sf.isPublic).length > 0 && (
                <Text fontSize="sm" color="gray.300">
                  {folder.subfolders.filter(sf => sf.isPublic).length} public subfolder{folder.subfolders.filter(sf => sf.isPublic).length !== 1 ? 's' : ''}
                </Text>
              )}
            </HStack>
          </VStack>
        </VStack>
      </Box>

      {/* Content */}
      <Box p={8}>
        <VStack spacing={8} align="stretch">
          {/* Public Subfolders */}
          {folder.subfolders.filter(sf => sf.isPublic).length > 0 && (
            <Box>
              <Text fontSize="xl" fontWeight="semibold" color="purple.300" mb={4}>
                Public Subfolders
              </Text>
              <HStack spacing={4} wrap="wrap">
                {folder.subfolders
                  .filter(sf => sf.isPublic)
                  .map((subfolder) => (
                    <Button
                      key={subfolder.id}
                      size="md"
                      variant="outline"
                      colorScheme="purple"
                      onClick={() => window.location.href = `/public/folder/${subfolder.id}`}
                    >
                      📁 {subfolder.name}
                    </Button>
                  ))
                }
              </HStack>
            </Box>
          )}

          {/* Files */}
          {folder.files.length > 0 ? (
            <Box>
              <Text fontSize="xl" fontWeight="semibold" color="purple.300" mb={4}>
                Files ({folder.files.length})
              </Text>
              <Grid 
                templateColumns="repeat(auto-fill, minmax(300px, 1fr))" 
                gap={4}
              >
                {folder.files.map((file) => (
                  <GridItem key={file.id}>
                    <Card bg="gray.800" borderColor="gray.700">
                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <HStack spacing={3} w="full">
                            <Text fontSize="2xl">{getFileIcon(file.mimeType)}</Text>
                            <VStack align="start" spacing={1} flex={1}>
                              <Text 
                                fontWeight="medium" 
                                color="white" 
                                noOfLines={2}
                                wordBreak="break-all"
                              >
                                {file.name}
                              </Text>
                              <HStack spacing={4}>
                                <Text color="gray.400" fontSize="xs">
                                  {formatFileSize(file.size)}
                                </Text>
                                <Text color="gray.400" fontSize="xs">
                                  {file.downloadCount} downloads
                                </Text>
                              </HStack>
                            </VStack>
                            <IconButton
                              icon={<DownloadIcon />}
                              variant="ghost"
                              colorScheme="purple"
                              size="sm"
                              onClick={() => handleDownloadFile(file.id, file.name)}
                              aria-label={`Download ${file.name}`}
                            />
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box>
              <Text fontSize="xl" fontWeight="semibold" color="purple.300" mb={4}>
                Files
              </Text>
              <Alert status="info" bg="blue.800" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  This folder is empty.
                </AlertDescription>
              </Alert>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default PublicFolderPage;