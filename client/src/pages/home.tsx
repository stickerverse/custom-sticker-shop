import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ProductCard from "@/components/product/ProductCard";

const Home = () => {
  // Fetch featured products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["/api/products"],
  });

  // Example hero images (using external images)
  const heroImage = "https://images.unsplash.com/photo-1585914641050-fa9883c4e21c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80";
  
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 opacity-60 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
          <img
            src={heroImage}
            alt="Custom Stickers"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Custom Stickers for All Your Creative Needs
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Design, customize, and order high-quality stickers with real-time seller communication
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop">
                <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg rounded-md">
                  Shop Now
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-lg rounded-md">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Featured Stickers</h2>
          <p className="text-gray-600">Discover our most popular custom sticker designs</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Error loading products. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.slice(0, 4).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/shop">
            <Button variant="outline" className="px-8 py-2">
              Browse All Stickers
            </Button>
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-gray-600">Our simple process for creating your custom stickers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-3xl">shopping_cart</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Choose & Customize</h3>
              <p className="text-gray-600">
                Select your sticker design and customize size, material, and quantity to suit your needs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-3xl">chat</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Approve Design</h3>
              <p className="text-gray-600">
                After ordering, communicate directly with the seller to review and approve your final design.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-3xl">local_shipping</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Receive Your Stickers</h3>
              <p className="text-gray-600">
                We'll produce and ship your high-quality custom stickers directly to your door.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Why Choose StickerChat</h2>
          <p className="text-gray-600">The best place for custom stickers and direct seller communication</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4">
            <span className="material-icons text-primary text-3xl mb-3">high_quality</span>
            <h3 className="text-lg font-semibold mb-2">Premium Quality</h3>
            <p className="text-gray-600">
              Durable, waterproof materials that last for years without fading
            </p>
          </div>

          <div className="text-center p-4">
            <span className="material-icons text-primary text-3xl mb-3">support_agent</span>
            <h3 className="text-lg font-semibold mb-2">Direct Communication</h3>
            <p className="text-gray-600">
              Real-time chat with designers for perfect custom stickers
            </p>
          </div>

          <div className="text-center p-4">
            <span className="material-icons text-primary text-3xl mb-3">local_shipping</span>
            <h3 className="text-lg font-semibold mb-2">Fast Shipping</h3>
            <p className="text-gray-600">
              Quick production and shipping with order tracking
            </p>
          </div>

          <div className="text-center p-4">
            <span className="material-icons text-primary text-3xl mb-3">verified</span>
            <h3 className="text-lg font-semibold mb-2">Satisfaction Guaranteed</h3>
            <p className="text-gray-600">
              100% satisfaction guarantee with our easy return policy
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Custom Stickers?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start designing your perfect custom stickers today and experience our seamless communication system.
          </p>
          <Link href="/shop">
            <Button className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg rounded-md">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">About StickerChat</h2>
            <p className="text-gray-600">Our story and mission</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p>
              StickerChat was created to solve a common problem in the custom sticker industry: 
              poor communication between buyers and sellers. We combine high-quality sticker 
              production with a seamless real-time chat system that makes customization easy.
            </p>
            <p>
              Our platform brings together the best of e-commerce and direct messaging, 
              allowing for perfect custom designs every time. Whether you're ordering 
              stickers for your business, personal projects, or gifts, our integrated 
              system ensures you get exactly what you envision.
            </p>
            <p>
              We pride ourselves on premium materials, exceptional print quality, and 
              outstanding customer service. Every sticker is produced with care and 
              attention to detail, backed by our satisfaction guarantee.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Contact Us</h2>
              <p className="text-gray-600">Get in touch with our team</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="material-icons text-primary mr-3">email</span>
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">support@stickerchat.com</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="material-icons text-primary mr-3">phone</span>
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-600">(123) 456-7890</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="material-icons text-primary mr-3">schedule</span>
                      <div>
                        <p className="font-medium">Business Hours</p>
                        <p className="text-gray-600">Monday - Friday: 9AM - 6PM EST</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Send a Message</h3>
                  <p className="text-gray-600 mb-4">
                    Have questions or need help? Send us a message and we'll respond as soon as possible.
                  </p>
                  <Link href="/shop">
                    <Button className="w-full bg-primary text-white hover:bg-primary/90">
                      Contact Customer Service
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">StickerChat</h3>
              <p className="text-gray-400">
                Custom stickers with real-time seller communication
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="material-icons">facebook</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="material-icons">alternate_email</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="material-icons">photo_camera</span>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Shop</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/shop" className="hover:text-white">All Products</Link></li>
                <li><Link href="/shop" className="hover:text-white">New Arrivals</Link></li>
                <li><Link href="/shop" className="hover:text-white">Best Sellers</Link></li>
                <li><Link href="/shop" className="hover:text-white">Custom Designs</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">FAQs</a></li>
                <li><a href="#" className="hover:text-white">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-white">Returns & Refunds</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} StickerChat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
