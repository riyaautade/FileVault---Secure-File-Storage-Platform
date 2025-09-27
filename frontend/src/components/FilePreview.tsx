/**
 * @fileoverview FilePreview component for displaying file information and thumbnails
 * @description This component provides a visual preview of uploaded files, including
 * image thumbnails, file information, and action buttons for file management.
 */

import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  VStack,
  HStack,
  Badge,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { CloseIcon, DownloadIcon } from '@chakra-ui/icons';

/**
 * Props interface for the FilePreview component
 */
interface FilePreviewProps {
  /** The file object to preview */
  file: File;
  /** Optional callback function when the remove button is clicked */
  onRemove?: () => void;
  /** Whether to show the remove button (default: true) */
  showRemove?: boolean;
}

/**
 * FilePreview Component
 * 
 * Displays a preview card for a file with the following features:
 * - Image thumbnails for image files
 * - File type icons for non-image files
 * - File name, size, and type information
 * - Optional remove button
 * - Responsive design with color mode support
 * 
 * @param props - The component props
 * @returns JSX element representing the file preview
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  showRemove = true,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  /**
   * Formats file size from bytes to human-readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string (e.g., "1.5 MB")
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Returns an appropriate emoji icon for the given MIME type
   * @param mimeType - The MIME type of the file
   * @returns Emoji string representing the file type
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('video/')) return '🎥';
    if (mimeType.includes('audio/')) return '🎵';
    if (mimeType.includes('text/')) return '📋';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '📦';
    return '📁';
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'green';
    if (mimeType.includes('pdf')) return 'red';
    if (mimeType.includes('word')) return 'blue';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'green';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'orange';
    if (mimeType.includes('video/')) return 'purple';
    if (mimeType.includes('audio/')) return 'pink';
    return 'gray';
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      border="2px dashed"
      borderColor={borderColor}
      borderRadius="lg"
      position="relative"
      maxW="200px"
    >
      {showRemove && onRemove && (
        <IconButton
          icon={<CloseIcon />}
          size="sm"
          position="absolute"
          top={2}
          right={2}
          colorScheme="red"
          variant="solid"
          onClick={onRemove}
          aria-label="Remove file"
          zIndex={1}
        />
      )}

      <VStack spacing={3}>
        {/* Preview Area */}
        <Box width="100%" height="120px" display="flex" alignItems="center" justifyContent="center">
          {file.type.startsWith('image/') && previewUrl && !error ? (
            <Image
              src={previewUrl}
              alt={file.name}
              maxH="120px"
              maxW="100%"
              objectFit="contain"
              borderRadius="md"
              onError={() => setError(true)}
            />
          ) : (
            <Box textAlign="center">
              <Text fontSize="4xl" mb={2}>
                {getFileIcon(file.type)}
              </Text>
              <Badge colorScheme={getFileTypeColor(file.type)} fontSize="xs">
                {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
            </Box>
          )}
        </Box>

        {/* File Info */}
        <VStack spacing={1} width="100%">
          <Text
            fontSize="sm"
            fontWeight="medium"
            textAlign="center"
            noOfLines={2}
            title={file.name}
          >
            {file.name}
          </Text>
          
          <HStack spacing={2} justify="center">
            <Text fontSize="xs" color="gray.500">
              {formatFileSize(file.size)}
            </Text>
            {file.lastModified && (
              <Text fontSize="xs" color="gray.500">
                {new Date(file.lastModified).toLocaleDateString()}
              </Text>
            )}
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default FilePreview;