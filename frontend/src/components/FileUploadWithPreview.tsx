import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  SimpleGrid,
  Progress,
  Alert,
  AlertIcon,
  Divider,
  Badge,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { AddIcon, ArrowUpIcon, CheckIcon, WarningIcon, TimeIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import FilePreview from './FilePreview';

const UPLOAD_FILE_MUTATION = gql`
  mutation UploadFile($file: Upload!, $folderId: ID, $isPublic: Boolean) {
    uploadFile(file: $file, folderId: $folderId, isPublic: $isPublic) {
      id
      name
      size
      mimeType
      createdAt
    }
  }
`;

const FILES_QUERY = gql`
  query Files {
    files {
      id
      name
      size
      mimeType
      createdAt
    }
  }
`;

interface FileUploadWithPreviewProps {
  folderId?: string;
  onUploadComplete?: () => void;
}

// Enhanced upload progress tracking interface
interface UploadProgress {
  fileName: string;
  progress: number;
  speed: number; // bytes per second
  estimatedTime: number; // seconds remaining
  status: 'pending' | 'uploading' | 'completed' | 'error';
  startTime: number;
  bytesUploaded: number;
}

export const FileUploadWithPreview: React.FC<FileUploadWithPreviewProps> = ({
  folderId,
  onUploadComplete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: UploadProgress }>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const [uploadFile] = useMutation(UPLOAD_FILE_MUTATION, {
    refetchQueries: [{ query: FILES_QUERY }],
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Enhanced progress calculation utilities
  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatSpeed = useCallback((bytesPerSecond: number) => {
    return `${formatBytes(bytesPerSecond)}/s`;
  }, [formatBytes]);

  const formatTime = useCallback((seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, []);

  const updateProgress = useCallback((fileName: string, progress: number, bytesUploaded: number, startTime: number) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const speed = elapsedTime > 0 ? bytesUploaded / elapsedTime : 0;
    
    setUploadProgress(prev => {
      const fileProgress = prev[fileName];
      if (!fileProgress) return prev;
      
      const remainingBytes = (fileProgress.bytesUploaded || 0) * (100 - progress) / progress;
      const estimatedTime = speed > 0 ? remainingBytes / speed : 0;

      return {
        ...prev,
        [fileName]: {
          ...fileProgress,
          progress,
          speed,
          estimatedTime,
          bytesUploaded,
          status: progress === 100 ? 'completed' : 'uploading',
        }
      };
    });
  }, []);

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadStartTime(Date.now());
    let successCount = 0;
    let errorCount = 0;

    // Initialize progress for all files
    const initialProgress: { [key: string]: UploadProgress } = {};
    selectedFiles.forEach(file => {
      initialProgress[file.name] = {
        fileName: file.name,
        progress: 0,
        speed: 0,
        estimatedTime: 0,
        status: 'pending',
        startTime: Date.now(),
        bytesUploaded: 0,
      };
    });
    setUploadProgress(initialProgress);

    // Process files sequentially with enhanced progress tracking
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const startTime = Date.now();
      
      try {
        // Update status to uploading
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { ...prev[file.name], status: 'uploading', startTime }
        }));
        
        // Enhanced progress simulation with realistic timing
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name];
            if (!current || current.progress >= 90) return prev;
            
            const newProgress = Math.min(current.progress + Math.random() * 15 + 5, 90);
            const bytesUploaded = (file.size * newProgress) / 100;
            
            updateProgress(file.name, newProgress, bytesUploaded, startTime);
            return prev;
          });
        }, 200 + Math.random() * 300); // Vary interval for realism

        await uploadFile({
          variables: {
            file,
            folderId: folderId || null,
          },
        });

        clearInterval(progressInterval);
        
        // Complete the progress
        updateProgress(file.name, 100, file.size, startTime);
        successCount++;

        // Update overall progress
        setOverallProgress(((i + 1) / selectedFiles.length) * 100);

        // Small delay to show completed progress
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error('Upload error:', error);
        errorCount++;
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { ...prev[file.name], status: 'error' }
        }));

        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }

    // Calculate total upload time
    const totalTime = (Date.now() - uploadStartTime) / 1000;

    // Show summary toast
    if (successCount > 0) {
      toast({
        title: 'Upload Complete! 🎉',
        description: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''} in ${formatTime(totalTime)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }

    // Reset state after showing results for a moment
    setTimeout(() => {
      setSelectedFiles([]);
      setUploadProgress({});
      setUploading(false);
      setOverallProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);

    onUploadComplete?.();
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* File Selection */}
      <Box textAlign="center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="*/*"
        />
        
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => fileInputRef.current?.click()}
          size="lg"
          disabled={uploading}
        >
          Select Files
        </Button>
        
        <Text fontSize="sm" color="gray.500" mt={2}>
          Choose multiple files to upload with preview
        </Text>
      </Box>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <>
          <Divider />
          
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="semibold">
                Selected Files ({selectedFiles.length})
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total: {formatFileSize(getTotalSize())}
              </Text>
            </HStack>

            {selectedFiles.length > 6 && (
              <Alert status="info" size="sm">
                <AlertIcon />
                Showing preview for large number of files. Upload will process all {selectedFiles.length} files.
              </Alert>
            )}

            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {selectedFiles.slice(0, 12).map((file, index) => (
                <Box key={`${file.name}-${index}`}>
                  <FilePreview
                    file={file}
                    onRemove={() => handleRemoveFile(index)}
                    showRemove={!uploading}
                  />
                  
                  {/* Enhanced Upload Progress */}
                  {uploading && uploadProgress[file.name] !== undefined && (
                    <Box mt={2} p={2} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                      <VStack spacing={1} align="stretch">
                        {/* Progress Bar */}
                        <Progress
                          value={uploadProgress[file.name].progress}
                          colorScheme={uploadProgress[file.name].status === 'completed' ? 'green' : 
                                     uploadProgress[file.name].status === 'error' ? 'red' : 'blue'}
                          size="sm"
                          borderRadius="md"
                        />
                        
                        {/* Status and Percentage */}
                        <HStack justify="space-between" fontSize="xs">
                          <Badge
                            colorScheme={uploadProgress[file.name].status === 'completed' ? 'green' : 
                                       uploadProgress[file.name].status === 'error' ? 'red' : 
                                       uploadProgress[file.name].status === 'uploading' ? 'blue' : 'gray'}
                            variant="subtle"
                            size="sm"
                          >
                            {uploadProgress[file.name].status === 'completed' ? '✅ Complete' :
                             uploadProgress[file.name].status === 'error' ? '❌ Failed' :
                             uploadProgress[file.name].status === 'uploading' ? '📤 Uploading' :
                             '⏳ Pending'}
                          </Badge>
                          <Text fontWeight="bold">
                            {Math.round(uploadProgress[file.name].progress)}%
                          </Text>
                        </HStack>

                        {/* Speed and ETA for active uploads */}
                        {uploadProgress[file.name].status === 'uploading' && uploadProgress[file.name].speed > 0 && (
                          <HStack justify="space-between" fontSize="xs" color="gray.600">
                            <Text>
                              {formatSpeed(uploadProgress[file.name].speed)}
                            </Text>
                            {uploadProgress[file.name].estimatedTime > 0 && (
                              <Text>
                                ETA: {formatTime(uploadProgress[file.name].estimatedTime)}
                              </Text>
                            )}
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  )}
                </Box>
              ))}
            </SimpleGrid>

            {selectedFiles.length > 12 && (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                ... and {selectedFiles.length - 12} more files
              </Text>
            )}

            {/* Overall Progress Summary - Only show for multiple files */}
            {uploading && selectedFiles.length > 1 && (
              <Box p={4} bg="blue.50" borderRadius="lg" border="2px solid" borderColor="blue.200">
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="blue.800">
                      Upload Progress
                    </Text>
                    <Badge colorScheme="blue" variant="solid">
                      {Math.round(overallProgress)}% Complete
                    </Badge>
                  </HStack>
                  
                  <Progress
                    value={overallProgress}
                    colorScheme="blue"
                    size="lg"
                    borderRadius="full"
                    bg="blue.100"
                  />

                  <HStack justify="space-between" fontSize="sm" color="blue.700">
                    <HStack spacing={4}>
                      <Text>
                        <strong>{Object.values(uploadProgress).filter(p => p.status === 'completed').length}</strong> / {selectedFiles.length} files uploaded
                      </Text>
                      {uploadStartTime > 0 && (
                        <Text>
                          <strong>Time:</strong> {formatTime((Date.now() - uploadStartTime) / 1000)}
                        </Text>
                      )}
                    </HStack>
                    
                    {Object.values(uploadProgress).some(p => p.status === 'uploading' && p.speed > 0) && (
                      <Text>
                        <strong>Avg Speed:</strong> {formatSpeed(
                          Object.values(uploadProgress)
                            .filter(p => p.status === 'uploading' && p.speed > 0)
                            .reduce((sum, p) => sum + p.speed, 0) / 
                          Object.values(uploadProgress).filter(p => p.status === 'uploading' && p.speed > 0).length || 0
                        )}
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </Box>
            )}
          </VStack>

          <Divider />

          {/* Upload Actions */}
          <HStack spacing={4} justify="center">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={uploading}
            >
              Clear All
            </Button>
            
            <Button
              leftIcon={<ArrowUpIcon />}
              colorScheme="green"
              onClick={handleUploadAll}
              isLoading={uploading}
              loadingText="Uploading..."
              size="lg"
            >
              Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
            </Button>
          </HStack>
        </>
      )}
    </VStack>
  );
};

export default FileUploadWithPreview;