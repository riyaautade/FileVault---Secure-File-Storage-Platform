import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { LOGIN_MUTATION, SIGNUP_MUTATION } from '../graphql/queries';
import { useAuth } from '../utils/AuthContext';

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [signupMutation, { loading: signupLoading }] = useMutation(SIGNUP_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignup) {
        const { data } = await signupMutation({
          variables: {
            input: {
              email: formData.email,
              password: formData.password,
              name: formData.name,
            },
          },
        });
        
        if (data?.signup) {
          login(data.signup.token, data.signup.user);
          toast({
            title: 'Account created successfully!',
            status: 'success',
            duration: 3000,
          });
          navigate('/');
        }
      } else {
        const { data } = await loginMutation({
          variables: {
            email: formData.email,
            password: formData.password,
          },
        });
        
        if (data?.login) {
          login(data.login.token, data.login.user);
          toast({
            title: 'Logged in successfully!',
            status: 'success',
            duration: 3000,
          });
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Authentication failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Container maxW="md" py={20}>
      <Card>
        <CardHeader>
          <VStack spacing={4}>
            <Heading size="lg" bgGradient="linear(to-r, brand.400, brand.600)" bgClip="text">
              FileVault
            </Heading>
            <Text color="gray.500">
              {isSignup ? 'Create your account' : 'Sign in to your account'}
            </Text>
          </VStack>
        </CardHeader>
        
        <CardBody>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {isSignup && (
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </FormControl>
              )}
              
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                />
              </FormControl>
              
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                isLoading={loginLoading || signupLoading}
                loadingText={isSignup ? 'Creating account...' : 'Signing in...'}
              >
                {isSignup ? 'Create Account' : 'Sign In'}
              </Button>
              
              <Divider />
              
              <HStack justify="center">
                <Text color="gray.500">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <Button
                  variant="link"
                  colorScheme="brand"
                  onClick={() => setIsSignup(!isSignup)}
                >
                  {isSignup ? 'Sign In' : 'Sign Up'}
                </Button>
              </HStack>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
};

export default LoginPage;