import requests
import sys
from datetime import datetime
import json

class CapeEmberAPITester:
    def __init__(self, base_url="https://axis-creator.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, passed, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED - {message}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "response": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            default_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                print(f"   Status: {response.status_code} ✓")
                try:
                    response_json = response.json()
                    self.log_result(name, True, f"Status {response.status_code}", response_json)
                    return True, response_json
                except:
                    self.log_result(name, True, f"Status {response.status_code}")
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                print(f"   Status: {response.status_code} ✗")
                print(f"   Error: {error_msg}")
                self.log_result(name, False, error_msg)
                return False, {}

        except requests.exceptions.Timeout:
            error_msg = "Request timeout (>10s)"
            print(f"   ⏱️  {error_msg}")
            self.log_result(name, False, error_msg)
            return False, {}
        except Exception as e:
            error_msg = str(e)
            print(f"   ❌ Exception: {error_msg}")
            self.log_result(name, False, error_msg)
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+27810000000"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   ✓ Token obtained: {self.token[:20]}...")
            print(f"   ✓ User ID: {self.user_id}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # Try to login with the registered user
        timestamp = datetime.now().strftime('%H%M%S')
        credentials = {
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=credentials
        )
        
        if success and 'access_token' in response:
            print(f"   ✓ Login successful")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        if not self.token:
            self.log_result("Get Current User", False, "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_products(self):
        """Test get all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} products")
            if len(response) == 5:
                print(f"   ✓ Expected 5 products (4 individual + 1 bundle)")
            else:
                print(f"   ⚠️  Expected 5 products, got {len(response)}")
            return True
        return False

    def test_get_product_detail(self):
        """Test get single product"""
        success, response = self.run_test(
            "Get Product Detail",
            "GET",
            "products/fynbos-roast",
            200
        )
        
        if success and 'name' in response:
            print(f"   ✓ Product: {response.get('name')}")
            print(f"   ✓ Price: R{response.get('price')}")
            return True
        return False

    def test_cart_operations(self):
        """Test cart operations"""
        if not self.token:
            self.log_result("Cart Operations", False, "No auth token available")
            return False
        
        # Get empty cart
        success, cart = self.run_test(
            "Get Empty Cart",
            "GET",
            "cart",
            200
        )
        
        if not success:
            return False
        
        # Add item to cart
        success, _ = self.run_test(
            "Add Item to Cart",
            "POST",
            "cart/add",
            200,
            data={"product_id": "fynbos-roast", "quantity": 2}
        )
        
        if not success:
            return False
        
        # Get cart with items
        success, cart = self.run_test(
            "Get Cart with Items",
            "GET",
            "cart",
            200
        )
        
        if success and cart.get('items'):
            print(f"   ✓ Cart has {len(cart['items'])} item(s)")
            print(f"   ✓ Subtotal: R{cart.get('subtotal', 0)}")
            print(f"   ✓ Shipping: R{cart.get('shipping', 0)}")
            print(f"   ✓ Total: R{cart.get('total', 0)}")
        
        # Update cart item
        success, _ = self.run_test(
            "Update Cart Item",
            "PUT",
            "cart/update",
            200,
            data={"product_id": "fynbos-roast", "quantity": 3}
        )
        
        if not success:
            return False
        
        # Remove item from cart
        success, _ = self.run_test(
            "Remove Item from Cart",
            "DELETE",
            "cart/remove/fynbos-roast",
            200
        )
        
        return success

    def test_order_creation(self):
        """Test order creation"""
        if not self.token:
            self.log_result("Order Creation", False, "No auth token available")
            return False
        
        # First add items to cart
        self.run_test(
            "Add Item for Order",
            "POST",
            "cart/add",
            200,
            data={"product_id": "garden-route", "quantity": 1}
        )
        
        # Create order
        order_data = {
            "shipping_address": {
                "street": "123 Test Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8001",
                "country": "South Africa"
            },
            "is_subscription": False,
            "subscription_frequency": None
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'order_id' in response:
            print(f"   ✓ Order ID: {response['order_id']}")
            print(f"   ✓ Total: R{response.get('total', 0)}")
            print(f"   ✓ Status: {response.get('status')}")
            if 'whatsapp_link' in response:
                print(f"   ✓ WhatsApp link generated")
            return response['order_id']
        return None

    def test_get_orders(self):
        """Test get user orders"""
        if not self.token:
            self.log_result("Get Orders", False, "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} order(s)")
            return True
        return False

    def test_payfast_payment(self, order_id):
        """Test PayFast payment creation"""
        if not self.token or not order_id:
            self.log_result("PayFast Payment", False, "No auth token or order ID")
            return False
        
        success, response = self.run_test(
            "Create PayFast Payment",
            "POST",
            "payfast/create-payment",
            200,
            data={"order_id": order_id}
        )
        
        if success and 'payfast_host' in response and 'fields' in response:
            print(f"   ✓ PayFast host: {response['payfast_host']}")
            print(f"   ✓ Payment fields generated")
            print(f"   ✓ Merchant ID: {response['fields'].get('merchant_id')}")
            return True
        return False

    def test_subscriptions(self):
        """Test subscription creation"""
        if not self.token:
            self.log_result("Subscriptions", False, "No auth token available")
            return False
        
        sub_data = {
            "product_id": "fynbos-roast",
            "quantity": 1,
            "frequency": "monthly",
            "shipping_address": {
                "street": "123 Test Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8001",
                "country": "South Africa"
            }
        }
        
        success, response = self.run_test(
            "Create Subscription",
            "POST",
            "subscriptions",
            200,
            data=sub_data
        )
        
        if success and 'subscription_id' in response:
            print(f"   ✓ Subscription ID: {response['subscription_id']}")
            print(f"   ✓ Next delivery: {response.get('next_delivery')}")
            
            # Get subscriptions
            success, subs = self.run_test(
                "Get Subscriptions",
                "GET",
                "subscriptions",
                200
            )
            
            if success and isinstance(subs, list):
                print(f"   ✓ Found {len(subs)} subscription(s)")
            
            return True
        return False

    def test_newsletter(self):
        """Test newsletter subscription"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Newsletter Subscription",
            "POST",
            f"newsletter/subscribe?email=newsletter_{timestamp}@test.com",
            200
        )
        return success

    def test_recommendations(self):
        """Test AI recommendations"""
        if not self.token:
            self.log_result("AI Recommendations", False, "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get AI Recommendations",
            "POST",
            "recommendations",
            200,
            data={"preferences": "I like smooth, balanced coffee"}
        )
        
        if success and 'recommendations' in response:
            print(f"   ✓ Recommendations: {response.get('recommendations')}")
            print(f"   ✓ Message: {response.get('message')}")
            return True
        return False

    def test_quick_recommendations(self):
        """Test quick recommendations (no auth)"""
        success, response = self.run_test(
            "Get Quick Recommendations",
            "GET",
            "recommendations/quick",
            200
        )
        
        if success and 'recommendations' in response:
            print(f"   ✓ Found {len(response['recommendations'])} recommendations")
            return True
        return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print("="*60)
        
        if self.tests_passed < self.tests_run:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return self.tests_passed == self.tests_run

def main():
    print("="*60)
    print("🧪 Cape Ember Coffee API Test Suite")
    print("="*60)
    
    tester = CapeEmberAPITester()
    
    # Run tests in order
    print("\n📋 BASIC TESTS")
    print("-"*60)
    tester.test_health()
    tester.test_get_products()
    tester.test_get_product_detail()
    tester.test_quick_recommendations()
    tester.test_newsletter()
    
    print("\n🔐 AUTHENTICATION TESTS")
    print("-"*60)
    if tester.test_register():
        tester.test_get_me()
    
    print("\n🛒 CART TESTS")
    print("-"*60)
    tester.test_cart_operations()
    
    print("\n📦 ORDER TESTS")
    print("-"*60)
    order_id = tester.test_order_creation()
    tester.test_get_orders()
    
    print("\n💳 PAYMENT TESTS")
    print("-"*60)
    if order_id:
        tester.test_payfast_payment(order_id)
    
    print("\n🔄 SUBSCRIPTION TESTS")
    print("-"*60)
    tester.test_subscriptions()
    
    print("\n🤖 AI RECOMMENDATION TESTS")
    print("-"*60)
    tester.test_recommendations()
    
    # Print summary
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
