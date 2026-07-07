"""
Cape Ember Coffee Co. - Production E-commerce Backend
Enterprise-grade e-commerce platform with PayFast & Stitch Payments
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query, BackgroundTasks, Header
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import hmac
import hashlib
import base64
import re
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone, timedelta
import urllib.parse
import httpx
import jwt
import bcrypt
from enum import Enum
from decimal import Decimal

ROOT_DIR = Path(__file__).parent
APP_DIR = ROOT_DIR.parent
load_dotenv(ROOT_DIR / '.env')

# ============ CONFIGURATION ============

# MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'cape_ember_coffee')

# JWT
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
REFRESH_TOKEN_DAYS = 30

# PayFast
PAYFAST_MERCHANT_ID = os.environ.get('PAYFAST_MERCHANT_ID', '10000100')
PAYFAST_MERCHANT_KEY = os.environ.get('PAYFAST_MERCHANT_KEY', '46f0cd694581a')
PAYFAST_PASSPHRASE = os.environ.get('PAYFAST_PASSPHRASE', '')
PAYFAST_SANDBOX = os.environ.get('PAYFAST_SANDBOX', 'false').lower() == 'true'

# Stitch Payments
STITCH_CLIENT_ID = os.environ.get('STITCH_CLIENT_ID', '')
STITCH_CLIENT_SECRET = os.environ.get('STITCH_CLIENT_SECRET', '')
STITCH_WEBHOOK_SECRET = os.environ.get('STITCH_WEBHOOK_SECRET', '')
STITCH_SANDBOX = os.environ.get('STITCH_SANDBOX', 'true').lower() == 'true'

# Email (placeholder for SendGrid/Resend)
EMAIL_API_KEY = os.environ.get('EMAIL_API_KEY', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'orders@capeembercoffee.co.za')

# URLs
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://axis-creator.preview.emergentagent.com')
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://axis-creator.preview.emergentagent.com')

# VAT Rate (South Africa)
VAT_RATE = 0.15

# MongoDB Connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# App Setup
app = FastAPI(
    title="Cape Ember Coffee API",
    description="Production E-commerce API",
    version="2.0.0"
)

api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============ ENUMS ============

class OrderStatus(str, Enum):
    PENDING = "pending"
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentMethod(str, Enum):
    PAYFAST = "payfast"
    STITCH_CARD = "stitch_card"
    STITCH_EFT = "stitch_eft"
    STITCH_APPLE_PAY = "stitch_apple_pay"
    STITCH_GOOGLE_PAY = "stitch_google_pay"

class ProductCategory(str, Enum):
    COFFEE_BEANS = "coffee_beans"
    GROUND_COFFEE = "ground_coffee"
    GIFT_BOXES = "gift_boxes"
    ACCESSORIES = "accessories"

class RoastLevel(str, Enum):
    LIGHT = "light"
    MEDIUM_LIGHT = "medium_light"
    MEDIUM = "medium"
    MEDIUM_DARK = "medium_dark"
    DARK = "dark"

class GrindType(str, Enum):
    WHOLE_BEAN = "whole_bean"
    COARSE = "coarse"
    MEDIUM = "medium"
    FINE = "fine"
    EXTRA_FINE = "extra_fine"

class ShippingMethod(str, Enum):
    STANDARD = "standard"
    EXPRESS = "express"
    COLLECTION = "collection"
    LOCAL_DELIVERY = "local_delivery"


# ============ PYDANTIC MODELS ============

# User Models
class AddressModel(BaseModel):
    id: Optional[str] = None
    label: Optional[str] = "Home"
    first_name: str
    last_name: str
    street: str
    apartment: Optional[str] = None
    city: str
    province: str
    postal_code: str
    country: str = "South Africa"
    phone: Optional[str] = None
    is_default: bool = False

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    accepts_marketing: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    accepts_marketing: Optional[bool] = None

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    addresses: List[AddressModel] = []
    accepts_marketing: bool = False
    is_admin: bool = False
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse


# Product Models
class ProductImage(BaseModel):
    url: str
    alt: str
    is_primary: bool = False
    sort_order: int = 0

class ProductVariant(BaseModel):
    id: str
    name: str
    sku: str
    price: float
    compare_at_price: Optional[float] = None
    grind: Optional[GrindType] = None
    weight: str
    stock_quantity: int = 0
    barcode: Optional[str] = None

class TastingNote(BaseModel):
    note: str
    intensity: int  # 1-5

class BrewingMethod(BaseModel):
    method: str
    description: str
    ratio: str
    time: str
    temperature: str

class ProductCreate(BaseModel):
    name: str
    slug: str
    description: str
    short_description: Optional[str] = None
    category: ProductCategory
    roast_level: Optional[RoastLevel] = None
    origin: Optional[str] = None
    strength: Optional[int] = None  # 1-5
    flavor_notes: str
    tasting_notes: List[TastingNote] = []
    brewing_methods: List[BrewingMethod] = []
    images: List[ProductImage] = []
    variants: List[ProductVariant] = []
    tags: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    is_bundle: bool = False
    bundle_items: List[str] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    short_description: Optional[str] = None
    category: str
    roast_level: Optional[str] = None
    origin: Optional[str] = None
    strength: Optional[int] = None
    flavor_notes: str
    tasting_notes: List[TastingNote] = []
    brewing_methods: List[BrewingMethod] = []
    images: List[ProductImage] = []
    variants: List[ProductVariant] = []
    price: float
    compare_at_price: Optional[float] = None
    tags: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    is_bundle: bool = False
    bundle_items: List[str] = []
    stock_status: str = "in_stock"
    total_stock: int = 0
    average_rating: float = 0.0
    review_count: int = 0
    created_at: Optional[str] = None


# Cart Models
class CartItemAdd(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    product_name: str
    variant_name: Optional[str] = None
    price: float
    quantity: int
    image_url: str
    stock_available: int

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    discount: float = 0.0
    shipping: float = 0.0
    vat: float = 0.0
    total: float = 0.0
    coupon_code: Optional[str] = None
    item_count: int = 0


# Coupon Models
class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str  # percentage, fixed_amount, free_shipping
    discount_value: float
    minimum_order: float = 0.0
    maximum_uses: Optional[int] = None
    uses_per_customer: int = 1
    valid_from: datetime
    valid_until: datetime
    applies_to_products: List[str] = []
    applies_to_categories: List[str] = []
    is_active: bool = True


# Order Models
class OrderItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int
    price: float

class ShippingInfo(BaseModel):
    method: ShippingMethod
    address: AddressModel
    notes: Optional[str] = None

class BillingInfo(BaseModel):
    same_as_shipping: bool = True
    address: Optional[AddressModel] = None

class CheckoutCreate(BaseModel):
    shipping: ShippingInfo
    billing: BillingInfo
    payment_method: PaymentMethod
    coupon_code: Optional[str] = None
    is_guest: bool = False
    guest_email: Optional[EmailStr] = None
    is_subscription: bool = False

# Simple order creation for legacy frontend
class SimpleOrderCreate(BaseModel):
    shipping_address: dict
    is_subscription: bool = False
    subscription_frequency: Optional[str] = None
    payment_method: Optional[str] = "payfast"

class SimplePaymentCreate(BaseModel):
    order_id: str

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: Optional[str] = None
    guest_email: Optional[str] = None
    items: List[dict]
    subtotal: float
    discount: float
    shipping_cost: float
    vat: float
    total: float
    status: str
    payment_status: str
    payment_method: str
    shipping: dict
    billing: dict
    coupon_code: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str


# Review Models
class ReviewCreate(BaseModel):
    product_id: str
    rating: int  # 1-5
    title: str
    content: str

class ReviewResponse(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    title: str
    content: str
    is_verified_purchase: bool
    helpful_votes: int = 0
    created_at: str


# Wishlist Models
class WishlistItemAdd(BaseModel):
    product_id: str


# Search & Filter Models
class ProductFilter(BaseModel):
    category: Optional[str] = None
    roast_level: Optional[str] = None
    grind: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None
    tags: List[str] = []


# Admin Models
class AdminDashboardStats(BaseModel):
    total_orders: int
    total_revenue: float
    orders_today: int
    revenue_today: float
    pending_orders: int
    low_stock_products: int
    new_customers: int
    conversion_rate: float


# ============ UTILITY FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str, is_admin: bool = False) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "is_admin": is_admin,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_order_number() -> str:
    """Generate unique order number: CE-YYYYMMDD-XXXX"""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(2).upper()
    return f"CE-{date_part}-{random_part}"

def generate_sku(category: str, name: str) -> str:
    """Generate SKU from category and name"""
    cat_code = category[:2].upper()
    name_code = ''.join(c for c in name if c.isalnum())[:4].upper()
    random_part = secrets.token_hex(2).upper()
    return f"{cat_code}-{name_code}-{random_part}"

def calculate_shipping(subtotal: float, method: ShippingMethod, province: str, is_subscription: bool = False) -> float:
    """Calculate shipping cost - flat rate of R75 (free for subscriptions or over R399)"""
    if method == ShippingMethod.COLLECTION:
        return 0.0
    if is_subscription:
        return 0.0  # Free shipping for subscriptions
    if subtotal >= 399:  # Free shipping threshold
        return 0.0
    return 75.0  # Flat rate for all shipping methods

def calculate_vat(amount: float) -> float:
    """Calculate VAT (included in price for SA)"""
    return round(amount * VAT_RATE / (1 + VAT_RATE), 2)


# ============ AUTH DEPENDENCIES ============

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one(
            {"_id": payload["sub"]},
            {"password_hash": 0}
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_optional(request: Request) -> Optional[dict]:
    """Get current user if authenticated, else return None"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============ PAYFAST FUNCTIONS ============

def get_payfast_host() -> str:
    return "sandbox.payfast.co.za" if PAYFAST_SANDBOX else "www.payfast.co.za"

def generate_payfast_signature(data: Dict[str, str]) -> str:
    filtered = {k: v for k, v in data.items() if k != "signature" and v is not None and v != ""}
    sorted_items = sorted(filtered.items())
    param_string = "&".join([f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in sorted_items])
    
    if PAYFAST_PASSPHRASE:
        param_string += f"&passphrase={urllib.parse.quote_plus(PAYFAST_PASSPHRASE)}"
    
    return hashlib.md5(param_string.encode()).hexdigest()

async def verify_payfast_itn(request: Request) -> bool:
    """Verify PayFast ITN request"""
    form_data = await request.form()
    data = dict(form_data)
    
    # Verify signature
    received_sig = data.pop("signature", "")
    expected_sig = generate_payfast_signature(data)
    
    if received_sig != expected_sig:
        logger.warning("PayFast ITN: Invalid signature")
        return False
    
    # Verify source IP (PayFast IPs)
    payfast_ips = [
        "197.97.145.144", "197.97.145.145", "197.97.145.146", "197.97.145.147",
        "41.74.179.194", "41.74.179.195", "41.74.179.196", "41.74.179.197"
    ]
    
    client_ip = request.client.host
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    # In sandbox mode, skip IP check
    if not PAYFAST_SANDBOX and client_ip not in payfast_ips:
        logger.warning(f"PayFast ITN: Invalid source IP {client_ip}")
        return False
    
    return True


# ============ STITCH PAYMENT FUNCTIONS ============

async def get_stitch_access_token() -> str:
    """Get Stitch Express API access token using client credentials"""
    if not STITCH_CLIENT_ID or not STITCH_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Stitch not configured")
    
    # Stitch Express uses Basic Auth with client_id:client_secret
    import base64
    credentials = f"{STITCH_CLIENT_ID}:{STITCH_CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    async with httpx.AsyncClient() as client:
        # Try the Express OAuth endpoint first
        response = await client.post(
            "https://api.stitch.money/oauth/token",
            data={
                "grant_type": "client_credentials",
                "scope": "payments"
            },
            headers={
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        
        if response.status_code != 200:
            # Fallback to standard Stitch endpoint with form data
            logger.info(f"Trying alternate Stitch token endpoint...")
            response = await client.post(
                "https://secure.stitch.money/connect/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": STITCH_CLIENT_ID,
                    "client_secret": STITCH_CLIENT_SECRET,
                    "scope": "client_paymentrequest"
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
        
        if response.status_code != 200:
            logger.error(f"Stitch token error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail="Payment service unavailable")
        
        token_data = response.json()
        return token_data.get("access_token") or token_data.get("token")

async def create_stitch_payment(
    amount: float,
    reference: str,
    method: str,
    redirect_url: str
) -> dict:
    """Create Stitch payment request"""
    token = await get_stitch_access_token()
    
    mutation = """
    mutation CreatePaymentRequest($input: PaymentInitiationRequestInput!) {
        clientPaymentInitiationRequestCreate(input: $input) {
            paymentInitiationRequest {
                id
                url
            }
        }
    }
    """
    
    variables = {
        "input": {
            "amount": {
                "quantity": int(amount * 100),  # Amount in cents
                "currency": "ZAR"
            },
            "payerReference": reference,
            "beneficiaryReference": f"Cape Ember {reference}",
            "externalReference": reference
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.stitch.money/graphql",
            json={"query": mutation, "variables": variables},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        data = response.json()
        if "errors" in data:
            logger.error(f"Stitch error: {data['errors']}")
            raise HTTPException(status_code=500, detail="Payment creation failed")
        
        pir = data["data"]["clientPaymentInitiationRequestCreate"]["paymentInitiationRequest"]
        return {
            "id": pir["id"],
            "url": pir["url"]
        }

def verify_stitch_webhook(request: Request, body: bytes) -> bool:
    """Verify Stitch webhook signature"""
    if not STITCH_WEBHOOK_SECRET:
        return True  # Skip verification if not configured
    
    signature = request.headers.get("X-Stitch-Signature", "")
    timestamp = request.headers.get("X-Stitch-Timestamp", "")
    
    if not signature or not timestamp:
        return False
    
    # Build canonical string
    canonical = f"{timestamp}.{body.decode('utf-8')}"
    
    expected = hmac.new(
        STITCH_WEBHOOK_SECRET.encode(),
        canonical.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)


# ============ EMAIL FUNCTIONS ============

async def send_order_confirmation(order: dict, email: str):
    """Send order confirmation email with premium Cape Ember branding"""
    try:
        import resend
        import asyncio
        
        resend_key = os.environ.get("RESEND_API_KEY")
        sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        
        if not resend_key:
            logger.warning("RESEND_API_KEY not configured - skipping email")
            return
        
        resend.api_key = resend_key
        
        # Build items HTML
        items_html = ""
        for item in order.get("items", []):
            items_html += f"""
            <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #E6DCD1;">
                    <div style="font-weight: 600; color: #2C1A12;">{item.get('product_name', 'Product')}</div>
                    <div style="font-size: 14px; color: #6B5048;">{item.get('variant_name', '')}</div>
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid #E6DCD1; text-align: center; color: #6B5048;">
                    {item.get('quantity', 1)}
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid #E6DCD1; text-align: right; color: #2C1A12; font-weight: 500;">
                    R {item.get('price', 0) * item.get('quantity', 1):.2f}
                </td>
            </tr>
            """
        
        # Shipping address
        shipping = order.get("shipping", {})
        address = shipping.get("address", {}) if isinstance(shipping, dict) else {}
        address_html = f"""
            {address.get('first_name', '')} {address.get('last_name', '')}<br>
            {address.get('address_line1', '')}<br>
            {address.get('address_line2', '') + '<br>' if address.get('address_line2') else ''}
            {address.get('city', '')}, {address.get('province', '')} {address.get('postal_code', '')}<br>
            South Africa
        """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'Segoe UI', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F5F0; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #E6DCD1;">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #2C1A12; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #D05C23; font-size: 28px; font-weight: 400; letter-spacing: 2px;">CAPE EMBER</h1>
                                    <p style="margin: 5px 0 0; color: #FFFFFF; font-size: 11px; letter-spacing: 3px;">COFFEE CO.</p>
                                </td>
                            </tr>
                            
                            <!-- Thank You Message -->
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <h2 style="margin: 0; color: #2C1A12; font-size: 24px; font-weight: 400;">Thank You for Your Order</h2>
                                    <p style="margin: 15px 0 0; color: #6B5048; font-size: 16px; line-height: 1.6;">
                                        Your order has been confirmed and we're preparing it with care.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Order Details -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" style="background-color: #F8F5F0; padding: 20px;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 12px; color: #6B5048; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                                                <p style="margin: 5px 0 0; font-size: 18px; color: #D05C23; font-weight: 600;">#{order.get('order_number', 'N/A')}</p>
                                            </td>
                                            <td style="text-align: right;">
                                                <p style="margin: 0; font-size: 12px; color: #6B5048; text-transform: uppercase; letter-spacing: 1px;">Order Date</p>
                                                <p style="margin: 5px 0 0; font-size: 16px; color: #2C1A12;">{order.get('created_at', '')[:10]}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Items -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <h3 style="margin: 0 0 15px; color: #2C1A12; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Order Items</h3>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr style="border-bottom: 2px solid #E6DCD1;">
                                            <th style="padding: 10px 0; text-align: left; font-size: 12px; color: #6B5048; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                                            <th style="padding: 10px 0; text-align: center; font-size: 12px; color: #6B5048; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                                            <th style="padding: 10px 0; text-align: right; font-size: 12px; color: #6B5048; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                                        </tr>
                                        {items_html}
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Totals -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 8px 0; color: #6B5048;">Subtotal</td>
                                            <td style="padding: 8px 0; text-align: right; color: #2C1A12;">R {order.get('subtotal', 0):.2f}</td>
                                        </tr>
                                        {"<tr><td style='padding: 8px 0; color: #2F855A;'>Discount</td><td style='padding: 8px 0; text-align: right; color: #2F855A;'>- R " + f"{order.get('discount', 0):.2f}</td></tr>" if order.get('discount', 0) > 0 else ""}
                                        <tr>
                                            <td style="padding: 8px 0; color: #6B5048;">Shipping</td>
                                            <td style="padding: 8px 0; text-align: right; color: #2C1A12;">{"Free" if order.get('shipping_cost', 0) == 0 else f"R {order.get('shipping_cost', 0):.2f}"}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #6B5048;">VAT (included)</td>
                                            <td style="padding: 8px 0; text-align: right; color: #6B5048;">R {order.get('vat', 0):.2f}</td>
                                        </tr>
                                        <tr style="border-top: 2px solid #E6DCD1;">
                                            <td style="padding: 15px 0 0; font-size: 18px; font-weight: 600; color: #2C1A12;">Total</td>
                                            <td style="padding: 15px 0 0; text-align: right; font-size: 18px; font-weight: 600; color: #D05C23;">R {order.get('total', 0):.2f}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Shipping Address -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <h3 style="margin: 0 0 15px; color: #2C1A12; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h3>
                                    <p style="margin: 0; color: #6B5048; line-height: 1.8;">
                                        {address_html}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #F8F5F0; padding: 30px 40px; text-align: center;">
                                    <p style="margin: 0; color: #6B5048; font-size: 14px; line-height: 1.6;">
                                        Questions about your order?<br>
                                        <a href="mailto:hello@capeembercoffee.co.za" style="color: #D05C23; text-decoration: none;">hello@capeembercoffee.co.za</a>
                                    </p>
                                    <p style="margin: 20px 0 0; color: #A9998C; font-size: 12px;">
                                        © 2024 Cape Ember Coffee Co. | Premium South African Coffee
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        params = {
            "from": sender_email,
            "to": [email],
            "subject": f"Order Confirmed - #{order.get('order_number', 'N/A')} | Cape Ember Coffee Co.",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order confirmation email sent to {email} for order {order['order_number']}")
        
    except Exception as e:
        logger.error(f"Failed to send order confirmation email: {str(e)}")

async def send_shipping_notification(order: dict, tracking_number: str):
    """Send shipping notification email with tracking info"""
    try:
        import resend
        import asyncio
        
        resend_key = os.environ.get("RESEND_API_KEY")
        sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        
        if not resend_key:
            logger.warning("RESEND_API_KEY not configured - skipping email")
            return
        
        resend.api_key = resend_key
        
        # Get customer email
        email = order.get("guest_email", "")
        if order.get("user_id"):
            user = await db.users.find_one({"_id": order["user_id"]})
            if user:
                email = user.get("email", "")
        
        if not email:
            logger.warning(f"No email found for order {order.get('order_number')}")
            return
        
        # Shipping address
        shipping = order.get("shipping", {})
        address = shipping.get("address", {}) if isinstance(shipping, dict) else {}
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'Segoe UI', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F5F0; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #E6DCD1;">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #2C1A12; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #D05C23; font-size: 28px; font-weight: 400; letter-spacing: 2px;">CAPE EMBER</h1>
                                    <p style="margin: 5px 0 0; color: #FFFFFF; font-size: 11px; letter-spacing: 3px;">COFFEE CO.</p>
                                </td>
                            </tr>
                            
                            <!-- Shipping Icon & Message -->
                            <tr>
                                <td style="padding: 40px 40px 20px; text-align: center;">
                                    <div style="width: 80px; height: 80px; background-color: #D05C23; border-radius: 50%; margin: 0 auto 20px; line-height: 80px;">
                                        <span style="color: #FFFFFF; font-size: 36px;">📦</span>
                                    </div>
                                    <h2 style="margin: 0; color: #2C1A12; font-size: 24px; font-weight: 400;">Your Order is On Its Way!</h2>
                                    <p style="margin: 15px 0 0; color: #6B5048; font-size: 16px; line-height: 1.6;">
                                        Great news! Your Cape Ember coffee has been shipped and is making its way to you.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Tracking Info -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" style="background-color: #F8F5F0; padding: 25px; text-align: center;">
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 12px; color: #6B5048; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                                                <p style="margin: 5px 0 15px; font-size: 18px; color: #2C1A12; font-weight: 600;">#{order.get('order_number', 'N/A')}</p>
                                                
                                                <p style="margin: 0; font-size: 12px; color: #6B5048; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
                                                <p style="margin: 5px 0 0; font-size: 20px; color: #D05C23; font-weight: 600; font-family: monospace;">{tracking_number}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Delivery Address -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <h3 style="margin: 0 0 15px; color: #2C1A12; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Delivering To</h3>
                                    <p style="margin: 0; color: #6B5048; line-height: 1.8;">
                                        {address.get('first_name', '')} {address.get('last_name', '')}<br>
                                        {address.get('address_line1', '')}<br>
                                        {address.get('city', '')}, {address.get('province', '')} {address.get('postal_code', '')}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- What's Next -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <h3 style="margin: 0 0 15px; color: #2C1A12; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What's Next?</h3>
                                    <p style="margin: 0; color: #6B5048; line-height: 1.8;">
                                        Your package is on its way via our courier partner. You can track your delivery using the tracking number above. 
                                        Most orders arrive within 2-5 business days.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #F8F5F0; padding: 30px 40px; text-align: center;">
                                    <p style="margin: 0; color: #6B5048; font-size: 14px; line-height: 1.6;">
                                        Questions about your delivery?<br>
                                        <a href="mailto:hello@capeembercoffee.co.za" style="color: #D05C23; text-decoration: none;">hello@capeembercoffee.co.za</a>
                                    </p>
                                    <p style="margin: 20px 0 0; color: #A9998C; font-size: 12px;">
                                        © 2024 Cape Ember Coffee Co. | Premium South African Coffee
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        params = {
            "from": sender_email,
            "to": [email],
            "subject": f"Your Order Has Shipped! 📦 - #{order.get('order_number', 'N/A')} | Cape Ember Coffee Co.",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Shipping notification sent to {email} for order {order['order_number']}")
        
    except Exception as e:
        logger.error(f"Failed to send shipping notification: {str(e)}")

async def send_password_reset(email: str, reset_token: str):
    """Send password reset email"""
    try:
        import resend
        import asyncio
        
        resend_key = os.environ.get("RESEND_API_KEY")
        sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        
        if not resend_key:
            logger.warning("RESEND_API_KEY not configured - skipping email")
            return
        
        resend.api_key = resend_key
        
        # Reset link (would be your frontend URL in production)
        reset_link = f"https://capeembercoffee.co.za/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'Segoe UI', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F5F0; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #E6DCD1;">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #2C1A12; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #D05C23; font-size: 28px; font-weight: 400; letter-spacing: 2px;">CAPE EMBER</h1>
                                    <p style="margin: 5px 0 0; color: #FFFFFF; font-size: 11px; letter-spacing: 3px;">COFFEE CO.</p>
                                </td>
                            </tr>
                            
                            <!-- Message -->
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="margin: 0 0 20px; color: #2C1A12; font-size: 24px; font-weight: 400; text-align: center;">Reset Your Password</h2>
                                    <p style="margin: 0 0 30px; color: #6B5048; font-size: 16px; line-height: 1.6; text-align: center;">
                                        We received a request to reset your password. Click the button below to create a new password.
                                    </p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center">
                                                <a href="{reset_link}" style="display: inline-block; background-color: #D05C23; color: #FFFFFF; padding: 15px 40px; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 1px;">
                                                    RESET PASSWORD
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="margin: 30px 0 0; color: #A9998C; font-size: 14px; line-height: 1.6; text-align: center;">
                                        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #F8F5F0; padding: 30px 40px; text-align: center;">
                                    <p style="margin: 0; color: #A9998C; font-size: 12px;">
                                        © 2024 Cape Ember Coffee Co. | Premium South African Coffee
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        params = {
            "from": sender_email,
            "to": [email],
            "subject": "Reset Your Password | Cape Ember Coffee Co.",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")


async def send_welcome_email(email: str, first_name: str):
    """Send welcome email to new customers"""
    try:
        import resend
        import asyncio
        
        resend_key = os.environ.get("RESEND_API_KEY")
        sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        
        if not resend_key:
            logger.warning("RESEND_API_KEY not configured - skipping email")
            return
        
        resend.api_key = resend_key
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'Segoe UI', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F5F0; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #E6DCD1;">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #2C1A12; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #D05C23; font-size: 28px; font-weight: 400; letter-spacing: 2px;">CAPE EMBER</h1>
                                    <p style="margin: 5px 0 0; color: #FFFFFF; font-size: 11px; letter-spacing: 3px;">COFFEE CO.</p>
                                </td>
                            </tr>
                            
                            <!-- Welcome Message -->
                            <tr>
                                <td style="padding: 40px; text-align: center;">
                                    <h2 style="margin: 0 0 20px; color: #2C1A12; font-size: 28px; font-weight: 400;">
                                        Welcome to Cape Ember, {first_name}!
                                    </h2>
                                    <p style="margin: 0 0 30px; color: #6B5048; font-size: 16px; line-height: 1.8;">
                                        Thank you for joining us. You're now part of a community that appreciates 
                                        premium coffee inspired by South Africa's most beautiful landscapes.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Features -->
                            <tr>
                                <td style="padding: 0 40px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td width="33%" style="text-align: center; padding: 20px;">
                                                <div style="font-size: 36px; margin-bottom: 10px;">☕</div>
                                                <p style="margin: 0; color: #2C1A12; font-weight: 600; font-size: 14px;">Small-Batch<br>Quality</p>
                                            </td>
                                            <td width="33%" style="text-align: center; padding: 20px;">
                                                <div style="font-size: 36px; margin-bottom: 10px;">🇿🇦</div>
                                                <p style="margin: 0; color: #2C1A12; font-weight: 600; font-size: 14px;">Proudly<br>South African</p>
                                            </td>
                                            <td width="33%" style="text-align: center; padding: 20px;">
                                                <div style="font-size: 36px; margin-bottom: 10px;">🚚</div>
                                                <p style="margin: 0; color: #2C1A12; font-weight: 600; font-size: 14px;">Free Shipping<br>Over R399</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- CTA -->
                            <tr>
                                <td style="padding: 0 40px 40px; text-align: center;">
                                    <p style="margin: 0 0 20px; color: #6B5048; font-size: 16px;">
                                        Ready to explore? Use code <strong style="color: #D05C23;">WELCOME10</strong> for 10% off your first order.
                                    </p>
                                    <a href="https://capeembercoffee.co.za/shop" style="display: inline-block; background-color: #D05C23; color: #FFFFFF; padding: 15px 40px; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 1px;">
                                        EXPLORE THE COLLECTION
                                    </a>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #F8F5F0; padding: 30px 40px; text-align: center;">
                                    <p style="margin: 0 0 15px; color: #6B5048; font-size: 14px;">
                                        Follow us for updates, brewing tips, and behind-the-scenes content.
                                    </p>
                                    <p style="margin: 0; color: #A9998C; font-size: 12px;">
                                        © 2024 Cape Ember Coffee Co. | Premium South African Coffee
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        params = {
            "from": sender_email,
            "to": [email],
            "subject": f"Welcome to Cape Ember Coffee Co., {first_name}! ☕",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Welcome email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")


# ============ PRODUCT DATA ============

# Extended product catalog
PRODUCTS = [
    {
        "id": "fynbos-roast",
        "name": "Fynbos Roast",
        "slug": "fynbos-roast",
        "description": "Inspired by the wild fynbos of the Cape Peninsula, this medium roast offers a grounded, comforting cup with natural sweetness. Smooth, nutty, and perfectly balanced — this is coffee for those who appreciate quiet mornings and the simple beauty of the Cape landscape.",
        "short_description": "Smooth medium roast with nutty sweetness",
        "category": ProductCategory.COFFEE_BEANS,
        "roast_level": RoastLevel.MEDIUM,
        "origin": "South African Roasted",
        "strength": 3,
        "flavor_notes": "Smooth · Nutty · Balanced",
        "tasting_notes": [
            {"note": "Hazelnut", "intensity": 4},
            {"note": "Caramel", "intensity": 3},
            {"note": "Cocoa", "intensity": 2}
        ],
        "brewing_methods": [
            {"method": "French Press", "description": "Full-bodied extraction", "ratio": "1:15", "time": "4 min", "temperature": "93°C"},
            {"method": "Pour Over", "description": "Clean, bright cup", "ratio": "1:16", "time": "3 min", "temperature": "92°C"},
            {"method": "AeroPress", "description": "Smooth concentrate", "ratio": "1:12", "time": "1.5 min", "temperature": "88°C"}
        ],
        "images": [
            {"url": "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/s93qex0b_77A74D65-C0D2-4A33-9348-2B0D5FE7082C.jpeg", "alt": "Fynbos Roast Coffee", "is_primary": True, "sort_order": 0}
        ],
        "variants": [
            {"id": "fynbos-250g-whole", "name": "250g Whole Bean", "sku": "CB-FYNB-250W", "price": 149.00, "grind": GrindType.WHOLE_BEAN, "weight": "250g", "stock_quantity": 50},
            {"id": "fynbos-250g-ground", "name": "250g Ground", "sku": "CB-FYNB-250G", "price": 149.00, "grind": GrindType.MEDIUM, "weight": "250g", "stock_quantity": 30},
            {"id": "fynbos-1kg-whole", "name": "1kg Whole Bean", "sku": "CB-FYNB-1KW", "price": 499.00, "grind": GrindType.WHOLE_BEAN, "weight": "1kg", "stock_quantity": 20}
        ],
        "tags": ["bestseller", "everyday", "brazilian"],
        "is_active": True,
        "is_featured": True,
        "is_bundle": False
    },
    {
        "id": "garden-route",
        "name": "Garden Route Blend",
        "slug": "garden-route-blend",
        "description": "A tribute to South Africa's iconic Garden Route coast. This balanced house blend offers a smooth cup with hints of cocoa and gentle citrus — crafted for everyday enjoyment, whether you're starting your morning or winding down your afternoon.",
        "short_description": "Smooth house blend with cocoa notes",
        "category": ProductCategory.COFFEE_BEANS,
        "roast_level": RoastLevel.MEDIUM,
        "origin": "South African Roasted",
        "strength": 3,
        "flavor_notes": "Smooth · Cocoa · Gentle Citrus",
        "tasting_notes": [
            {"note": "Milk Chocolate", "intensity": 4},
            {"note": "Orange Zest", "intensity": 2},
            {"note": "Brown Sugar", "intensity": 3}
        ],
        "brewing_methods": [
            {"method": "Pour Over", "description": "Bright and clean", "ratio": "1:16", "time": "3.5 min", "temperature": "92°C"},
            {"method": "Cold Brew", "description": "Sweet and smooth", "ratio": "1:8", "time": "18 hrs", "temperature": "Cold"},
            {"method": "Espresso", "description": "Rich crema", "ratio": "1:2", "time": "28 sec", "temperature": "93°C"}
        ],
        "images": [
            {"url": "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/bvwasl9r_81ABD9FE-73FC-4C42-BF11-D3A0A1024683.jpeg", "alt": "Garden Route Blend", "is_primary": True, "sort_order": 0}
        ],
        "variants": [
            {"id": "garden-250g-whole", "name": "250g Whole Bean", "sku": "CB-GARD-250W", "price": 149.00, "grind": GrindType.WHOLE_BEAN, "weight": "250g", "stock_quantity": 45},
            {"id": "garden-250g-ground", "name": "250g Ground", "sku": "CB-GARD-250G", "price": 149.00, "grind": GrindType.MEDIUM, "weight": "250g", "stock_quantity": 35},
            {"id": "garden-1kg-whole", "name": "1kg Whole Bean", "sku": "CB-GARD-1KW", "price": 499.00, "grind": GrindType.WHOLE_BEAN, "weight": "1kg", "stock_quantity": 15}
        ],
        "tags": ["house-blend", "everyday", "cold-brew-friendly"],
        "is_active": True,
        "is_featured": True,
        "is_bundle": False
    },
    {
        "id": "ember-reserve",
        "name": "Ember Reserve",
        "slug": "ember-reserve",
        "description": "Inspired by the rugged grandeur of the Drakensberg mountains. Ember Reserve delivers a bold, lingering finish with rich dark chocolate notes and full-bodied intensity. For those who appreciate depth and strength in their cup.",
        "short_description": "Bold dark roast with chocolate intensity",
        "category": ProductCategory.COFFEE_BEANS,
        "roast_level": RoastLevel.DARK,
        "origin": "South African Roasted",
        "strength": 5,
        "flavor_notes": "Rich · Dark Chocolate · Intense",
        "tasting_notes": [
            {"note": "Dark Chocolate", "intensity": 5},
            {"note": "Molasses", "intensity": 3},
            {"note": "Smoke", "intensity": 2}
        ],
        "brewing_methods": [
            {"method": "Espresso", "description": "Bold and intense", "ratio": "1:2", "time": "26 sec", "temperature": "94°C"},
            {"method": "French Press", "description": "Full body", "ratio": "1:15", "time": "4.5 min", "temperature": "95°C"},
            {"method": "Moka Pot", "description": "Stovetop intensity", "ratio": "1:10", "time": "4 min", "temperature": "Stovetop"}
        ],
        "images": [
            {"url": "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/urotn845_DA24A032-67E2-4343-9612-0534B6EA7394.jpeg", "alt": "Ember Reserve", "is_primary": True, "sort_order": 0}
        ],
        "variants": [
            {"id": "ember-250g-whole", "name": "250g Whole Bean", "sku": "CB-EMBR-250W", "price": 159.00, "grind": GrindType.WHOLE_BEAN, "weight": "250g", "stock_quantity": 40},
            {"id": "ember-250g-ground", "name": "250g Ground", "sku": "CB-EMBR-250G", "price": 159.00, "grind": GrindType.FINE, "weight": "250g", "stock_quantity": 25},
            {"id": "ember-1kg-whole", "name": "1kg Whole Bean", "sku": "CB-EMBR-1KW", "price": 549.00, "grind": GrindType.WHOLE_BEAN, "weight": "1kg", "stock_quantity": 10}
        ],
        "tags": ["bold", "espresso", "colombian", "premium"],
        "is_active": True,
        "is_featured": True,
        "is_bundle": False
    },
    {
        "id": "karoo-horizon",
        "name": "Karoo Horizon",
        "slug": "karoo-horizon",
        "description": "From the vast, open plains of the Great Karoo. This expressive light roast offers delicate blueberry and wildflower notes with a relaxed honey finish — capturing the quiet, endless beauty of the Karoo horizon. A limited release for adventurous palates.",
        "short_description": "Delicate light roast with fruity florals",
        "category": ProductCategory.COFFEE_BEANS,
        "roast_level": RoastLevel.LIGHT,
        "origin": "South African Roasted",
        "strength": 2,
        "flavor_notes": "Floral · Blueberry · Bright",
        "tasting_notes": [
            {"note": "Blueberry", "intensity": 4},
            {"note": "Jasmine", "intensity": 3},
            {"note": "Honey", "intensity": 3}
        ],
        "brewing_methods": [
            {"method": "Pour Over", "description": "Highlight florals", "ratio": "1:17", "time": "3 min", "temperature": "90°C"},
            {"method": "AeroPress", "description": "Concentrated fruit", "ratio": "1:13", "time": "1.5 min", "temperature": "85°C"}
        ],
        "images": [
            {"url": "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/7rra3n1s_38C77683-E4ED-4917-95F8-08997E2C06FE.jpeg", "alt": "Karoo Horizon", "is_primary": True, "sort_order": 0}
        ],
        "variants": [
            {"id": "karoo-250g-whole", "name": "250g Whole Bean", "sku": "CB-KARO-250W", "price": 169.00, "grind": GrindType.WHOLE_BEAN, "weight": "250g", "stock_quantity": 25},
            {"id": "karoo-250g-ground", "name": "250g Ground", "sku": "CB-KARO-250G", "price": 169.00, "grind": GrindType.MEDIUM, "weight": "250g", "stock_quantity": 15}
        ],
        "tags": ["limited-edition", "single-origin", "ethiopian", "specialty"],
        "is_active": True,
        "is_featured": True,
        "is_bundle": False
    },
    {
        "id": "landscape-bundle",
        "name": "Landscape Range Bundle",
        "slug": "landscape-bundle",
        "description": "Experience the complete Cape Ember journey with all four signature blends — from the wild fynbos of the Cape Peninsula to the vast plains of the Karoo. Each blend captures a different South African landscape, offering a unique coffee experience in every bag. The perfect way to discover your favourite or share with someone special.",
        "short_description": "Complete collection of all four blends",
        "category": ProductCategory.GIFT_BOXES,
        "roast_level": None,
        "origin": "South African Roasted",
        "strength": None,
        "flavor_notes": "Complete Collection · 4 x 250g",
        "tasting_notes": [],
        "brewing_methods": [],
        "images": [
            {"url": "https://customer-assets.emergentagent.com/job_axis-creator/artifacts/2yv1tstu_0028652C-25DC-4D60-B03B-3259460E5E93.jpeg", "alt": "Landscape Bundle", "is_primary": True, "sort_order": 0}
        ],
        "variants": [
            {"id": "bundle-whole", "name": "4 x 250g Whole Bean", "sku": "GB-LAND-4X250W", "price": 599.00, "compare_at_price": 626.00, "grind": GrindType.WHOLE_BEAN, "weight": "4 x 250g", "stock_quantity": 15},
            {"id": "bundle-ground", "name": "4 x 250g Ground", "sku": "GB-LAND-4X250G", "price": 599.00, "compare_at_price": 626.00, "grind": GrindType.MEDIUM, "weight": "4 x 250g", "stock_quantity": 10}
        ],
        "tags": ["bundle", "gift", "value", "complete-collection"],
        "is_active": True,
        "is_featured": True,
        "is_bundle": True,
        "bundle_items": ["fynbos-roast", "garden-route", "ember-reserve", "karoo-horizon"]
    }
]

PRODUCTS_MAP = {p["id"]: p for p in PRODUCTS}


# ============ SHIPPING ZONES ============

SHIPPING_ZONES = {
    "Western Cape": {"standard": 50, "express": 95, "local_delivery": 35},
    "Gauteng": {"standard": 65, "express": 120},
    "KwaZulu-Natal": {"standard": 70, "express": 130},
    "Eastern Cape": {"standard": 70, "express": 130},
    "Free State": {"standard": 70, "express": 125},
    "Limpopo": {"standard": 75, "express": 140},
    "Mpumalanga": {"standard": 75, "express": 135},
    "North West": {"standard": 75, "express": 135},
    "Northern Cape": {"standard": 80, "express": 150}
}


# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "_id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone,
        "addresses": [],
        "accepts_marketing": user_data.accepts_marketing,
        "is_admin": False,
        "created_at": now,
        "updated_at": now
    }
    await db.users.insert_one(user_doc)
    
    # Create empty cart
    await db.carts.insert_one({"_id": user_id, "items": [], "coupon_code": None, "updated_at": now})
    
    # Create empty wishlist
    await db.wishlists.insert_one({"_id": user_id, "items": [], "updated_at": now})
    
    # Send welcome email
    background_tasks.add_task(send_welcome_email, user_data.email.lower(), user_data.first_name)
    
    access_token = create_access_token(user_id, user_data.email)
    refresh_token = create_refresh_token(user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            addresses=[],
            accepts_marketing=user_data.accepts_marketing,
            is_admin=False,
            created_at=now
        )
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(user["_id"], user["email"], user.get("is_admin", False))
    refresh_token = create_refresh_token(user["_id"])
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user["_id"],
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            phone=user.get("phone"),
            addresses=[AddressModel(**a) for a in user.get("addresses", [])],
            accepts_marketing=user.get("accepts_marketing", False),
            is_admin=user.get("is_admin", False),
            created_at=user.get("created_at")
        )
    )


@api_router.post("/auth/refresh")
async def refresh_token(refresh_token: str = Header(...)):
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access_token = create_access_token(user["_id"], user["email"], user.get("is_admin", False))
        
        return {"access_token": new_access_token, "token_type": "bearer"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@api_router.post("/auth/forgot-password")
async def forgot_password(data: PasswordReset, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": data.email.lower()})
    if user:
        reset_token = secrets.token_urlsafe(32)
        await db.password_resets.insert_one({
            "user_id": user["_id"],
            "token": reset_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        background_tasks.add_task(send_password_reset, data.email, reset_token)
    
    return {"message": "If an account exists, a reset email has been sent"}


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["_id"],
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        phone=user.get("phone"),
        addresses=[AddressModel(**a) for a in user.get("addresses", [])],
        accepts_marketing=user.get("accepts_marketing", False),
        is_admin=user.get("is_admin", False),
        created_at=user.get("created_at")
    )


@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(data: UserUpdate, user: dict = Depends(get_current_user)):
    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_fields})
    
    updated_user = await db.users.find_one({"_id": user["_id"]})
    return UserResponse(
        id=updated_user["_id"],
        email=updated_user["email"],
        first_name=updated_user["first_name"],
        last_name=updated_user["last_name"],
        phone=updated_user.get("phone"),
        addresses=[AddressModel(**a) for a in updated_user.get("addresses", [])],
        accepts_marketing=updated_user.get("accepts_marketing", False)
    )


# ============ ADDRESS ROUTES ============

@api_router.post("/addresses")
async def add_address(address: AddressModel, user: dict = Depends(get_current_user)):
    address_data = address.dict()
    address_data["id"] = str(uuid.uuid4())
    
    # If this is the first address or marked as default, set it as default
    addresses = user.get("addresses", [])
    if not addresses or address_data.get("is_default"):
        # Remove default from other addresses
        for a in addresses:
            a["is_default"] = False
        address_data["is_default"] = True
    
    addresses.append(address_data)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"addresses": addresses, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Address added", "address": address_data}


@api_router.put("/addresses/{address_id}")
async def update_address(address_id: str, address: AddressModel, user: dict = Depends(get_current_user)):
    addresses = user.get("addresses", [])
    
    for i, a in enumerate(addresses):
        if a["id"] == address_id:
            address_data = address.dict()
            address_data["id"] = address_id
            
            if address_data.get("is_default"):
                for other in addresses:
                    other["is_default"] = False
            
            addresses[i] = address_data
            break
    else:
        raise HTTPException(status_code=404, detail="Address not found")
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"addresses": addresses, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Address updated"}


@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    addresses = [a for a in user.get("addresses", []) if a["id"] != address_id]
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"addresses": addresses, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Address deleted"}


# ============ PRODUCT ROUTES ============

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    roast_level: Optional[str] = None,
    grind: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "featured",  # featured, newest, price_asc, price_desc, bestselling
    page: int = 1,
    limit: int = 20
):
    products = PRODUCTS.copy()
    
    # Filter by category
    if category:
        products = [p for p in products if p.get("category") == category or (hasattr(p.get("category"), "value") and p["category"].value == category)]
    
    # Filter by roast level
    if roast_level:
        products = [p for p in products if p.get("roast_level") and (p["roast_level"] == roast_level or (hasattr(p["roast_level"], "value") and p["roast_level"].value == roast_level))]
    
    # Filter by price
    if min_price:
        products = [p for p in products if p["variants"][0]["price"] >= min_price]
    if max_price:
        products = [p for p in products if p["variants"][0]["price"] <= max_price]
    
    # Filter by stock
    if in_stock:
        products = [p for p in products if sum(v["stock_quantity"] for v in p["variants"]) > 0]
    
    # Filter by tags
    if tags:
        tag_list = tags.split(",")
        products = [p for p in products if any(t in p.get("tags", []) for t in tag_list)]
    
    # Search
    if search:
        search_lower = search.lower()
        products = [p for p in products if 
            search_lower in p["name"].lower() or 
            search_lower in p.get("description", "").lower() or
            search_lower in p.get("flavor_notes", "").lower()
        ]
    
    # Sort
    if sort == "price_asc":
        products.sort(key=lambda p: p["variants"][0]["price"])
    elif sort == "price_desc":
        products.sort(key=lambda p: p["variants"][0]["price"], reverse=True)
    elif sort == "newest":
        products.reverse()  # Assuming newest at end
    # featured is default order
    
    # Pagination
    total = len(products)
    start = (page - 1) * limit
    end = start + limit
    products = products[start:end]
    
    # Format response
    result = []
    for p in products:
        base_variant = p["variants"][0]
        result.append({
            "id": p["id"],
            "name": p["name"],
            "slug": p["slug"],
            "description": p["description"],
            "short_description": p.get("short_description"),
            "category": p["category"].value if hasattr(p["category"], "value") else p["category"],
            "roast_level": p["roast_level"].value if p.get("roast_level") and hasattr(p["roast_level"], "value") else p.get("roast_level"),
            "origin": p.get("origin"),
            "strength": p.get("strength"),
            "flavor_notes": p["flavor_notes"],
            "images": p["images"],
            "price": base_variant["price"],
            "compare_at_price": base_variant.get("compare_at_price"),
            "variants": p["variants"],
            "tags": p.get("tags", []),
            "is_featured": p.get("is_featured", False),
            "is_bundle": p.get("is_bundle", False),
            "stock_status": "in_stock" if sum(v["stock_quantity"] for v in p["variants"]) > 0 else "out_of_stock",
            "total_stock": sum(v["stock_quantity"] for v in p["variants"])
        })
    
    return {
        "products": result,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@api_router.get("/products/search")
async def search_products(q: str, limit: int = 10):
    """Autocomplete search"""
    if len(q) < 2:
        return {"results": []}
    
    q_lower = q.lower()
    results = []
    
    for p in PRODUCTS:
        if q_lower in p["name"].lower():
            results.append({
                "id": p["id"],
                "name": p["name"],
                "slug": p["slug"],
                "image": p["images"][0]["url"] if p["images"] else None,
                "price": p["variants"][0]["price"]
            })
            if len(results) >= limit:
                break
    
    return {"results": results}


@api_router.get("/products/categories")
async def get_categories():
    """Get all product categories with counts"""
    categories = {}
    for p in PRODUCTS:
        cat = p["category"].value if hasattr(p["category"], "value") else p["category"]
        if cat not in categories:
            categories[cat] = {"name": cat.replace("_", " ").title(), "count": 0}
        categories[cat]["count"] += 1
    
    return list(categories.values())


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = PRODUCTS_MAP.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get reviews
    reviews = await db.reviews.find({"product_id": product_id, "is_approved": True}).to_list(10)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    
    # Get related products (same category, different product)
    related = [p for p in PRODUCTS if p["id"] != product_id and p.get("category") == product.get("category")][:4]
    
    base_variant = product["variants"][0]
    
    return {
        "id": product["id"],
        "name": product["name"],
        "slug": product["slug"],
        "description": product["description"],
        "short_description": product.get("short_description"),
        "category": product["category"].value if hasattr(product["category"], "value") else product["category"],
        "roast_level": product["roast_level"].value if product.get("roast_level") and hasattr(product["roast_level"], "value") else product.get("roast_level"),
        "origin": product.get("origin"),
        "strength": product.get("strength"),
        "flavor_notes": product["flavor_notes"],
        "tasting_notes": product.get("tasting_notes", []),
        "brewing_methods": product.get("brewing_methods", []),
        "images": product["images"],
        "variants": product["variants"],
        "price": base_variant["price"],
        "compare_at_price": base_variant.get("compare_at_price"),
        "tags": product.get("tags", []),
        "is_featured": product.get("is_featured", False),
        "is_bundle": product.get("is_bundle", False),
        "bundle_items": product.get("bundle_items", []),
        "stock_status": "in_stock" if sum(v["stock_quantity"] for v in product["variants"]) > 0 else "out_of_stock",
        "total_stock": sum(v["stock_quantity"] for v in product["variants"]),
        "average_rating": round(avg_rating, 1),
        "review_count": len(reviews),
        "related_products": [{
            "id": r["id"],
            "name": r["name"],
            "slug": r["slug"],
            "price": r["variants"][0]["price"],
            "image": r["images"][0]["url"] if r["images"] else None
        } for r in related]
    }


# ============ CART ROUTES ============

async def get_or_create_cart(user_id: Optional[str], session_id: Optional[str]) -> dict:
    """Get or create cart for user or guest session"""
    if user_id:
        cart = await db.carts.find_one({"_id": user_id})
        if not cart:
            cart = {"_id": user_id, "items": [], "coupon_code": None, "updated_at": datetime.now(timezone.utc).isoformat()}
            await db.carts.insert_one(cart)
        return cart
    elif session_id:
        cart = await db.guest_carts.find_one({"session_id": session_id})
        if not cart:
            cart = {"session_id": session_id, "items": [], "coupon_code": None, "updated_at": datetime.now(timezone.utc).isoformat()}
            await db.guest_carts.insert_one(cart)
        return cart
    raise HTTPException(status_code=400, detail="Authentication or session required")


def calculate_cart_totals(items: list, coupon: Optional[dict] = None, shipping_cost: float = 0.0) -> dict:
    """Calculate cart totals with optional coupon and shipping."""
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    discount = 0.0
    
    if coupon:
        if coupon["discount_type"] == "percentage":
            discount = subtotal * (coupon["discount_value"] / 100)
        elif coupon["discount_type"] == "fixed_amount":
            discount = min(coupon["discount_value"], subtotal)
    
    discounted_subtotal = subtotal - discount
    total = discounted_subtotal + shipping_cost
    vat = calculate_vat(total)
    
    return {
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "vat": round(vat, 2),
        "total": round(total, 2),
        "item_count": sum(item["quantity"] for item in items)
    }


@api_router.get("/cart", response_model=CartResponse)
async def get_cart(
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = user["_id"] if user else None
    cart = await get_or_create_cart(user_id, session_id)
    
    # Get coupon if applied
    coupon = None
    if cart.get("coupon_code"):
        coupon = await db.coupons.find_one({"code": cart["coupon_code"], "is_active": True})
    
    items = []
    for item in cart.get("items", []):
        product = PRODUCTS_MAP.get(item["product_id"])
        if product:
            variant = next((v for v in product["variants"] if v["id"] == item.get("variant_id")), product["variants"][0])
            items.append(CartItemResponse(
                id=f"{item['product_id']}_{item.get('variant_id', 'default')}",
                product_id=product["id"],
                variant_id=item.get("variant_id"),
                product_name=product["name"],
                variant_name=variant["name"],
                price=variant["price"],
                quantity=item["quantity"],
                image_url=product["images"][0]["url"] if product["images"] else "",
                stock_available=variant["stock_quantity"]
            ))
    
    raw_subtotal = sum(i.price * i.quantity for i in items)
    shipping = 0.0 if raw_subtotal >= 399 else 75.0
    totals = calculate_cart_totals([{"price": i.price, "quantity": i.quantity} for i in items], coupon, shipping)
    
    return CartResponse(
        items=items,
        subtotal=totals["subtotal"],
        discount=totals["discount"],
        shipping=shipping,
        vat=totals["vat"],
        total=totals["total"],
        coupon_code=cart.get("coupon_code"),
        item_count=totals["item_count"]
    )


@api_router.post("/cart/add")
async def add_to_cart(
    item: CartItemAdd,
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    product = PRODUCTS_MAP.get(item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate variant
    variant_id = item.variant_id or product["variants"][0]["id"]
    variant = next((v for v in product["variants"] if v["id"] == variant_id), None)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Check stock
    if variant["stock_quantity"] < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    user_id = user["_id"] if user else None
    cart = await get_or_create_cart(user_id, session_id)
    
    items = cart.get("items", [])
    
    # Check if item already in cart
    existing = next((i for i in items if i["product_id"] == item.product_id and i.get("variant_id") == variant_id), None)
    
    if existing:
        existing["quantity"] += item.quantity
    else:
        items.append({
            "product_id": item.product_id,
            "variant_id": variant_id,
            "quantity": item.quantity
        })
    
    collection = db.carts if user_id else db.guest_carts
    key = "_id" if user_id else "session_id"
    value = user_id or session_id
    
    await collection.update_one(
        {key: value},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item added to cart"}


@api_router.put("/cart/items/{item_id}")
async def update_cart_item(
    item_id: str,
    update: CartItemUpdate,
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = user["_id"] if user else None
    cart = await get_or_create_cart(user_id, session_id)
    
    items = cart.get("items", [])
    product_id, variant_id = item_id.rsplit("_", 1) if "_" in item_id else (item_id, "default")
    
    if update.quantity <= 0:
        items = [i for i in items if not (i["product_id"] == product_id and (i.get("variant_id") == variant_id or variant_id == "default"))]
    else:
        for item in items:
            if item["product_id"] == product_id and (item.get("variant_id") == variant_id or variant_id == "default"):
                item["quantity"] = update.quantity
                break
    
    collection = db.carts if user_id else db.guest_carts
    key = "_id" if user_id else "session_id"
    value = user_id or session_id
    
    await collection.update_one(
        {key: value},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart updated"}


@api_router.delete("/cart/items/{item_id}")
async def remove_from_cart(
    item_id: str,
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = user["_id"] if user else None
    cart = await get_or_create_cart(user_id, session_id)
    
    product_id, variant_id = item_id.rsplit("_", 1) if "_" in item_id else (item_id, "default")
    items = [i for i in cart.get("items", []) if not (i["product_id"] == product_id and (i.get("variant_id") == variant_id or variant_id == "default"))]
    
    collection = db.carts if user_id else db.guest_carts
    key = "_id" if user_id else "session_id"
    value = user_id or session_id
    
    await collection.update_one(
        {key: value},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item removed"}


@api_router.delete("/cart")
async def clear_cart(
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = user["_id"] if user else None
    
    collection = db.carts if user_id else db.guest_carts
    key = "_id" if user_id else "session_id"
    value = user_id or session_id
    
    await collection.update_one(
        {key: value},
        {"$set": {"items": [], "coupon_code": None, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart cleared"}


# ============ COUPON ROUTES ============

class CouponApply(BaseModel):
    code: str

@api_router.post("/cart/coupon")
async def apply_coupon(
    coupon_data: CouponApply,
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    code = coupon_data.code
    coupon = await db.coupons.find_one({"code": code.upper(), "is_active": True})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    now = datetime.now(timezone.utc)
    
    # Normalize timezone-naive datetimes from MongoDB to UTC
    valid_from = coupon["valid_from"]
    valid_until = coupon["valid_until"]
    
    # Handle both datetime objects and ISO strings
    if isinstance(valid_from, str):
        valid_from = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
    elif valid_from.tzinfo is None:
        valid_from = valid_from.replace(tzinfo=timezone.utc)
    
    if isinstance(valid_until, str):
        valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
    elif valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    
    if valid_from > now or valid_until < now:
        raise HTTPException(status_code=400, detail="Coupon has expired")
    
    user_id = user["_id"] if user else None
    cart = await get_or_create_cart(user_id, session_id)
    
    # Check minimum order
    items = cart.get("items", [])
    subtotal = 0
    for item in items:
        product = PRODUCTS_MAP.get(item["product_id"])
        if product:
            variant = next((v for v in product["variants"] if v["id"] == item.get("variant_id")), product["variants"][0])
            subtotal += variant["price"] * item["quantity"]
    
    if subtotal < coupon.get("minimum_order", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order of R{coupon['minimum_order']} required")
    
    collection = db.carts if user_id else db.guest_carts
    key = "_id" if user_id else "session_id"
    value = user_id or session_id
    
    await collection.update_one(
        {key: value},
        {"$set": {"coupon_code": code.upper(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "message": "Coupon applied", 
        "coupon": {
            "code": code.upper(),
            "discount_type": coupon["discount_type"], 
            "discount_value": coupon["discount_value"]
        }
    }


@api_router.delete("/cart/coupon")
async def remove_coupon(
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = user["_id"] if user else None
    
    collection = db.carts if user_id else db.guest_carts
    key = "_id" if user_id else "session_id"
    value = user_id or session_id
    
    await collection.update_one(
        {key: value},
        {"$set": {"coupon_code": None, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Coupon removed"}


# ============ SHIPPING ROUTES ============

@api_router.get("/shipping/rates")
async def get_shipping_rates(province: str, subtotal: float):
    """Get shipping rates for a province"""
    if subtotal >= 399:
        return {
            "rates": [
                {"method": "standard", "name": "Standard Delivery (3-5 days)", "price": 0, "free": True},
                {"method": "express", "name": "Express Delivery (1-2 days)", "price": 0, "free": True}
            ],
            "free_shipping_threshold": 399,
            "message": "Free shipping on orders over R399"
        }
    
    zone_rates = SHIPPING_ZONES.get(province, SHIPPING_ZONES.get("Western Cape"))
    rates = []
    
    if "standard" in zone_rates:
        rates.append({"method": "standard", "name": "Standard Delivery (3-5 days)", "price": zone_rates["standard"]})
    if "express" in zone_rates:
        rates.append({"method": "express", "name": "Express Delivery (1-2 days)", "price": zone_rates["express"]})
    if "local_delivery" in zone_rates:
        rates.append({"method": "local_delivery", "name": "Local Delivery (Same Day)", "price": zone_rates["local_delivery"]})
    
    rates.append({"method": "collection", "name": "Store Collection", "price": 0})
    
    return {
        "rates": rates,
        "free_shipping_threshold": 399,
        "amount_until_free": max(0, 399 - subtotal)
    }


# ============ CHECKOUT & ORDER ROUTES ============

@api_router.post("/checkout")
async def create_checkout(
    checkout: CheckoutCreate,
    background_tasks: BackgroundTasks,
    user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = user["_id"] if user else None
    
    # For guest checkout, require email
    if not user_id and not checkout.guest_email:
        raise HTTPException(status_code=400, detail="Email required for guest checkout")
    
    cart = await get_or_create_cart(user_id, session_id)
    
    if not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Build order items
    order_items = []
    subtotal = 0.0
    
    for item in cart["items"]:
        product = PRODUCTS_MAP.get(item["product_id"])
        if not product:
            continue
        
        variant = next((v for v in product["variants"] if v["id"] == item.get("variant_id")), product["variants"][0])
        
        # Check stock
        if variant["stock_quantity"] < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = variant["price"] * item["quantity"]
        subtotal += item_total
        
        order_items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "variant_id": variant["id"],
            "variant_name": variant["name"],
            "sku": variant["sku"],
            "price": variant["price"],
            "quantity": item["quantity"],
            "total": item_total,
            "image_url": product["images"][0]["url"] if product["images"] else ""
        })
    
    # Calculate totals
    discount = 0.0
    coupon = None
    if cart.get("coupon_code"):
        coupon = await db.coupons.find_one({"code": cart["coupon_code"], "is_active": True})
        if coupon:
            if coupon["discount_type"] == "percentage":
                discount = subtotal * (coupon["discount_value"] / 100)
            elif coupon["discount_type"] == "fixed_amount":
                discount = min(coupon["discount_value"], subtotal)
    
    shipping_cost = calculate_shipping(
        subtotal - discount,
        checkout.shipping.method,
        checkout.shipping.address.province,
        checkout.is_subscription
    )
    
    vat = calculate_vat(subtotal - discount + shipping_cost)
    total = subtotal - discount + shipping_cost
    
    if total < 5.0:
        raise HTTPException(status_code=400, detail="Minimum order amount is R5.00")
    
    # Create order
    order_id = str(uuid.uuid4())
    order_number = generate_order_number()
    now = datetime.now(timezone.utc).isoformat()
    
    order_doc = {
        "_id": order_id,
        "order_number": order_number,
        "user_id": user_id,
        "guest_email": checkout.guest_email if not user_id else None,
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "shipping_cost": round(shipping_cost, 2),
        "vat": round(vat, 2),
        "total": round(total, 2),
        "status": OrderStatus.PENDING_PAYMENT,
        "payment_status": PaymentStatus.PENDING,
        "payment_method": checkout.payment_method,
        "shipping": {
            "method": checkout.shipping.method,
            "address": checkout.shipping.address.dict(),
            "notes": checkout.shipping.notes
        },
        "billing": {
            "same_as_shipping": checkout.billing.same_as_shipping,
            "address": checkout.billing.address.dict() if checkout.billing.address else checkout.shipping.address.dict()
        },
        "coupon_code": cart.get("coupon_code"),
        "created_at": now,
        "updated_at": now
    }
    
    await db.orders.insert_one(order_doc)
    
    # Generate payment based on method
    payment_data = None
    
    if checkout.payment_method == PaymentMethod.PAYFAST:
        # PayFast payment
        email = user["email"] if user else checkout.guest_email
        first_name = checkout.shipping.address.first_name
        last_name = checkout.shipping.address.last_name
        
        payfast_data = {
            "merchant_id": PAYFAST_MERCHANT_ID,
            "merchant_key": PAYFAST_MERCHANT_KEY,
            "return_url": f"{FRONTEND_URL}/order/success?order_id={order_id}",
            "cancel_url": f"{FRONTEND_URL}/order/cancel?order_id={order_id}",
            "notify_url": f"{BACKEND_URL}/api/webhooks/payfast",
            "m_payment_id": order_id,
            "amount": f"{total:.2f}",
            "item_name": f"Cape Ember Order {order_number}",
            "email_address": email,
            "name_first": first_name,
            "name_last": last_name
        }
        
        signature = generate_payfast_signature(payfast_data)
        payfast_data["signature"] = signature
        
        payment_data = {
            "method": "payfast",
            "host": get_payfast_host(),
            "fields": payfast_data
        }
    
    elif checkout.payment_method in [PaymentMethod.STITCH_CARD, PaymentMethod.STITCH_EFT]:
        # Stitch payment
        if not STITCH_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Stitch payments not configured")
        
        stitch_result = await create_stitch_payment(
            total,
            order_number,
            checkout.payment_method.value,
            f"{FRONTEND_URL}/order/success?order_id={order_id}"
        )
        
        # Store Stitch payment ID
        await db.orders.update_one(
            {"_id": order_id},
            {"$set": {"stitch_payment_id": stitch_result["id"]}}
        )
        
        payment_data = {
            "method": "stitch",
            "redirect_url": stitch_result["url"]
        }
    
    return {
        "order_id": order_id,
        "order_number": order_number,
        "total": total,
        "payment": payment_data
    }


# ============ SIMPLE ORDER ENDPOINTS (Legacy Frontend Support) ============

@api_router.post("/orders")
async def create_simple_order(
    order_data: SimpleOrderCreate,
    user: dict = Depends(get_current_user)
):
    """Create order using simple format for legacy frontend"""
    user_id = user["_id"]
    
    # Get cart
    cart = await db.carts.find_one({"_id": user_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Build order items
    order_items = []
    subtotal = 0.0
    
    for item in cart["items"]:
        product = PRODUCTS_MAP.get(item["product_id"])
        if not product:
            continue
        
        variant = next((v for v in product["variants"] if v["id"] == item.get("variant_id")), product["variants"][0])
        item_total = variant["price"] * item["quantity"]
        subtotal += item_total
        
        order_items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "variant_id": variant["id"],
            "variant_name": variant["name"],
            "sku": variant["sku"],
            "price": variant["price"],
            "quantity": item["quantity"],
            "total": item_total,
            "image_url": product["images"][0]["url"] if product["images"] else ""
        })
    
    # Calculate totals
    # In South Africa, product prices are inclusive of VAT
    # Shipping is a flat rate that accounts for VAT
    # Free shipping for subscriptions or orders over R399
    if order_data.is_subscription:
        shipping_cost = 0.0
    else:
        shipping_cost = 0.0 if subtotal >= 399 else 75.0
    total = subtotal + shipping_cost
    vat = calculate_vat(total)  # Extract VAT for record-keeping (included in total)
    
    # Generate order number and ID
    order_id = str(uuid.uuid4())
    order_count = await db.orders.count_documents({})
    order_number = f"CE-{(order_count + 1):06d}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Create order document
    order_doc = {
        "_id": order_id,
        "order_number": order_number,
        "user_id": user_id,
        "items": order_items,
        "subtotal": subtotal,
        "discount": 0.0,
        "shipping_cost": shipping_cost,
        "vat": vat,
        "total": total,
        "status": OrderStatus.PENDING.value,
        "payment_status": PaymentStatus.PENDING.value,
        "payment_method": order_data.payment_method or "payfast",
        "shipping": {
            "method": "standard",
            "address": order_data.shipping_address,
            "notes": None
        },
        "billing": {
            "same_as_shipping": True,
            "address": order_data.shipping_address
        },
        "is_subscription": order_data.is_subscription,
        "subscription_frequency": order_data.subscription_frequency,
        "created_at": now,
        "updated_at": now
    }
    
    await db.orders.insert_one(order_doc)
    
    # Generate WhatsApp link
    whatsapp_phone = "27810261618"
    items_text = ", ".join([f"{i['product_name']} x{i['quantity']}" for i in order_items])
    whatsapp_message = f"Hi! I just placed order {order_number}. Items: {items_text}. Total: R{total:.2f}"
    whatsapp_link = f"https://wa.me/{whatsapp_phone}?text={urllib.parse.quote(whatsapp_message)}"
    
    return {
        "order_id": order_id,
        "order_number": order_number,
        "total": total,
        "whatsapp_link": whatsapp_link
    }


@api_router.post("/payfast/create-payment")
async def create_payfast_payment(payment: SimplePaymentCreate, user: dict = Depends(get_current_user)):
    """Create PayFast payment for an existing order"""
    order = await db.orders.find_one({"_id": payment.order_id, "user_id": user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    payfast_data = {
        "merchant_id": PAYFAST_MERCHANT_ID,
        "merchant_key": PAYFAST_MERCHANT_KEY,
        "return_url": f"{FRONTEND_URL}/order/success?order_id={payment.order_id}",
        "cancel_url": f"{FRONTEND_URL}/order/cancel?order_id={payment.order_id}",
        "notify_url": f"{BACKEND_URL}/api/webhooks/payfast",
        "m_payment_id": payment.order_id,
        "amount": f"{order['total']:.2f}",
        "item_name": f"Cape Ember Order {order['order_number']}",
        "email_address": user["email"],
        "name_first": user.get("first_name", "Customer"),
        "name_last": user.get("last_name", "")
    }
    
    if PAYFAST_PASSPHRASE:
        payfast_data["passphrase"] = PAYFAST_PASSPHRASE
    
    signature = generate_payfast_signature(payfast_data)
    payfast_data["signature"] = signature
    
    # Remove passphrase from returned data
    if "passphrase" in payfast_data:
        del payfast_data["passphrase"]
    
    return {
        "payfast_host": get_payfast_host(),
        "fields": payfast_data
    }


@api_router.post("/stitch/create-payment")
async def create_stitch_payment_endpoint(payment: SimplePaymentCreate, user: dict = Depends(get_current_user)):
    """Create Stitch payment for an existing order"""
    if not STITCH_CLIENT_ID or not STITCH_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="Stitch payments not configured. Please use PayFast instead.")
    
    order = await db.orders.find_one({"_id": payment.order_id, "user_id": user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        stitch_result = await create_stitch_payment(
            order["total"],
            order["order_number"],
            "stitch_eft",
            f"{FRONTEND_URL}/order/success?order_id={payment.order_id}"
        )
        
        # Store Stitch payment ID
        await db.orders.update_one(
            {"_id": payment.order_id},
            {"$set": {
                "stitch_payment_id": stitch_result["id"],
                "payment_method": "stitch"
            }}
        )
        
        return {
            "redirect_url": stitch_result["url"],
            "payment_id": stitch_result["id"]
        }
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        logger.error(f"Stitch payment error: {e}")
        raise HTTPException(
            status_code=503, 
            detail="Stitch payment service temporarily unavailable. Please try PayFast or try again later."
        )


@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user), page: int = 1, limit: int = 10):
    skip = (page - 1) * limit
    
    orders = await db.orders.find(
        {"user_id": user["_id"]},
        {"_id": 1, "order_number": 1, "items": 1, "total": 1, "status": 1, "payment_status": 1, "created_at": 1}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.orders.count_documents({"user_id": user["_id"]})
    
    return {
        "orders": [{
            "id": o["_id"],
            "order_number": o["order_number"],
            "items": o["items"],
            "total": o["total"],
            "status": o["status"],
            "payment_status": o["payment_status"],
            "created_at": o["created_at"]
        } for o in orders],
        "total": total,
        "page": page,
        "total_pages": (total + limit - 1) // limit
    }


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: Optional[dict] = Depends(get_current_user_optional)):
    query = {"_id": order_id}
    if user:
        query["user_id"] = user["_id"]
    
    order = await db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "id": order["_id"],
        "order_number": order["order_number"],
        "items": order["items"],
        "subtotal": order["subtotal"],
        "discount": order["discount"],
        "shipping_cost": order["shipping_cost"],
        "vat": order["vat"],
        "total": order["total"],
        "status": order["status"],
        "payment_status": order["payment_status"],
        "payment_method": order["payment_method"],
        "shipping": order["shipping"],
        "billing": order["billing"],
        "tracking_number": order.get("tracking_number"),
        "created_at": order["created_at"],
        "updated_at": order["updated_at"]
    }


@api_router.post("/orders/{order_id}/reorder")
async def reorder(order_id: str, user: dict = Depends(get_current_user)):
    """Add items from a previous order to cart"""
    order = await db.orders.find_one({"_id": order_id, "user_id": user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    cart = await db.carts.find_one({"_id": user["_id"]})
    items = cart.get("items", []) if cart else []
    
    for item in order["items"]:
        existing = next((i for i in items if i["product_id"] == item["product_id"] and i.get("variant_id") == item.get("variant_id")), None)
        if existing:
            existing["quantity"] += item["quantity"]
        else:
            items.append({
                "product_id": item["product_id"],
                "variant_id": item.get("variant_id"),
                "quantity": item["quantity"]
            })
    
    await db.carts.update_one(
        {"_id": user["_id"]},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Items added to cart"}


# ============ WEBHOOK ROUTES ============

@api_router.post("/webhooks/payfast")
async def payfast_webhook(request: Request, background_tasks: BackgroundTasks):
    """PayFast ITN webhook handler"""
    if not await verify_payfast_itn(request):
        return Response(content="OK", status_code=200)
    
    form_data = await request.form()
    data = dict(form_data)
    
    logger.info(f"PayFast ITN received: {data}")
    
    order_id = data.get("m_payment_id")
    payment_status = data.get("payment_status")
    pf_payment_id = data.get("pf_payment_id")
    
    if not order_id:
        return Response(content="OK", status_code=200)
    
    order = await db.orders.find_one({"_id": order_id})
    if not order:
        logger.warning(f"Order not found: {order_id}")
        return Response(content="OK", status_code=200)
    
    now = datetime.now(timezone.utc).isoformat()
    
    if payment_status == "COMPLETE":
        # Update order status
        await db.orders.update_one(
            {"_id": order_id},
            {
                "$set": {
                    "status": OrderStatus.PAID,
                    "payment_status": PaymentStatus.COMPLETE,
                    "payfast_payment_id": pf_payment_id,
                    "paid_at": now,
                    "updated_at": now
                }
            }
        )
        
        # Reduce inventory
        for item in order["items"]:
            # In production, update actual inventory
            pass
        
        # Clear cart
        if order.get("user_id"):
            await db.carts.update_one({"_id": order["user_id"]}, {"$set": {"items": [], "coupon_code": None}})
        
        # Send confirmation email
        email = order.get("guest_email")
        if order.get("user_id"):
            user = await db.users.find_one({"_id": order["user_id"]})
            email = user["email"] if user else email
        
        if email:
            background_tasks.add_task(send_order_confirmation, order, email)
    
    elif payment_status == "CANCELLED":
        await db.orders.update_one(
            {"_id": order_id},
            {"$set": {"payment_status": PaymentStatus.CANCELLED, "updated_at": now}}
        )
    
    elif payment_status == "FAILED":
        await db.orders.update_one(
            {"_id": order_id},
            {"$set": {"payment_status": PaymentStatus.FAILED, "updated_at": now}}
        )
    
    # Store webhook event
    await db.webhook_events.insert_one({
        "provider": "payfast",
        "order_id": order_id,
        "payload": data,
        "received_at": now
    })
    
    return Response(content="OK", status_code=200)


@api_router.post("/webhooks/stitch")
async def stitch_webhook(request: Request, background_tasks: BackgroundTasks):
    """Stitch payment webhook handler"""
    body = await request.body()
    
    if not verify_stitch_webhook(request, body):
        logger.warning("Stitch webhook: Invalid signature")
        return Response(content="OK", status_code=200)
    
    import json
    data = json.loads(body)
    
    logger.info(f"Stitch webhook received: {data}")
    
    payment_id = data.get("data", {}).get("client", {}).get("paymentInitiationRequest", {}).get("id")
    status = data.get("data", {}).get("status")
    
    if not payment_id:
        return Response(content="OK", status_code=200)
    
    order = await db.orders.find_one({"stitch_payment_id": payment_id})
    if not order:
        logger.warning(f"Order not found for Stitch payment: {payment_id}")
        return Response(content="OK", status_code=200)
    
    now = datetime.now(timezone.utc).isoformat()
    
    if status == "PaymentReceived":
        await db.orders.update_one(
            {"_id": order["_id"]},
            {
                "$set": {
                    "status": OrderStatus.PAID,
                    "payment_status": PaymentStatus.COMPLETE,
                    "paid_at": now,
                    "updated_at": now
                }
            }
        )
        
        # Clear cart and send email
        if order.get("user_id"):
            await db.carts.update_one({"_id": order["user_id"]}, {"$set": {"items": [], "coupon_code": None}})
            user = await db.users.find_one({"_id": order["user_id"]})
            if user:
                background_tasks.add_task(send_order_confirmation, order, user["email"])
        elif order.get("guest_email"):
            background_tasks.add_task(send_order_confirmation, order, order["guest_email"])
    
    elif status in ["PaymentCancelled", "PaymentFailed"]:
        await db.orders.update_one(
            {"_id": order["_id"]},
            {"$set": {"payment_status": PaymentStatus.FAILED, "updated_at": now}}
        )
    
    # Store webhook event
    await db.webhook_events.insert_one({
        "provider": "stitch",
        "order_id": order["_id"],
        "payload": data,
        "received_at": now
    })
    
    return Response(content="OK", status_code=200)


# ============ WISHLIST ROUTES ============

@api_router.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    wishlist = await db.wishlists.find_one({"_id": user["_id"]})
    items = []
    
    for product_id in wishlist.get("items", []) if wishlist else []:
        product = PRODUCTS_MAP.get(product_id)
        if product:
            items.append({
                "id": product["id"],
                "name": product["name"],
                "slug": product["slug"],
                "price": product["variants"][0]["price"],
                "image": product["images"][0]["url"] if product["images"] else None,
                "stock_status": "in_stock" if sum(v["stock_quantity"] for v in product["variants"]) > 0 else "out_of_stock"
            })
    
    return {"items": items}


@api_router.post("/wishlist")
async def add_to_wishlist(item: WishlistItemAdd, user: dict = Depends(get_current_user)):
    if item.product_id not in PRODUCTS_MAP:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.wishlists.update_one(
        {"_id": user["_id"]},
        {"$addToSet": {"items": item.product_id}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Added to wishlist"}


@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlists.update_one(
        {"_id": user["_id"]},
        {"$pull": {"items": product_id}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Removed from wishlist"}


# ============ REVIEW ROUTES ============

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str, page: int = 1, limit: int = 10):
    skip = (page - 1) * limit
    
    reviews = await db.reviews.find(
        {"product_id": product_id, "is_approved": True}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.reviews.count_documents({"product_id": product_id, "is_approved": True})
    
    return {
        "reviews": [{
            "id": str(r["_id"]),
            "user_name": r["user_name"],
            "rating": r["rating"],
            "title": r["title"],
            "content": r["content"],
            "is_verified_purchase": r.get("is_verified_purchase", False),
            "helpful_votes": r.get("helpful_votes", 0),
            "created_at": r["created_at"]
        } for r in reviews],
        "total": total,
        "page": page,
        "average_rating": await get_average_rating(product_id)
    }


async def get_average_rating(product_id: str) -> float:
    pipeline = [
        {"$match": {"product_id": product_id, "is_approved": True}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    return round(result[0]["avg"], 1) if result else 0.0


@api_router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, review: ReviewCreate, user: dict = Depends(get_current_user)):
    if product_id not in PRODUCTS_MAP:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user has purchased this product
    has_purchased = await db.orders.find_one({
        "user_id": user["_id"],
        "items.product_id": product_id,
        "payment_status": PaymentStatus.COMPLETE
    })
    
    # Check if user already reviewed
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": user["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    now = datetime.now(timezone.utc).isoformat()
    
    review_doc = {
        "product_id": product_id,
        "user_id": user["_id"],
        "user_name": f"{user['first_name']} {user['last_name'][0]}.",
        "rating": review.rating,
        "title": review.title,
        "content": review.content,
        "is_verified_purchase": has_purchased is not None,
        "is_approved": True,  # Auto-approve for now
        "helpful_votes": 0,
        "created_at": now
    }
    
    result = await db.reviews.insert_one(review_doc)
    
    return {"message": "Review submitted", "review_id": str(result.inserted_id)}


# ============ NEWSLETTER ROUTES ============

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(email: EmailStr):
    existing = await db.newsletter.find_one({"email": email.lower()})
    if existing:
        return {"message": "Already subscribed"}
    
    await db.newsletter.insert_one({
        "_id": str(uuid.uuid4()),
        "email": email.lower(),
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    })
    
    return {"message": "Successfully subscribed to newsletter"}


@api_router.post("/newsletter/unsubscribe")
async def unsubscribe_newsletter(email: EmailStr):
    await db.newsletter.update_one(
        {"email": email.lower()},
        {"$set": {"is_active": False, "unsubscribed_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Unsubscribed from newsletter"}


# ============ CONTACT ROUTES ============

@api_router.post("/contact")
async def submit_contact(
    name: str,
    email: EmailStr,
    subject: str,
    message: str,
    background_tasks: BackgroundTasks
):
    await db.contact_submissions.insert_one({
        "_id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "subject": subject,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False
    })
    
    # TODO: Send email notification to admin
    
    return {"message": "Message sent successfully"}


# ============ ADMIN DASHBOARD ROUTES ============

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin: dict = Depends(get_admin_user)):
    """Get admin dashboard statistics"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Total orders and revenue
    all_orders = await db.orders.find({"payment_status": "complete"}).to_list(None)
    total_orders = len(all_orders)
    total_revenue = sum(order.get("total", 0) for order in all_orders)
    
    # Today's stats
    today_orders = [o for o in all_orders if o.get("created_at", "") >= today_start.isoformat()]
    orders_today = len(today_orders)
    revenue_today = sum(order.get("total", 0) for order in today_orders)
    
    # This week's stats
    week_orders = [o for o in all_orders if o.get("created_at", "") >= week_ago.isoformat()]
    orders_this_week = len(week_orders)
    revenue_this_week = sum(order.get("total", 0) for order in week_orders)
    
    # This month's stats
    month_orders = [o for o in all_orders if o.get("created_at", "") >= month_ago.isoformat()]
    orders_this_month = len(month_orders)
    revenue_this_month = sum(order.get("total", 0) for order in month_orders)
    
    # Pending orders
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "pending_payment", "processing"]}})
    
    # Low stock products (less than 10 units)
    low_stock_count = sum(
        1 for p in PRODUCTS 
        for v in p.get("variants", []) 
        if v.get("stock_quantity", 0) < 10
    )
    
    # New customers (registered this month)
    new_customers = await db.users.count_documents({
        "created_at": {"$gte": month_ago.isoformat()}
    })
    
    # Total customers
    total_customers = await db.users.count_documents({})
    
    # Recent orders
    recent_orders = await db.orders.find().sort("created_at", -1).limit(5).to_list(5)
    recent_orders_formatted = []
    for order in recent_orders:
        recent_orders_formatted.append({
            "id": order["_id"],
            "order_number": order.get("order_number", "N/A"),
            "customer_email": order.get("guest_email") or "Registered User",
            "total": order.get("total", 0),
            "status": order.get("status", "unknown"),
            "created_at": order.get("created_at", "")
        })
    
    # Top products by orders
    product_counts = {}
    for order in all_orders:
        for item in order.get("items", []):
            pid = item.get("product_id", "")
            product_counts[pid] = product_counts.get(pid, 0) + item.get("quantity", 1)
    
    top_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_products_formatted = []
    for pid, count in top_products:
        product = PRODUCTS_MAP.get(pid)
        if product:
            top_products_formatted.append({
                "id": pid,
                "name": product["name"],
                "units_sold": count,
                "revenue": count * product["variants"][0]["price"]
            })
    
    return {
        "overview": {
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "orders_today": orders_today,
            "revenue_today": round(revenue_today, 2),
            "orders_this_week": orders_this_week,
            "revenue_this_week": round(revenue_this_week, 2),
            "orders_this_month": orders_this_month,
            "revenue_this_month": round(revenue_this_month, 2),
            "pending_orders": pending_orders,
            "low_stock_products": low_stock_count,
            "new_customers": new_customers,
            "total_customers": total_customers
        },
        "recent_orders": recent_orders_formatted,
        "top_products": top_products_formatted
    }


@api_router.get("/admin/orders")
async def get_admin_orders(
    admin: dict = Depends(get_admin_user),
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get all orders with filtering and pagination"""
    query = {}
    if status:
        query["status"] = status
    
    total = await db.orders.count_documents(query)
    skip = (page - 1) * limit
    
    orders = await db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    orders_formatted = []
    for order in orders:
        # Get customer info if registered user
        customer_name = "Guest"
        customer_email = order.get("guest_email", "")
        
        if order.get("user_id"):
            user = await db.users.find_one({"_id": order["user_id"]})
            if user:
                customer_name = f"{user.get('first_name', '')} {user.get('last_name', '')}"
                customer_email = user.get("email", "")
        
        orders_formatted.append({
            "id": order["_id"],
            "order_number": order.get("order_number", "N/A"),
            "customer_name": customer_name,
            "customer_email": customer_email,
            "items_count": len(order.get("items", [])),
            "subtotal": order.get("subtotal", 0),
            "discount": order.get("discount", 0),
            "shipping_cost": order.get("shipping_cost", 0),
            "total": order.get("total", 0),
            "status": order.get("status", "unknown"),
            "payment_status": order.get("payment_status", "unknown"),
            "payment_method": order.get("payment_method", "unknown"),
            "shipping_address": order.get("shipping", {}).get("address", {}) if isinstance(order.get("shipping"), dict) else {},
            "created_at": order.get("created_at", ""),
            "updated_at": order.get("updated_at", "")
        })
    
    return {
        "orders": orders_formatted,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@api_router.get("/admin/orders/{order_id}")
async def get_admin_order_detail(order_id: str, admin: dict = Depends(get_admin_user)):
    """Get detailed order information"""
    order = await db.orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get customer info
    customer_info = None
    if order.get("user_id"):
        user = await db.users.find_one({"_id": order["user_id"]}, {"password_hash": 0})
        if user:
            customer_info = {
                "id": user["_id"],
                "name": f"{user.get('first_name', '')} {user.get('last_name', '')}",
                "email": user.get("email", ""),
                "phone": user.get("phone", "")
            }
    
    return {
        "id": order["_id"],
        "order_number": order.get("order_number", "N/A"),
        "customer": customer_info,
        "guest_email": order.get("guest_email"),
        "items": order.get("items", []),
        "subtotal": order.get("subtotal", 0),
        "discount": order.get("discount", 0),
        "shipping_cost": order.get("shipping_cost", 0),
        "vat": order.get("vat", 0),
        "total": order.get("total", 0),
        "status": order.get("status", "unknown"),
        "payment_status": order.get("payment_status", "unknown"),
        "payment_method": order.get("payment_method", "unknown"),
        "payment_reference": order.get("payment_reference"),
        "shipping": order.get("shipping", {}),
        "billing": order.get("billing", {}),
        "coupon_code": order.get("coupon_code"),
        "tracking_number": order.get("tracking_number"),
        "notes": order.get("notes"),
        "created_at": order.get("created_at", ""),
        "updated_at": order.get("updated_at", "")
    }


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    update: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    admin: dict = Depends(get_admin_user)
):
    """Update order status"""
    order = await db.orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {
        "status": update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if update.tracking_number:
        update_data["tracking_number"] = update.tracking_number
    if update.notes:
        update_data["notes"] = update.notes
    
    await db.orders.update_one({"_id": order_id}, {"$set": update_data})
    
    # Send notification email if shipped
    if update.status == "shipped" and update.tracking_number:
        email = order.get("guest_email") or ""
        if order.get("user_id"):
            user = await db.users.find_one({"_id": order["user_id"]})
            if user:
                email = user.get("email", "")
        if email:
            background_tasks.add_task(send_shipping_notification, order, update.tracking_number)
    
    return {"message": "Order status updated", "status": update.status}


@api_router.get("/admin/customers")
async def get_admin_customers(
    admin: dict = Depends(get_admin_user),
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get all customers with search and pagination"""
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.users.count_documents(query)
    skip = (page - 1) * limit
    
    users = await db.users.find(query, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    customers = []
    for user in users:
        # Get order count and total spent
        order_stats = await db.orders.aggregate([
            {"$match": {"user_id": user["_id"], "payment_status": "complete"}},
            {"$group": {"_id": None, "count": {"$sum": 1}, "total": {"$sum": "$total"}}}
        ]).to_list(1)
        
        stats = order_stats[0] if order_stats else {"count": 0, "total": 0}
        
        customers.append({
            "id": user["_id"],
            "email": user.get("email", ""),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "phone": user.get("phone", ""),
            "orders_count": stats.get("count", 0),
            "total_spent": round(stats.get("total", 0), 2),
            "is_admin": user.get("is_admin", False),
            "created_at": user.get("created_at", "")
        })
    
    return {
        "customers": customers,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@api_router.get("/admin/inventory")
async def get_admin_inventory(admin: dict = Depends(get_admin_user)):
    """Get inventory status for all products"""
    inventory = []
    
    for product in PRODUCTS:
        for variant in product.get("variants", []):
            stock = variant.get("stock_quantity", 0)
            inventory.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "variant_id": variant["id"],
                "variant_name": variant["name"],
                "sku": variant.get("sku", ""),
                "price": variant["price"],
                "stock_quantity": stock,
                "stock_status": "out_of_stock" if stock == 0 else "low_stock" if stock < 10 else "in_stock"
            })
    
    # Sort by stock quantity (lowest first)
    inventory.sort(key=lambda x: x["stock_quantity"])
    
    return {
        "inventory": inventory,
        "summary": {
            "total_products": len(PRODUCTS),
            "total_variants": len(inventory),
            "out_of_stock": sum(1 for i in inventory if i["stock_status"] == "out_of_stock"),
            "low_stock": sum(1 for i in inventory if i["stock_status"] == "low_stock"),
            "in_stock": sum(1 for i in inventory if i["stock_status"] == "in_stock")
        }
    }


class InventoryUpdate(BaseModel):
    stock_quantity: int

@api_router.put("/admin/inventory/{product_id}/{variant_id}")
async def update_inventory(
    product_id: str,
    variant_id: str,
    update: InventoryUpdate,
    admin: dict = Depends(get_admin_user)
):
    """Update stock quantity for a variant (NOTE: In production, this should update DB)"""
    # Find the product and variant
    product = PRODUCTS_MAP.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variant = next((v for v in product["variants"] if v["id"] == variant_id), None)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    # Update in memory (in production, this would update DB)
    variant["stock_quantity"] = update.stock_quantity
    
    return {
        "message": "Inventory updated",
        "product_id": product_id,
        "variant_id": variant_id,
        "new_stock": update.stock_quantity
    }


@api_router.get("/admin/coupons")
async def get_admin_coupons(admin: dict = Depends(get_admin_user)):
    """Get all coupons"""
    coupons = await db.coupons.find().to_list(100)
    
    coupons_formatted = []
    for coupon in coupons:
        coupons_formatted.append({
            "id": str(coupon.get("_id", "")),
            "code": coupon.get("code", ""),
            "description": coupon.get("description", ""),
            "discount_type": coupon.get("discount_type", ""),
            "discount_value": coupon.get("discount_value", 0),
            "minimum_order": coupon.get("minimum_order", 0),
            "is_active": coupon.get("is_active", False),
            "valid_from": coupon.get("valid_from", ""),
            "valid_until": coupon.get("valid_until", ""),
            "uses_count": coupon.get("uses_count", 0)
        })
    
    return {"coupons": coupons_formatted}


class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str  # percentage or fixed_amount
    discount_value: float
    minimum_order: float = 0
    valid_from: str
    valid_until: str
    is_active: bool = True

@api_router.post("/admin/coupons")
async def create_coupon(coupon: CouponCreate, admin: dict = Depends(get_admin_user)):
    """Create a new coupon"""
    # Check if code already exists
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_doc = {
        "code": coupon.code.upper(),
        "description": coupon.description,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "minimum_order": coupon.minimum_order,
        "valid_from": coupon.valid_from,
        "valid_until": coupon.valid_until,
        "is_active": coupon.is_active,
        "uses_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    
    return {"message": "Coupon created", "code": coupon.code.upper()}


@api_router.delete("/admin/coupons/{coupon_code}")
async def delete_coupon(coupon_code: str, admin: dict = Depends(get_admin_user)):
    """Delete a coupon"""
    result = await db.coupons.delete_one({"code": coupon_code.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon deleted"}


# ============ STATIC IMAGES ROUTE ============

@api_router.get("/images/products/{product_id}")
async def get_product_image(product_id: str):
    """Serve generated lifestyle product background images"""
    backgrounds_dir = APP_DIR / "generated_backgrounds"
    image_path = backgrounds_dir / f"{product_id}_background.png"
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        path=str(image_path),
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=31536000"}
    )


# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "Cape Ember Coffee API", "version": "2.0.0", "status": "healthy"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# ============ INCLUDE ROUTERS ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Seed test coupon and admin user on startup"""
    # Create a test coupon if it doesn't exist
    test_coupon = await db.coupons.find_one({"code": "WELCOME10"})
    if not test_coupon:
        await db.coupons.insert_one({
            "code": "WELCOME10",
            "discount_type": "percentage",
            "discount_value": 10,
            "minimum_order": 100,
            "is_active": True,
            "valid_from": "2024-01-01T00:00:00+00:00",
            "valid_until": "2027-12-31T23:59:59+00:00",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Created test coupon: WELCOME10")
    else:
        # Update existing coupon to use ISO strings if needed
        await db.coupons.update_one(
            {"code": "WELCOME10"},
            {"$set": {
                "valid_from": "2024-01-01T00:00:00+00:00",
                "valid_until": "2027-12-31T23:59:59+00:00"
            }}
        )
    
    # Create admin user if it doesn't exist
    admin_email = "admin@capeember.co.za"
    admin_password = "EmberAdmin2024!"
    admin_user = await db.users.find_one({"email": admin_email})
    if not admin_user:
        admin_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        await db.users.insert_one({
            "_id": admin_id,
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "first_name": "Admin",
            "last_name": "User",
            "phone": "",
            "addresses": [],
            "accepts_marketing": False,
            "is_admin": True,
            "created_at": now,
            "updated_at": now
        })
        logger.info(f"Created admin user: {admin_email}")
    else:
        # Ensure existing admin has is_admin flag AND correct password
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {
                "is_admin": True,
                "password_hash": hash_password(admin_password)
            }}
        )
        logger.info(f"Updated admin user password: {admin_email}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ============ SEO ROUTES ============

@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    """Generate robots.txt for SEO"""
    content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /api/

Sitemap: https://capeembercoffee.co.za/sitemap.xml
"""
    return content


@app.get("/sitemap.xml")
async def sitemap_xml():
    """Generate XML sitemap for SEO"""
    base_url = "https://capeembercoffee.co.za"
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    urls = [
        {"loc": f"{base_url}/", "changefreq": "weekly", "priority": "1.0"},
        {"loc": f"{base_url}/shop", "changefreq": "daily", "priority": "0.9"},
        {"loc": f"{base_url}/about", "changefreq": "monthly", "priority": "0.7"},
        {"loc": f"{base_url}/subscriptions", "changefreq": "weekly", "priority": "0.8"},
        {"loc": f"{base_url}/brew-guide", "changefreq": "monthly", "priority": "0.6"},
    ]
    
    # Add product pages
    for product in PRODUCTS:
        urls.append({
            "loc": f"{base_url}/product/{product['slug']}",
            "changefreq": "weekly",
            "priority": "0.8"
        })
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in urls:
        xml_content += f"""  <url>
    <loc>{url['loc']}</loc>
    <lastmod>{now}</lastmod>
    <changefreq>{url['changefreq']}</changefreq>
    <priority>{url['priority']}</priority>
  </url>\n"""
    
    xml_content += '</urlset>'
    
    return Response(content=xml_content, media_type="application/xml")

