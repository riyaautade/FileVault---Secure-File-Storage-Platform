import { useEffect, useState } from 'react';
import { Box, VStack, Text, Badge, HStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { createClient } from 'graphql-ws';
import { useAuth } from '../utils/AuthContext';

interface ActivityEvent {
  id: string;
  type: string;
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

const ACTIVITY_SUBSCRIPTION = `
  subscription {
    activityFeed {
      id
      type
      userId
      userName
      description
      timestamp
      metadata
    }
  }
`;

export const RealTimeActivity = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const client = createClient({
      url: 'ws://localhost:8080/graphql',
      connectionParams: {
        Authorization: `Bearer ${token}`,
      },
    });

    setIsConnected(true);
    setError(null);

    const subscription = client.subscribe(
      { query: ACTIVITY_SUBSCRIPTION },
      {
        next: (data: any) => {
          if (data.data?.activityFeed) {
            setActivities(prev => [data.data.activityFeed, ...prev.slice(0, 19)]); // Keep last 20 activities
          }
        },
        error: (err) => {
          console.error('Subscription error:', err);
          setError('Failed to connect to real-time updates');
          setIsConnected(false);
        },
        complete: () => {
          setIsConnected(false);
        },
      }
    );

    return () => {
      subscription();
      setIsConnected(false);
    };
  }, [token]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'FILE_UPLOADED': return 'green';
      case 'FILE_DELETED': return 'red';
      case 'FILE_SHARED': return 'blue';
      case 'FOLDER_CREATED': return 'purple';
      case 'FOLDER_UPDATED': return 'orange';
      default: return 'gray';
    }
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box p={4} bg="white" borderRadius="lg" shadow="sm" border="1px" borderColor="gray.200">
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="semibold">Real-Time Activity</Text>
          <HStack>
            {isConnected ? (
              <>
                <Spinner size="sm" color="green.500" />
                <Badge colorScheme="green">Live</Badge>
              </>
            ) : (
              <Badge colorScheme="red">Disconnected</Badge>
            )}
          </HStack>
        </HStack>

        {error && (
          <Alert status="error" size="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <VStack align="stretch" spacing={2} maxHeight="400px" overflowY="auto">
          {activities.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={4}>
              No recent activity
            </Text>
          ) : (
            activities.map((activity) => (
              <Box
                key={activity.id}
                p={3}
                bg="gray.50"
                borderRadius="md"
                border="1px"
                borderColor="gray.200"
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Badge colorScheme={getEventColor(activity.type)}>
                        {formatEventType(activity.type)}
                      </Badge>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </Text>
                    </HStack>
                    <Text fontSize="sm">{activity.description}</Text>
                  </VStack>
                </HStack>
              </Box>
            ))
          )}
        </VStack>
      </VStack>
    </Box>
  );
};