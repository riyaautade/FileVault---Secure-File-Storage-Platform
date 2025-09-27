import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Grid,
  GridItem,
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Divider,
  useToast,
  Progress,
  Flex,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Collapse,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  DownloadIcon,
  DeleteIcon,
  ChevronDownIcon,
  AttachmentIcon,
  ExternalLinkIcon,
  SettingsIcon,
  CloseIcon,
  CopyIcon,
} from '@chakra-ui/icons';
import { useQuery, useMutation, gql, useApolloClient } from '@apollo/client';
import { useDropzone } from 'react-dropzone';
import { 
  UPLOAD_FILE_MUTATION, 
  FILES_QUERY, 
  FOLDERS_QUERY, 
  FOLDER_FILES_QUERY,
  CREATE_FOLDER_MUTATION,
  UPDATE_FOLDER_MUTATION,
  STORAGE_STATS_QUERY,
  ME_QUERY
} from '../graphql/queries';
import ShareModal from '../components/ShareModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import FileUploadWithPreview from '../components/FileUploadWithPreview';

// Additional mutations for file operations
const DELETE_FILE = gql`
  mutation DeleteFile($id: ID!) {
    deleteFile(id: $id)
  }
`;

const DELETE_FOLDER = gql`
  mutation DeleteFolder($id: ID!) {
    deleteFolder(id: $id)
  }
`;

const UPDATE_FILE_MUTATION = gql`
  mutation UpdateFile($id: ID!, $name: String, $isPublic: Boolean) {
    updateFile(id: $id, name: $name, isPublic: $isPublic) {
      id
      name
      isPublic
      downloadCount
      mimeType
      size
      createdAt
      updatedAt
      owner {
        id
        name
        email
      }
    }
  }
`;



interface FileData {
  id: string;
  name: string;
  contentHash: string;
  size: number;
  mimeType: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  folder?: {
    id: string;
    name: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface Folder {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    name: string;
  };
}

const FilesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [mimeTypeFilter, setMimeTypeFilter] = useState('');
  const [sizeRange, setSizeRange] = useState([0, 100]); // in MB
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploaderFilter, setUploaderFilter] = useState('');

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItem, setShareItem] = useState<{id: string, name: string, type: 'file' | 'folder'} | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: string, 
    name: string, 
    type: 'file' | 'folder',
    size?: string,
    owner?: string
  } | null>(null);

  const { isOpen: isFolderModalOpen, onOpen: onFolderModalOpen, onClose: onFolderModalClose } = useDisclosure();
  const toast = useToast();
  const client = useApolloClient();

  // Build filter object
  const buildFilters = () => {
    const filters: any = {};
    
    if (searchTerm) {
      filters.filename = searchTerm;
    }
    if (mimeTypeFilter) {
      filters.mimeType = mimeTypeFilter;
    }
    if (sizeRange[0] > 0) {
      filters.minSize = sizeRange[0] * 1024 * 1024; // Convert MB to bytes
    }
    if (sizeRange[1] < 100) {
      filters.maxSize = sizeRange[1] * 1024 * 1024; // Convert MB to bytes
    }
    if (dateFrom) {
      filters.fromDate = new Date(dateFrom).toISOString();
    }
    if (dateTo) {
      filters.toDate = new Date(dateTo).toISOString();
    }
    if (selectedTags.length > 0) {
      filters.tags = selectedTags;
    }
    if (uploaderFilter) {
      filters.uploader = uploaderFilter;
    }
    
    return Object.keys(filters).length > 0 ? filters : null;
  };

  // GraphQL Queries
  const { data: filesData, loading: filesLoading, refetch: refetchFiles } = useQuery(
    selectedFolder ? FOLDER_FILES_QUERY : FILES_QUERY,
    {
      variables: selectedFolder ? 
        { folderId: selectedFolder } : 
        { filter: buildFilters() },
      skip: false,
    }
  );

  const { data: foldersData, loading: foldersLoading, refetch: refetchFolders } = useQuery(FOLDERS_QUERY);

  // Refetch when filters change
  useEffect(() => {
    refetchFiles();
  }, [searchTerm, mimeTypeFilter, sizeRange, dateFrom, dateTo, selectedTags, uploaderFilter, refetchFiles]);

  // GraphQL Mutations
  const [uploadFile] = useMutation(UPLOAD_FILE_MUTATION, {
    onCompleted: () => {
      // Refetch current queries
      refetchFiles();
      refetchFolders();
      setIsUploading(false);
      setUploadProgress(0);
      
      // Comprehensive cache invalidation for all related queries
      client.refetchQueries({
        include: [FILES_QUERY, FOLDERS_QUERY, FOLDER_FILES_QUERY, STORAGE_STATS_QUERY, ME_QUERY]
      });
      
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [createFolder] = useMutation(CREATE_FOLDER_MUTATION, {
    onCompleted: () => {
      refetchFolders();
      refetchFiles();
      setNewFolderName('');
      onFolderModalClose();
      
      // Comprehensive cache invalidation
      client.refetchQueries({
        include: [FILES_QUERY, FOLDERS_QUERY, FOLDER_FILES_QUERY, STORAGE_STATS_QUERY, ME_QUERY]
      });
      
      toast({
        title: 'Folder created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create folder',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [updateFolder] = useMutation(UPDATE_FOLDER_MUTATION, {
    onCompleted: () => {
      refetchFolders();
      refetchFiles();
      
      // Comprehensive cache invalidation
      client.refetchQueries({
        include: [FILES_QUERY, FOLDERS_QUERY, FOLDER_FILES_QUERY, STORAGE_STATS_QUERY, ME_QUERY]
      });
      
      toast({
        title: 'Folder updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update folder',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [deleteFile] = useMutation(DELETE_FILE, {
    onCompleted: () => {
      refetchFiles();
      refetchFolders();
      
      // Comprehensive cache invalidation for dashboard updates
      client.refetchQueries({
        include: [FILES_QUERY, FOLDERS_QUERY, FOLDER_FILES_QUERY, STORAGE_STATS_QUERY, ME_QUERY]
      });
      
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

  const [deleteFolder] = useMutation(DELETE_FOLDER, {
    onCompleted: () => {
      refetchFiles();
      refetchFolders();
      
      // Comprehensive cache invalidation for dashboard updates
      client.refetchQueries({
        include: [FILES_QUERY, FOLDERS_QUERY, FOLDER_FILES_QUERY, STORAGE_STATS_QUERY, ME_QUERY]
      });
      
      toast({
        title: 'Folder deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete folder',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const [updateFile] = useMutation(UPDATE_FILE_MUTATION, {
    onCompleted: () => {
      refetchFiles();
      refetchFolders();
      
      // Comprehensive cache invalidation for dashboard updates
      client.refetchQueries({
        include: [FILES_QUERY, FOLDERS_QUERY, FOLDER_FILES_QUERY, STORAGE_STATS_QUERY, ME_QUERY]
      });
      
      toast({
        title: 'File updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update file',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // File upload with drag and drop
  const onDrop = useCallback(async (acceptedFiles: any[]) => {
    for (const file of acceptedFiles) {
      setIsUploading(true);
      try {
        await uploadFile({
          variables: {
            file: file,
            folderId: selectedFolder,
            isPublic: false,
          },
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  }, [uploadFile, selectedFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder({ 
        variables: { 
          input: {
            name: newFolderName.trim(),
            parentId: selectedFolder,
            isPublic: false
          }
        } 
      });
    }
  };

  const handleDeleteFile = (file: FileData) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setDeleteItem({
      id: file.id,
      name: file.name,
      type: 'file',
      size: `${sizeInMB} MB`,
      owner: file.owner?.name || 'Unknown'
    });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    
    if (deleteItem.type === 'file') {
      await deleteFile({ variables: { id: deleteItem.id } });
    } else if (deleteItem.type === 'folder') {
      await deleteFolder({ variables: { id: deleteItem.id } });
      setSelectedFolder(null); // Navigate back to all files
    }
  };

  const handleDownloadFile = (fileId: string, fileName: string) => {
    // Create a download link
    const downloadUrl = `http://localhost:8080/download/${fileId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFilePublic = (file: FileData) => {
    const newPublicStatus = !file.isPublic;
    updateFile({
      variables: {
        id: file.id,
        isPublic: newPublicStatus,
      },
    });

    if (newPublicStatus) {
      toast({
        title: 'File is now public',
        description: `Public link: http://localhost:8080/download/${file.id}`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'File is now private',
        description: 'Only you can access this file now',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const clearFilters = () => {
    setMimeTypeFilter('');
    setSizeRange([0, 100]);
    setDateFrom('');
    setDateTo('');
    setSelectedTags([]);
    setUploaderFilter('');
    setSearchTerm('');
  };

  const handleDeleteFolder = (folder: Folder) => {
    setDeleteItem({
      id: folder.id,
      name: folder.name,
      type: 'folder',
      owner: folder.owner?.name || 'Unknown'
    });
    setDeleteModalOpen(true);
  };

  const handleToggleFolderVisibility = async (folder: Folder) => {
    try {
      await updateFolder({
        variables: {
          id: folder.id,
          input: { isPublic: !folder.isPublic }
        }
      });
    } catch (error) {
      console.error('Failed to update folder visibility:', error);
    }
  };

  const handleCopyFolderShareLink = (folder: Folder) => {
    if (!folder.isPublic) {
      toast({
        title: 'Folder is not public',
        description: 'Make the folder public first to get a share link',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const shareUrl = `${window.location.origin}/public/folder/${folder.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Share link copied!',
        description: 'The public folder link has been copied to your clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }).catch(() => {
      toast({
        title: 'Failed to copy link',
        description: 'Could not copy the share link to clipboard',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });
  };

  const handleOpenShareModal = (id: string, name: string, type: 'file' | 'folder') => {
    setShareItem({ id, name, type });
    setShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setShareItem(null);
  };

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

  // Extract files from the appropriate query response
  const files = selectedFolder ? filesData?.folder?.files : filesData?.files;
  const filteredFiles = files?.filter((file: FileData) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Box p={6} bg="gray.900" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            My Files
          </Text>
          <HStack>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="purple"
              variant="solid"
              onClick={onFolderModalOpen}
            >
              New Folder
            </Button>
          </HStack>
        </Flex>

        {/* Folder Navigation */}
        <Box>
          <HStack spacing={4} mb={4}>
            <Button
              size="sm"
              variant={selectedFolder === null ? 'solid' : 'outline'}
              colorScheme="purple"
              onClick={() => setSelectedFolder(null)}
            >
              All Files
            </Button>
            {foldersData?.folders?.map((folder: Folder) => (
              <HStack key={folder.id} spacing={0}>
                <Button
                  size="sm"
                  variant={selectedFolder === folder.id ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setSelectedFolder(folder.id)}
                  borderRightRadius={0}
                  position="relative"
                >
                  <HStack spacing={1}>
                    <Text>📁 {folder.name}</Text>
                    {folder.isPublic && (
                      <Badge colorScheme="green" size="sm" fontSize="xs">
                        Public
                      </Badge>
                    )}
                  </HStack>
                </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<ChevronDownIcon />}
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    borderLeftRadius={0}
                    borderLeft="none"
                  />
                  <MenuList bg="gray.700" borderColor="gray.600">
                    <MenuItem
                      icon={<ExternalLinkIcon />}
                      bg="gray.700"
                      color="white"
                      _hover={{ bg: "gray.600" }}
                      onClick={() => handleToggleFolderVisibility(folder)}
                    >
                      {folder.isPublic ? 'Make Private' : 'Make Public'}
                    </MenuItem>
                    {folder.isPublic && (
                      <MenuItem
                        icon={<CopyIcon />}
                        bg="gray.700"
                        color="white"
                        _hover={{ bg: "gray.600" }}
                        onClick={() => handleCopyFolderShareLink(folder)}
                      >
                        Copy Share Link
                      </MenuItem>
                    )}
                    <MenuItem
                      icon={<AttachmentIcon />}
                      bg="gray.700"
                      color="white"
                      _hover={{ bg: "gray.600" }}
                      onClick={() => handleOpenShareModal(folder.id, folder.name, 'folder')}
                    >
                      Share with Users
                    </MenuItem>
                    <Divider borderColor="gray.600" />
                    <MenuItem
                      icon={<DeleteIcon />}
                      bg="gray.700"
                      color="red.300"
                      _hover={{ bg: "red.800" }}
                      onClick={() => handleDeleteFolder(folder)}
                    >
                      Delete Folder
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            ))}
          </HStack>
        </Box>

        {/* Search and Filter Controls */}
        <VStack spacing={4} align="stretch">
          <HStack spacing={4}>
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search files by name..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                bg="gray.800"
                border="1px solid"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.400' }}
              />
            </InputGroup>
            <Button
              leftIcon={<SettingsIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              colorScheme="purple"
              size="md"
            >
              Filters
            </Button>
            {(mimeTypeFilter || sizeRange[0] > 0 || sizeRange[1] < 100 || dateFrom || dateTo || selectedTags.length > 0 || uploaderFilter) && (
              <Button
                leftIcon={<CloseIcon />}
                onClick={clearFilters}
                variant="outline"
                colorScheme="red"
                size="md"
              >
                Clear
              </Button>
            )}
          </HStack>

          {/* Advanced Filters Panel */}
          <Collapse in={showFilters}>
            <Card bg="gray.800" borderColor="gray.600">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    Filter Options
                  </Text>
                  
                  <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                    {/* MIME Type Filter */}
                    <FormControl>
                      <FormLabel color="gray.300">File Type</FormLabel>
                      <Select
                        placeholder="All file types"
                        value={mimeTypeFilter}
                        onChange={(e) => setMimeTypeFilter(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                      >
                        <option value="image/">Images</option>
                        <option value="application/pdf">PDF Documents</option>
                        <option value="text/">Text Files</option>
                        <option value="application/">Applications</option>
                        <option value="video/">Videos</option>
                        <option value="audio/">Audio</option>
                      </Select>
                    </FormControl>

                    {/* Uploader Filter */}
                    <FormControl>
                      <FormLabel color="gray.300">Uploader</FormLabel>
                      <Input
                        placeholder="Filter by uploader name..."
                        value={uploaderFilter}
                        onChange={(e) => setUploaderFilter(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        _placeholder={{ color: 'gray.400' }}
                      />
                    </FormControl>

                    {/* Date Range */}
                    <FormControl>
                      <FormLabel color="gray.300">Date From</FormLabel>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel color="gray.300">Date To</FormLabel>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                      />
                    </FormControl>
                  </Grid>

                  {/* File Size Range */}
                  <FormControl>
                    <FormLabel color="gray.300">
                      File Size Range: {sizeRange[0]}MB - {sizeRange[1] === 100 ? '∞' : `${sizeRange[1]}MB`}
                    </FormLabel>
                    <RangeSlider
                      value={sizeRange}
                      onChange={(val) => setSizeRange(val)}
                      min={0}
                      max={100}
                      step={1}
                      colorScheme="purple"
                    >
                      <RangeSliderTrack bg="gray.700">
                        <RangeSliderFilledTrack bg="purple.500" />
                      </RangeSliderTrack>
                      <RangeSliderThumb boxSize={4} index={0} />
                      <RangeSliderThumb boxSize={4} index={1} />
                    </RangeSlider>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          </Collapse>
        </VStack>

        {/* Upload Progress */}
        {isUploading && (
          <Box>
            <Text color="white" mb={2}>Uploading...</Text>
            <Progress value={uploadProgress} colorScheme="purple" />
          </Box>
        )}

        {/* Enhanced File Upload with Previews */}
        <Card bg="gray.800" borderColor="gray.600" border="1px solid">
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" color="white" mb={4}>
              📤 Upload Files with Preview
            </Text>
            <FileUploadWithPreview
              folderId={selectedFolder}
              onUploadComplete={() => {
                refetchFiles();
                toast({
                  title: 'Files uploaded successfully!',
                  description: 'Your files have been uploaded with previews.',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            />
          </CardBody>
        </Card>

        {/* Files Grid */}
        {filesLoading ? (
          <Text color="gray.400">Loading files...</Text>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={4}>
            {filteredFiles.map((file: FileData) => (
              <GridItem key={file.id}>
                <Card bg="gray.800" borderColor="gray.700" border="1px solid">
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between" align="start">
                        <HStack>
                          <Text fontSize="2xl">{getFileIcon(file.mimeType)}</Text>
                          <VStack align="start" spacing={0} flex={1}>
                            <Text
                              color="white"
                              fontWeight="medium"
                              noOfLines={2}
                              fontSize="sm"
                            >
                              {file.name}
                            </Text>
                            <Text color="gray.400" fontSize="xs">
                              {formatFileSize(file.size)}
                            </Text>
                          </VStack>
                        </HStack>
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
                              icon={<DownloadIcon />}
                              bg="gray.700"
                              color="white"
                              _hover={{ bg: "gray.600" }}
                              onClick={() => handleDownloadFile(file.id, file.name)}
                            >
                              Download
                            </MenuItem>
                            <MenuItem
                              icon={<ExternalLinkIcon />}
                              bg="gray.700"
                              color="white"
                              _hover={{ bg: "gray.600" }}
                              onClick={() => handleToggleFilePublic(file)}
                            >
                              {file.isPublic ? 'Make Private' : 'Make Public'}
                            </MenuItem>
                            <MenuItem
                              icon={<AttachmentIcon />}
                              bg="gray.700"
                              color="white"
                              _hover={{ bg: "gray.600" }}
                              onClick={() => handleOpenShareModal(file.id, file.name, 'file')}
                            >
                              Share with Users
                            </MenuItem>
                            <Divider borderColor="gray.600" />
                            <MenuItem
                              icon={<DeleteIcon />}
                              bg="gray.700"
                              color="red.300"
                              _hover={{ bg: "red.800" }}
                              onClick={() => handleDeleteFile(file)}
                            >
                              Delete
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>

                      {file.tags && file.tags.length > 0 && (
                        <HStack wrap="wrap">
                          {file.tags.map((tag: any) => (
                            <Badge
                              key={tag.id}
                              colorScheme="purple"
                              size="sm"
                              variant="subtle"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </HStack>
                      )}

                      <Text color="gray.500" fontSize="xs">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}

        {filteredFiles.length === 0 && !filesLoading && (
          <Box textAlign="center" py={12}>
            <Text color="gray.400" fontSize="lg">
              {searchTerm
                ? "No files found matching your search"
                : selectedFolder
                ? "No files in this folder"
                : "No files uploaded yet"}
            </Text>
          </Box>
        )}
      </VStack>

      {/* Create Folder Modal */}
      <Modal isOpen={isFolderModalOpen} onClose={onFolderModalClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="white">Create New Folder</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
              bg="gray.700"
              border="1px solid"
              borderColor="gray.600"
              color="white"
              _placeholder={{ color: 'gray.400' }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFolderModalClose} color="gray.400">
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateFolder}
              isDisabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={handleCloseShareModal}
        itemId={shareItem?.id || ''}
        itemName={shareItem?.name || ''}
        itemType={shareItem?.type || 'file'}
        refetchData={() => {
          refetchFiles();
          refetchFolders();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <ConfirmDeleteModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteItem(null);
          }}
          onConfirm={confirmDelete}
          itemName={deleteItem.name}
          itemType={deleteItem.type}
          itemSize={deleteItem.size}
          itemOwner={deleteItem.owner}
        />
      )}
    </Box>
  );
};

export default FilesPage;