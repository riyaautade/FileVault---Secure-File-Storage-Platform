import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe', 
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    pastel: {
      pink: '#fdf2f8',
      purple: '#faf5ff',
      blue: '#f0f9ff',
      green: '#f0fdf4',
      yellow: '#fefce8',
      orange: '#fff7ed',
    },
    dark: {
      bg: '#0f0f23',
      surface: '#1a1a2e',
      card: '#16213e',
      border: '#2a2a3e',
      text: '#e4e4e7',
      textSecondary: '#a1a1aa',
    }
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'dark.bg' : 'gray.50',
        color: props.colorMode === 'dark' ? 'dark.text' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        gradient: {
          bg: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          _hover: {
            bg: 'linear-gradient(45deg, #5a67d8 0%, #6b46c1 100%)',
            transform: 'translateY(-2px)',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        pastel: {
          bg: 'pastel.blue',
          color: 'gray.800',
          border: '2px solid',
          borderColor: 'brand.200',
          _hover: {
            bg: 'brand.50',
            borderColor: 'brand.300',
          },
        },
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'dark.card' : 'white',
          borderColor: props.colorMode === 'dark' ? 'dark.border' : 'gray.200',
          borderRadius: 'xl',
          boxShadow: props.colorMode === 'dark' 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
  },
});

export default theme;