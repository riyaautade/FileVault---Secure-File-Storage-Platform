import { gql } from '@apollo/client';

export const ANALYTICS_SUMMARY_QUERY = gql`
  query AnalyticsSummary($days: Int) {
    analyticsSummary(days: $days) {
      uploadTrends {
        date
        count
        size
      }
      userActivity {
        userId
        userName
        userEmail
        fileCount
        totalSize
        lastActivity
        sharingCount
      }
      fileTypeStats {
        mimeType
        count
        totalSize
        percentage
      }
      sharingStats {
        totalShares
        publicFiles
        publicFolders
        userShares
        mostSharedFiles {
          id
          name
          downloadCount
          size
        }
        mostSharedFolders {
          id
          name
        }
      }
      storageStats {
        totalStorage
        originalStorage
        savedStorage
        savingsPercentage
      }
    }
  }
`;

export const UPLOAD_TRENDS_QUERY = gql`
  query UploadTrends($days: Int) {
    uploadTrends(days: $days) {
      date
      count
      size
    }
  }
`;

export const USER_ACTIVITY_QUERY = gql`
  query UserActivity {
    userActivity {
      userId
      userName
      userEmail
      fileCount
      totalSize
      lastActivity
      sharingCount
    }
  }
`;

export const FILE_TYPE_STATS_QUERY = gql`
  query FileTypeStats {
    fileTypeStats {
      mimeType
      count
      totalSize
      percentage
    }
  }
`;

export const SHARING_STATS_QUERY = gql`
  query SharingStats {
    sharingStats {
      totalShares
      publicFiles
      publicFolders
      userShares
      mostSharedFiles {
        id
        name
        downloadCount
        size
      }
      mostSharedFolders {
        id
        name
      }
    }
  }
`;