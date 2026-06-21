from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import urllib.parse
import httpx
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
APP_DIR = ROOT_DIR.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'cape-ember-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# PayFast Config
PAYFAST_MERCHANT_ID = os.environ.get('PAYFAST_MERCHANT_ID', '10000100')
PAYFAST_MERCHANT_KEY = os.environ.get('PAYFAST_MERCHANT_KEY', '46f0cd694581a')
PAYFAST_PASSPHRASE = os.environ.get('PAYFAST_PASSPHRASE', '')
PAYFAST_SANDBOX = os.environ.get('PAYFAST_SANDBOX', 'true').lower() == 'true'

# Create the main app
app = FastAPI(title="Cape Ember Coffee API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Product(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    flavor_notes: str
    price: float
    image_url: str
    roast_level: str
    weight: str
    is_bundle: bool = False
    bundle_items: Optional[List[str]] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int

class CartItemResponse(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int
    image_url: str

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    shipping: float
    total: float

class AddressModel(BaseModel):
    street: str
    city: str
    province: str
    postal_code: str
    country: str = "South Africa"

class OrderCreate(BaseModel):
    shipping_address: AddressModel
    is_subscription: bool = False
    subscription_frequency: Optional[str] = None  # weekly, biweekly, monthly

class SubscriptionCreate(BaseModel):
    product_id: str
    quantity: int
    frequency: str  # weekly, biweekly, monthly
    shipping_address: AddressModel

class PaymentCreate(BaseModel):
    order_id: str

class RecommendationRequest(BaseModel):
    preferences: Optional[str] = None

# ============ PRODUCT DATA ============

PRODUCTS = [
    Product(
        id="fynbos-roast",
        name="Fynbos Roast",
        slug="fynbos-roast",
        description="Inspired by the wild fynbos of the Cape, this coffee offers a grounded, comforting cup with natural sweetness. A smooth, nutty, and balanced medium roast perfect for everyday enjoyment.",
        flavor_notes="Smooth · Nutty · Balanced",
        price=149.00,
        image_url="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/s93qex0b_77A74D65-C0D2-4A33-9348-2B0D5FE7082C.jpeg",
        roast_level="Medium",
        weight="250g"
    ),
    Product(
        id="garden-route",
        name="Garden Route Blend",
        slug="garden-route-blend",
        description="A tribute to South Africa's iconic coast. This balanced house blend offers a smooth cup with hints of cocoa and gentle citrus, crafted for everyday enjoyment.",
        flavor_notes="Smooth · Cocoa · Gentle Citrus",
        price=149.00,
        image_url="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/bvwasl9r_81ABD9FE-73FC-4C42-BF11-D3A0A1024683.jpeg",
        roast_level="Medium",
        weight="250g"
    ),
    Product(
        id="ember-reserve",
        name="Ember Reserve",
        slug="ember-reserve",
        description="Crafted for depth and intensity. Ember Reserve delivers a bold, lingering finish with rich dark chocolate notes. A premium dark roast from Colombia for those who appreciate depth.",
        flavor_notes="Rich · Dark Chocolate · Intense",
        price=159.00,
        image_url="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/urotn845_DA24A032-67E2-4343-9612-0534B6EA7394.jpeg",
        roast_level="Dark",
        weight="250g"
    ),
    Product(
        id="karoo-horizon",
        name="Karoo Horizon",
        slug="karoo-horizon",
        description="From the vast, open plains of the Karoo, this expressive Ethiopian offers delicate blueberry, wildflower notes, and a relaxed honey finish. A limited release light roast.",
        flavor_notes="Floral · Blueberry · Bright",
        price=169.00,
        image_url="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/7rra3n1s_38C77683-E4ED-4917-95F8-08997E2C06FE.jpeg",
        roast_level="Light",
        weight="250g"
    ),
    Product(
        id="landscape-bundle",
        name="Landscape Range Bundle",
        slug="landscape-bundle",
        description="South African landscapes in every cup. Experience the complete Cape Ember journey with all four signature blends - from the wild fynbos coast to the vast Karoo plains.",
        flavor_notes="Complete Collection · 4 x 250g",
        price=599.00,
        image_url="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/2yv1tstu_0028652C-25DC-4D60-B03B-3259460E5E93.jpeg",
        roast_level="Variety",
        weight="4 x 250g",
        is_bundle=True,
        bundle_items=["fynbos-roast", "garden-route", "ember-reserve", "karoo-horizon"]
    )
]

PRODUCTS_MAP = {p.id: p for p in PRODUCTS}

# ============ HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": payload["sub"]}, {"_id": 1, "email": 1, "first_name": 1, "last_name": 1, "phone": 1})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_payfast_host() -> str:
    return "sandbox.payfast.co.za" if PAYFAST_SANDBOX else "www.payfast.co.za"

def generate_payfast_signature(data: Dict[str, str]) -> str:
    filtered = {k: v for k, v in data.items() if k != "signature" and v is not None and v != ""}
    sorted_items = sorted(filtered.items(), key=lambda kv: kv[0])
    parts = []
    for key, value in sorted_items:
        encoded_value = urllib.parse.quote(str(value).strip(), safe='')
        parts.append(f"{key}={encoded_value}")
    param_string = "&".join(parts)
    
    if PAYFAST_PASSPHRASE:
        passphrase_encoded = urllib.parse.quote(PAYFAST_PASSPHRASE.strip(), safe='')
        param_string = f"{param_string}&passphrase={passphrase_encoded}"
    
    return hashlib.md5(param_string.encode("utf-8")).hexdigest()

def generate_whatsapp_link(order_id: str, total: float) -> str:
    phone = "27810261618"
    message = f"Hi Cape Ember! I just placed order #{order_id[:8]} for R{total:.2f}. Looking forward to my coffee!"
    encoded_message = urllib.parse.quote(message)
    return f"https://wa.me/{phone}?text={encoded_message}"

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create empty cart for user
    await db.carts.insert_one({"_id": user_id, "items": [], "updated_at": datetime.now(timezone.utc).isoformat()})
    
    token = create_token(user_id, user_data.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["_id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["_id"],
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            phone=user.get("phone")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["_id"],
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        phone=user.get("phone")
    )

# ============ PRODUCTS ROUTES ============

@api_router.get("/products", response_model=List[Product])
async def get_products():
    return PRODUCTS

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = PRODUCTS_MAP.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ============ CART ROUTES ============

@api_router.get("/cart", response_model=CartResponse)
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"_id": user["_id"]})
    if not cart:
        cart = {"_id": user["_id"], "items": []}
        await db.carts.insert_one(cart)
    
    items = []
    subtotal = 0.0
    for item in cart.get("items", []):
        product = PRODUCTS_MAP.get(item["product_id"])
        if product:
            items.append(CartItemResponse(
                product_id=product.id,
                product_name=product.name,
                price=product.price,
                quantity=item["quantity"],
                image_url=product.image_url
            ))
            subtotal += product.price * item["quantity"]
    
    shipping = 0.0 if subtotal >= 399 else 75.0
    return CartResponse(items=items, subtotal=subtotal, shipping=shipping, total=subtotal + shipping)

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    if item.product_id not in PRODUCTS_MAP:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await db.carts.find_one({"_id": user["_id"]})
    if not cart:
        cart = {"_id": user["_id"], "items": []}
    
    # Check if product already in cart
    items = cart.get("items", [])
    found = False
    for cart_item in items:
        if cart_item["product_id"] == item.product_id:
            cart_item["quantity"] += item.quantity
            found = True
            break
    
    if not found:
        items.append({"product_id": item.product_id, "quantity": item.quantity})
    
    await db.carts.update_one(
        {"_id": user["_id"]},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Item added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"_id": user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    if item.quantity <= 0:
        items = [i for i in items if i["product_id"] != item.product_id]
    else:
        for cart_item in items:
            if cart_item["product_id"] == item.product_id:
                cart_item["quantity"] = item.quantity
                break
    
    await db.carts.update_one(
        {"_id": user["_id"]},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart updated"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"_id": user["_id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"_id": user["_id"]},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart cleared"}

# ============ ORDERS ROUTES ============

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"_id": user["_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate totals
    items = []
    subtotal = 0.0
    for item in cart["items"]:
        product = PRODUCTS_MAP.get(item["product_id"])
        if product:
            items.append({
                "product_id": product.id,
                "product_name": product.name,
                "price": product.price,
                "quantity": item["quantity"]
            })
            subtotal += product.price * item["quantity"]
    
    shipping = 0.0 if subtotal >= 399 else 75.0
    total = subtotal + shipping
    
    if total < 5.0:
        raise HTTPException(status_code=400, detail="Minimum order amount is R5.00")
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "_id": order_id,
        "user_id": user["_id"],
        "items": items,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "shipping_address": order_data.shipping_address.model_dump(),
        "status": "pending_payment",
        "is_subscription": order_data.is_subscription,
        "subscription_frequency": order_data.subscription_frequency,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    return {
        "order_id": order_id,
        "total": total,
        "status": "pending_payment",
        "whatsapp_link": generate_whatsapp_link(order_id, total)
    }

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["_id"]}, {"_id": 1, "items": 1, "total": 1, "status": 1, "created_at": 1, "is_subscription": 1}).sort("created_at", -1).to_list(100)
    return [{
        "id": o["_id"],
        "items": o["items"],
        "total": o["total"],
        "status": o["status"],
        "created_at": o["created_at"],
        "is_subscription": o.get("is_subscription", False)
    } for o in orders]

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"_id": order_id, "user_id": user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "id": order["_id"],
        "items": order["items"],
        "subtotal": order["subtotal"],
        "shipping": order["shipping"],
        "total": order["total"],
        "shipping_address": order["shipping_address"],
        "status": order["status"],
        "is_subscription": order.get("is_subscription", False),
        "subscription_frequency": order.get("subscription_frequency"),
        "created_at": order["created_at"]
    }

# ============ SUBSCRIPTIONS ROUTES ============

@api_router.post("/subscriptions")
async def create_subscription(sub_data: SubscriptionCreate, user: dict = Depends(get_current_user)):
    product = PRODUCTS_MAP.get(sub_data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    sub_id = str(uuid.uuid4())
    sub_doc = {
        "_id": sub_id,
        "user_id": user["_id"],
        "product_id": product.id,
        "product_name": product.name,
        "quantity": sub_data.quantity,
        "price_per_delivery": product.price * sub_data.quantity,
        "frequency": sub_data.frequency,
        "shipping_address": sub_data.shipping_address.model_dump(),
        "status": "active",
        "next_delivery": (datetime.now(timezone.utc) + timedelta(days=7 if sub_data.frequency == "weekly" else 14 if sub_data.frequency == "biweekly" else 30)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(sub_doc)
    return {"subscription_id": sub_id, "message": "Subscription created", "next_delivery": sub_doc["next_delivery"]}

@api_router.get("/subscriptions")
async def get_subscriptions(user: dict = Depends(get_current_user)):
    subs = await db.subscriptions.find({"user_id": user["_id"]}).to_list(100)
    return [{
        "id": s["_id"],
        "product_name": s["product_name"],
        "quantity": s["quantity"],
        "price_per_delivery": s["price_per_delivery"],
        "frequency": s["frequency"],
        "status": s["status"],
        "next_delivery": s["next_delivery"]
    } for s in subs]

@api_router.put("/subscriptions/{sub_id}/pause")
async def pause_subscription(sub_id: str, user: dict = Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"_id": sub_id, "user_id": user["_id"]},
        {"$set": {"status": "paused"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription paused"}

@api_router.put("/subscriptions/{sub_id}/resume")
async def resume_subscription(sub_id: str, user: dict = Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"_id": sub_id, "user_id": user["_id"]},
        {"$set": {"status": "active"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription resumed"}

@api_router.delete("/subscriptions/{sub_id}")
async def cancel_subscription(sub_id: str, user: dict = Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"_id": sub_id, "user_id": user["_id"]},
        {"$set": {"status": "cancelled"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription cancelled"}

# ============ PAYFAST ROUTES ============

@api_router.post("/payfast/create-payment")
async def create_payfast_payment(payment_data: PaymentCreate, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"_id": payment_data.order_id, "user_id": user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] != "pending_payment":
        raise HTTPException(status_code=400, detail="Order already processed")
    
    amount = order["total"]
    m_payment_id = str(uuid.uuid4())
    
    # Get frontend URL for return/cancel
    frontend_url = os.environ.get('FRONTEND_URL', 'https://axis-creator.preview.emergentagent.com')
    
    payfast_data = {
        "merchant_id": PAYFAST_MERCHANT_ID,
        "merchant_key": PAYFAST_MERCHANT_KEY,
        "return_url": f"{frontend_url}/payment/success?order_id={order['_id']}",
        "cancel_url": f"{frontend_url}/payment/cancel?order_id={order['_id']}",
        "notify_url": f"{os.environ.get('REACT_APP_BACKEND_URL', 'https://axis-creator.preview.emergentagent.com')}/api/payfast/itn",
        "m_payment_id": m_payment_id,
        "amount": f"{amount:.2f}",
        "item_name": f"Cape Ember Coffee Order #{order['_id'][:8]}",
        "email_address": user["email"],
        "name_first": user["first_name"],
        "name_last": user["last_name"],
    }
    
    signature = generate_payfast_signature(payfast_data)
    payfast_data["signature"] = signature
    
    # Store payment record
    await db.payments.insert_one({
        "_id": m_payment_id,
        "order_id": order["_id"],
        "amount": amount,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "payfast_host": get_payfast_host(),
        "fields": payfast_data
    }

@api_router.post("/payfast/itn")
async def payfast_itn(request: Request):
    form = await request.form()
    data = dict(form)
    
    logger.info(f"Received ITN: {data}")
    
    # Verify signature
    received_signature = data.get("signature", "")
    our_signature = generate_payfast_signature(data)
    
    if received_signature != our_signature:
        logger.warning("Invalid ITN signature")
        return Response(content="OK", status_code=200)
    
    m_payment_id = data.get("m_payment_id")
    pf_payment_id = data.get("pf_payment_id")
    payment_status = data.get("payment_status")
    amount_gross = float(data.get("amount_gross", "0"))
    
    # Find payment
    payment = await db.payments.find_one({"_id": m_payment_id})
    if not payment:
        logger.warning(f"Payment not found: {m_payment_id}")
        return Response(content="OK", status_code=200)
    
    # Update payment status
    new_status = "complete" if payment_status == "COMPLETE" else "failed"
    await db.payments.update_one(
        {"_id": m_payment_id},
        {"$set": {"status": new_status, "pf_payment_id": pf_payment_id, "raw_itn": data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update order status
    if new_status == "complete":
        await db.orders.update_one(
            {"_id": payment["order_id"]},
            {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        # Clear cart
        order = await db.orders.find_one({"_id": payment["order_id"]})
        if order:
            await db.carts.update_one({"_id": order["user_id"]}, {"$set": {"items": []}})
    
    return Response(content="OK", status_code=200)

@api_router.get("/payfast/payment-status")
async def get_payment_status(m_payment_id: str = Query(...)):
    payment = await db.payments.find_one({"_id": m_payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"status": payment["status"]}

# ============ AI RECOMMENDATIONS ============

@api_router.post("/recommendations")
async def get_recommendations(req: RecommendationRequest, user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            # Return default recommendations if no AI key
            return {"recommendations": [PRODUCTS[0].id, PRODUCTS[2].id], "message": "Based on our bestsellers"}
        
        # Get user's order history
        orders = await db.orders.find({"user_id": user["_id"], "status": "paid"}).to_list(10)
        order_history = []
        for o in orders:
            for item in o.get("items", []):
                order_history.append(item["product_name"])
        
        products_info = "\n".join([f"- {p.name}: {p.flavor_notes} (R{p.price})" for p in PRODUCTS if not p.is_bundle])
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"rec-{user['_id']}",
            system_message="You are a coffee expert at Cape Ember Coffee Co. Based on customer preferences and history, recommend 2 coffee products. Return ONLY a JSON object with 'recommendations' (array of product IDs) and 'message' (brief explanation). Product IDs are: fynbos-roast, garden-route, ember-reserve, karoo-horizon"
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Customer preferences: {req.preferences or 'Not specified'}
Previous orders: {', '.join(order_history) if order_history else 'New customer'}

Available products:
{products_info}

Recommend 2 products that would suit this customer."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        import json
        try:
            # Try to extract JSON from response
            text = response.text if hasattr(response, 'text') else str(response)
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                result = json.loads(text[start:end])
                return result
        except:
            pass
        
        return {"recommendations": ["fynbos-roast", "ember-reserve"], "message": "Our most popular choices for new customers"}
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        return {"recommendations": ["fynbos-roast", "ember-reserve"], "message": "Our most popular choices"}

@api_router.get("/recommendations/quick")
async def get_quick_recommendations():
    """Public endpoint for quick recommendations without auth"""
    return {
        "recommendations": [
            {"id": "fynbos-roast", "name": "Fynbos Roast", "reason": "Bestseller - smooth and balanced"},
            {"id": "landscape-bundle", "name": "Landscape Bundle", "reason": "Best value - try all four blends"}
        ]
    }

# ============ NEWSLETTER ============

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(email: EmailStr = Query(...)):
    existing = await db.newsletter.find_one({"email": email.lower()})
    if existing:
        return {"message": "Already subscribed"}
    
    await db.newsletter.insert_one({
        "_id": str(uuid.uuid4()),
        "email": email.lower(),
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Successfully subscribed to newsletter"}

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "Cape Ember Coffee API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============ PRODUCT IMAGES ============

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

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
