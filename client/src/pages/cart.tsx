import ShoppingCart from "@/components/cart/ShoppingCart";

const Cart = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 max-w-4xl mx-auto">
          <ShoppingCart />
        </div>
      </div>
    </div>
  );
};

export default Cart;
