import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Button,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  IconButton,
  Spacer,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Box
      bg={colorMode === 'dark' ? 'dark.surface' : 'white'}
      px={4}
      py={3}
      borderBottom="1px"
      borderColor={colorMode === 'dark' ? 'dark.border' : 'gray.200'}
      position="sticky"
      top={0}
      zIndex={10}
      backdropFilter="blur(10px)"
    >
      <Flex align="center">
        <HStack spacing={8}>
          <Text
            fontSize="xl"
            fontWeight="bold"
            bgGradient="linear(to-r, brand.400, brand.600)"
            bgClip="text"
            cursor="pointer"
            onClick={() => navigate('/')}
          >
            FileVault
          </Text>
          
          <HStack spacing={4}>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              _hover={{ bg: colorMode === 'dark' ? 'dark.border' : 'gray.100' }}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/files')}
              _hover={{ bg: colorMode === 'dark' ? 'dark.border' : 'gray.100' }}
            >
              Files
            </Button>
            {user.role === 'admin' && (
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                _hover={{ bg: colorMode === 'dark' ? 'dark.border' : 'gray.100' }}
              >
                Admin
              </Button>
            )}
          </HStack>
        </HStack>
        
        <Spacer />
        
        <HStack spacing={4}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />
          
          <Menu>
            <MenuButton>
              <HStack>
                <Avatar size="sm" name={user.name} />
                <Text fontSize="sm" fontWeight="medium">
                  {user.name}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;