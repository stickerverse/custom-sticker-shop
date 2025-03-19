import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useChat } from "@/hooks/use-chat";

const Navbar = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({ username: "", password: "", email: "", displayName: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(loginData.username, loginData.password);
      setIsLoginModalOpen(false);
      toast({
        title: "Login Successful",
        description: "Welcome back to The StickerVerse!",
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement signup functionality
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
      setIsSignupModalOpen(false);
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center">
              <span className="material-icons text-primary mr-1 text-2xl">auto_awesome</span>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 via-purple-500 to-teal-500 text-transparent bg-clip-text">The StickerVerse</span>
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/shop" className="text-gray-600 hover:text-primary font-medium">Shop</Link>
              <Link href="/customizer" className="text-gray-600 hover:text-primary font-medium">Custom Stickers</Link>
              <Link href="/#about" className="text-gray-600 hover:text-primary font-medium">FAQ</Link>
              <Link href="/#contact" className="text-gray-600 hover:text-primary font-medium">Contact</Link>
            </div>
          </div>
          
          <div className="relative hidden md:block w-1/3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search stickers..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2.5">
                <span className="material-icons text-gray-500 text-sm">search</span>
              </button>
            </form>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="md:hidden">
              <span className="material-icons">search</span>
            </button>
            
            <Link href="/cart" className="relative">
              <span className="material-icons">shopping_cart</span>
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0">
                  {cart.length}
                </Badge>
              )}
            </Link>
            
            {isAuthenticated ? (
              <Link href="/chat" className="relative">
                <span className="material-icons">chat</span>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            ) : null}
            
            <Sheet>
              <SheetTrigger className="md:hidden">
                <span className="material-icons">menu</span>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>The StickerVerse</SheetTitle>
                  <SheetDescription>
                    Custom stickers and direct communication
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 flex flex-col space-y-3">
                  <Link href="/shop" className="block p-2 hover:bg-gray-100 rounded">
                    Shop
                  </Link>
                  <Link href="/customizer" className="block p-2 hover:bg-gray-100 rounded">
                    Create Your Own
                  </Link>
                  <Link href="/#about" className="block p-2 hover:bg-gray-100 rounded">
                    About
                  </Link>
                  <Link href="/#contact" className="block p-2 hover:bg-gray-100 rounded">
                    Contact
                  </Link>
                  {isAuthenticated ? (
                    <>
                      <Link href="/chat" className="block p-2 hover:bg-gray-100 rounded">
                        Messages
                      </Link>
                      {user?.isAdmin && (
                        <Link href="/admin" className="block p-2 hover:bg-gray-100 rounded">
                          Admin Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left p-2 hover:bg-gray-100 rounded"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsLoginModalOpen(true)}
                        className="block w-full text-left p-2 hover:bg-gray-100 rounded"
                      >
                        Login
                      </button>
                      <button 
                        onClick={() => setIsSignupModalOpen(true)}
                        className="block w-full text-left p-2 hover:bg-gray-100 rounded"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link href="/account" className="text-gray-600 hover:text-primary transition-colors">
                    <div className="flex items-center">
                      <span className="material-icons mr-1 text-primary">person</span>
                      <span className="text-sm font-medium">My Account</span>
                    </div>
                  </Link>
                  {user?.isAdmin && (
                    <Link href="/admin" className="text-gray-600 hover:text-primary transition-colors">
                      <div className="flex items-center">
                        <span className="material-icons mr-1 text-primary">admin_panel_settings</span>
                        <span className="text-sm font-medium">Admin</span>
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-primary transition-colors flex items-center"
                  >
                    <span className="material-icons mr-1">logout</span>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-gray-600 hover:text-primary transition-colors flex items-center"
                  >
                    <span className="material-icons mr-1">login</span>
                    <span className="text-sm font-medium">Login</span>
                  </button>
                  <Button 
                    className="bg-primary text-white hover:bg-primary/90 px-4 py-2 text-sm rounded-md font-medium"
                    onClick={() => setIsSignupModalOpen(true)}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <Sheet open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Login to Your Account</SheetTitle>
            <SheetDescription>
              Enter your credentials to access your account
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-white"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setIsSignupModalOpen(true);
                }}
              >
                Sign up
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      
      {/* Signup Modal */}
      <Sheet open={isSignupModalOpen} onOpenChange={setIsSignupModalOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create an Account</SheetTitle>
            <SheetDescription>
              Join The StickerVerse to start shopping and customizing
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSignup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="signup-username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="signup-username"
                type="text"
                placeholder="Choose a username"
                value={signupData.username}
                onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm font-medium">
                Display Name
              </label>
              <Input
                id="display-name"
                type="text"
                placeholder="How should we call you?"
                value={signupData.displayName}
                onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a strong password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm">
              <span>Already have an account? </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setIsSignupModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
              >
                Login
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around">
          <Link href="/shop" className="p-3 text-center">
            <span className={`material-icons ${location === '/shop' ? 'text-primary' : 'text-gray-500'}`}>store</span>
            <span className="block text-xs mt-1">Shop</span>
          </Link>
          <Link href="/customizer" className="p-3 text-center">
            <span className={`material-icons ${location === '/customizer' ? 'text-primary' : 'text-gray-500'}`}>add_photo_alternate</span>
            <span className="block text-xs mt-1">Create</span>
          </Link>
          <Link href="/chat" className="p-3 text-center">
            <span className={`material-icons ${location === '/chat' ? 'text-primary' : 'text-gray-500'}`}>chat</span>
            <span className="block text-xs mt-1">Messages</span>
            {unreadCount > 0 && (
              <Badge className="absolute top-2 right-[calc(50%-10px)] bg-secondary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center p-0">
                {unreadCount}
              </Badge>
            )}
          </Link>
          <Link href="/cart" className="p-3 text-center">
            <span className={`material-icons ${location === '/cart' ? 'text-primary' : 'text-gray-500'}`}>shopping_cart</span>
            <span className="block text-xs mt-1">Cart</span>
            {cart.length > 0 && (
              <Badge className="absolute top-2 right-[calc(50%-10px)] bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center p-0">
                {cart.length}
              </Badge>
            )}
          </Link>
          <Link href={isAuthenticated ? "/account" : "/login"} className="p-3 text-center">
            <span className="material-icons text-gray-500">person</span>
            <span className="block text-xs mt-1">Account</span>
          </Link>
        </div>
      </div>
      
      {/* Mobile Search (Hidden) */}
      <div className="hidden">
        <form onSubmit={handleSearch}>
          <Input
            id="mobile-search"
            type="text"
            placeholder="Search stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
