import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";

const Checkout = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { cart, clearCart } = useCart();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phoneNumber: "",
    paymentMethod: "credit-card",
    saveInfo: true,
  });
  
  // Payment details state
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Calculate totals
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = 499; // Base price: $4.99
      return sum + itemPrice * item.quantity;
    }, 0);
  };
  
  const subtotal = calculateSubtotal();
  const shippingCost = subtotal > 3500 ? 0 : 500; // Free shipping over $35
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + shippingCost + tax;
  
  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Place order mutation
  const placedOrderMutation = useMutation({
    mutationFn: async () => {
      // Create shipping address string
      const shippingAddress = `${formData.firstName} ${formData.lastName}\n${formData.address}\n${formData.city}, ${formData.state} ${formData.zipCode}\n${formData.country}`;
      
      // Submit order
      return apiRequest("POST", "/api/orders", {
        shippingAddress,
        total
      });
    },
    onSuccess: () => {
      // Clear cart
      clearCart();
      
      // Redirect to success page
      setLocation("/?orderSuccess=true");
      
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been placed and a chat room has been created for you to communicate with the seller.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Could not place your order",
        variant: "destructive",
      });
    }
  });
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };
  
  // Handle payment details change
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails({
      ...paymentDetails,
      [name]: value,
    });
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate contact information
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipCode) newErrors.zipCode = "ZIP code is required";
    if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required";
    
    // Validate payment details for credit card
    if (formData.paymentMethod === "credit-card") {
      if (!paymentDetails.cardNumber) newErrors.cardNumber = "Card number is required";
      if (!paymentDetails.cardName) newErrors.cardName = "Name on card is required";
      if (!paymentDetails.expiryDate) newErrors.expiryDate = "Expiry date is required";
      if (!paymentDetails.cvv) newErrors.cvv = "CVV is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to place an order",
        variant: "default",
      });
      return;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty",
        variant: "default",
      });
      setLocation("/shop");
      return;
    }
    
    if (validateForm()) {
      placedOrderMutation.mutate();
    } else {
      toast({
        title: "Form Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };
  
  // If not authenticated, redirect to home
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In to Continue</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access the checkout page.</p>
          <Button 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => setLocation("/")}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  // If cart is empty, redirect to shop
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before proceeding to checkout.</p>
          <Button 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => setLocation("/shop")}
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Checkout Form */}
            <div className="lg:w-2/3">
              <form onSubmit={handleSubmit}>
                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="block mb-1">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName" className="block mb-1">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="block mb-1">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phoneNumber" className="block mb-1">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={errors.phoneNumber ? "border-red-500" : ""}
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Shipping Address */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="block mb-1">Street Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={errors.address ? "border-red-500" : ""}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="block mb-1">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={errors.city ? "border-red-500" : ""}
                        />
                        {errors.city && (
                          <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="state" className="block mb-1">State/Province *</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={errors.state ? "border-red-500" : ""}
                        />
                        {errors.state && (
                          <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode" className="block mb-1">ZIP/Postal Code *</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className={errors.zipCode ? "border-red-500" : ""}
                        />
                        {errors.zipCode && (
                          <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="country" className="block mb-1">Country *</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox
                        id="saveInfo"
                        checked={formData.saveInfo}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, saveInfo: checked as boolean })
                        }
                      />
                      <Label htmlFor="saveInfo" className="ml-2 cursor-pointer">
                        Save this information for next time
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                  
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => 
                      setFormData({ ...formData, paymentMethod: value })
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="credit-card" id="credit-card" />
                      <Label htmlFor="credit-card" className="cursor-pointer flex items-center">
                        <span className="material-icons mr-2">credit_card</span>
                        Credit / Debit Card
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paypal" id="paypal" disabled />
                      <Label htmlFor="paypal" className="cursor-pointer flex items-center text-gray-500">
                        <span className="material-icons mr-2">account_balance_wallet</span>
                        PayPal (Coming Soon)
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {formData.paymentMethod === "credit-card" && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="cardNumber" className="block mb-1">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentDetails.cardNumber}
                          onChange={handlePaymentChange}
                          className={errors.cardNumber ? "border-red-500" : ""}
                        />
                        {errors.cardNumber && (
                          <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="cardName" className="block mb-1">Name on Card *</Label>
                        <Input
                          id="cardName"
                          name="cardName"
                          value={paymentDetails.cardName}
                          onChange={handlePaymentChange}
                          className={errors.cardName ? "border-red-500" : ""}
                        />
                        {errors.cardName && (
                          <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate" className="block mb-1">Expiry Date *</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={paymentDetails.expiryDate}
                            onChange={handlePaymentChange}
                            className={errors.expiryDate ? "border-red-500" : ""}
                          />
                          {errors.expiryDate && (
                            <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="cvv" className="block mb-1">CVV *</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            placeholder="123"
                            value={paymentDetails.cvv}
                            onChange={handlePaymentChange}
                            className={errors.cvv ? "border-red-500" : ""}
                          />
                          {errors.cvv && (
                            <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base"
                  disabled={placedOrderMutation.isPending}
                >
                  {placedOrderMutation.isPending ? "Processing..." : `Pay ${formatPrice(total)}`}
                </Button>
              </form>
            </div>
            
            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                
                <div className="max-h-64 overflow-y-auto mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center py-3 border-b border-gray-100">
                      <div className="w-16 h-16 rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h3 className="text-sm font-medium">{item.product.title}</h3>
                        <p className="text-xs text-gray-500">
                          {Object.entries(item.options)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        </p>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-sm font-medium">{formatPrice(499 * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2 my-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-base pt-4">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                
                <div className="mt-6 text-xs text-gray-500 space-y-1">
                  <p>By placing your order, you agree to our Terms of Service and Privacy Policy.</p>
                  <p>We'll email you order confirmation and updates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
