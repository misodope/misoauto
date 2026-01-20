# Auth Hooks Usage Guide

This directory contains React hooks for authentication using React Query (TanStack Query).

## Available Hooks

### `useRegister`

Hook for user registration.

```tsx
import { useRegister } from '@/app/hooks';

const RegisterComponent = () => {
  const { mutate: register, isPending, error } = useRegister();

  const handleRegister = (formData: {
    email: string;
    password: string;
    name: string;
  }) => {
    register(formData, {
      onSuccess: (data) => {
        console.log('Registration successful:', data.message);
        // Handle successful registration (e.g., redirect, show success message)
      },
      onError: (error) => {
        console.error('Registration failed:', error.response?.data?.message);
        // Handle registration error (e.g., show error message)
      },
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        handleRegister({
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          name: formData.get('name') as string,
        });
      }}
    >
      <input name="name" type="text" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Registering...' : 'Register'}
      </button>
      {error && (
        <div className="error">
          {error.response?.data?.message || 'Registration failed'}
        </div>
      )}
    </form>
  );
};
```

### `useLogin`

Hook for user authentication.

```tsx
import { useLogin } from '@/app/hooks';
import { useRouter } from 'next/navigation';

const LoginComponent = () => {
  const router = useRouter();
  const { mutate: login, isPending, error } = useLogin();

  const handleLogin = (formData: { email: string; password: string }) => {
    login(formData, {
      onSuccess: (data) => {
        console.log('Login successful');
        // Token is automatically stored in cookies
        router.push('/dashboard'); // Redirect to dashboard
      },
      onError: (error) => {
        console.error('Login failed:', error.response?.data?.message);
        // Handle login error
      },
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        handleLogin({
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        });
      }}
    >
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
      {error && (
        <div className="error">
          {error.response?.data?.message || 'Login failed'}
        </div>
      )}
    </form>
  );
};
```

### `useLogout`

Hook for user logout.

```tsx
import { useLogout } from '@/app/hooks';
import { useRouter } from 'next/navigation';

const LogoutButton = () => {
  const router = useRouter();
  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
    router.push('/login'); // Redirect to login page
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

### `useAuthStatus`

Hook for checking authentication status.

```tsx
import { useAuthStatus } from '@/app/hooks';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedComponent = () => {
  const { isAuthenticated, getToken } = useAuthStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>You are authenticated!</p>
      <p>Token: {getToken()?.substring(0, 20)}...</p>
    </div>
  );
};
```

## Complete Example: Login/Register Form

```tsx
'use client';

import { useState } from 'react';
import { useLogin, useRegister } from '@/app/hooks';
import { useRouter } from 'next/navigation';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const {
    mutate: login,
    isPending: isLoggingIn,
    error: loginError,
  } = useLogin();
  const {
    mutate: register,
    isPending: isRegistering,
    error: registerError,
  } = useRegister();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const authData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      ...(isLogin ? {} : { name: formData.get('name') as string }),
    };

    if (isLogin) {
      login(authData, {
        onSuccess: () => {
          router.push('/dashboard');
        },
      });
    } else {
      register(authData, {
        onSuccess: () => {
          // Auto-login after successful registration
          login(
            { email: authData.email, password: authData.password },
            {
              onSuccess: () => {
                router.push('/dashboard');
              },
            },
          );
        },
      });
    }
  };

  const currentError = isLogin ? loginError : registerError;
  const isPending = isLoggingIn || isRegistering;

  return (
    <div className="auth-form">
      <h1>{isLogin ? 'Login' : 'Register'}</h1>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            required={!isLogin}
          />
        )}

        <input name="email" type="email" placeholder="Email" required />

        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />

        <button type="submit" disabled={isPending}>
          {isPending
            ? isLogin
              ? 'Logging in...'
              : 'Registering...'
            : isLogin
              ? 'Login'
              : 'Register'}
        </button>
      </form>

      {currentError && (
        <div className="error">
          {currentError.response?.data?.message || 'Authentication failed'}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsLogin(!isLogin)}
        className="toggle-mode"
      >
        {isLogin
          ? "Don't have an account? Register"
          : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default AuthForm;
```

## Environment Variables

Make sure to set the following environment variable in your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Features

- **TypeScript Support**: Full type safety with TypeScript interfaces
- **React Query Integration**: Built on TanStack Query for optimal data fetching
- **Automatic Token Management**: JWT tokens stored securely in cookies
- **Error Handling**: Comprehensive error handling with proper types
- **Auto-redirect**: Automatic redirect to login on 401 errors
- **Loading States**: Built-in loading states with React Query
- **Cookie Security**: Secure cookie settings for production
