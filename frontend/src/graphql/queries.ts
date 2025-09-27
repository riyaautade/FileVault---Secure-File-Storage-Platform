import { gql } from '@apollo/client';

// Auth Mutations
export const SIGNUP_MUTATION = gql`
  mutation Signup($input: CreateUserInput!) {
    signup(input: $input) {
      token
      user {
        id
        email
        name
        role
        storageUsed
        storageQuota
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        role
        storageUsed
        storageQuota
      }
    }
  }
`;

// File Mutations
export const UPLOAD_FILE_MUTATION = gql`
  mutation UploadFile($file: Upload!, $folderId: ID, $isPublic: Boolean) {
    uploadFile(file: $file, folderId: $folderId, isPublic: $isPublic) {
      id
      name
      contentHash
      size
      mimeType
      isPublic
      downloadCount
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

export const DELETE_FILE_MUTATION = gql`
  mutation DeleteFile($id: ID!) {
    deleteFile(id: $id)
  }
`;

// Folder Mutations
export const CREATE_FOLDER_MUTATION = gql`
  mutation CreateFolder($input: CreateFolderInput!) {
    createFolder(input: $input) {
      id
      name
      isPublic
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

// Queries
export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
      storageUsed
      storageQuota
      createdAt
    }
  }
`;

export const FILES_QUERY = gql`
  query Files($filter: FileFilter, $first: Int, $after: String) {
    files(filter: $filter, first: $first, after: $after) {
      id
      name
      contentHash
      size
      mimeType
      isPublic
      downloadCount
      createdAt
      updatedAt
      owner {
        id
        name
        email
      }
      folder {
        id
        name
      }
    }
  }
`;

export const FOLDERS_QUERY = gql`
  query Folders {
    folders {
      id
      name
      isPublic
      createdAt
      updatedAt
      owner {
        id
        name
      }
      parent {
        id
        name
      }
    }
  }
`;

export const FOLDER_FILES_QUERY = gql`
  query FolderFiles($folderId: ID!) {
    folder(id: $folderId) {
      id
      name
      files {
        id
        name
        contentHash
        size
        mimeType
        isPublic
        downloadCount
        createdAt
        updatedAt
        owner {
          id
          name
          email
        }
        folder {
          id
          name
        }
      }
    }
  }
`;

export const STORAGE_STATS_QUERY = gql`
  query StorageStats {
    storageStats {
      totalStorage
      originalStorage
      savedStorage
      savingsPercentage
    }
  }
`;

export const UPDATE_FOLDER_MUTATION = gql`
  mutation UpdateFolder($id: ID!, $input: UpdateFolderInput!) {
    updateFolder(id: $id, input: $input) {
      id
      name
      isPublic
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