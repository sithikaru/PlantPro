'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Leaf, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Leaf className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 font-['Inter'] tracking-tight mb-3">
            Welcome to PlantPro
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Plantation Management System
          </p>
        </div>

        <Card className="border-0 shadow-xl rounded-3xl bg-white">
          <CardHeader className="text-center pb-6 pt-8">
            <CardTitle className="text-2xl font-bold text-gray-900 font-['Inter'] tracking-tight">
              Sign in to your account
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-2xl">
                  <div className="font-medium">{error}</div>
                </div>
              )}
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 font-medium"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 font-medium"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 mt-8"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
            
            {/* Demo Accounts */}
            <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
              <p className="text-sm font-medium text-gray-700 text-center mb-4">
                Demo accounts for testing:
              </p>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 text-sm">Manager:</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">admin@plantpro.com / admin123</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 text-sm">Field Staff:</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">field@plantpro.com / admin123</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 text-sm">Analytics:</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">analytics@plantpro.com / admin123</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
