"""
Cape Ember Coffee - Product Image Background Generator
Generates lifestyle backgrounds for product images
"""
import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Product background prompts - South African lifestyle aesthetic
PRODUCT_BACKGROUNDS = {
    "fynbos-roast": {
        "name": "Fynbos Roast",
        "prompt": "Professional product photography background for premium coffee bag, warm golden morning light, Cape Town fynbos vegetation in soft focus background, wooden rustic table surface, scattered coffee beans, steam rising from ceramic cup nearby, earthy warm tones, terracotta and sage green accents, premium lifestyle photography, 4k quality, soft shadows"
    },
    "garden-route": {
        "name": "Garden Route Blend",
        "prompt": "Professional product photography background for premium coffee bag, lush green forest backdrop inspired by South African Garden Route, morning mist, wooden deck surface, fresh green leaves scattered, warm natural lighting, earthy brown and forest green tones, lifestyle photography, premium quality, artisanal coffee aesthetic"
    },
    "ember-reserve": {
        "name": "Ember Reserve",
        "prompt": "Professional product photography background for premium dark roast coffee bag, dramatic Drakensberg mountain silhouette at golden hour, dark slate stone surface, rich warm amber lighting, smoke wisps, dark chocolate pieces scattered, moody premium atmosphere, deep browns and copper tones, luxury coffee aesthetic"
    },
    "karoo-horizon": {
        "name": "Karoo Horizon",
        "prompt": "Professional product photography background for premium light roast coffee bag, vast Karoo desert landscape at sunrise, soft pink and gold sky, weathered wooden surface, dried wildflowers, honey jar nearby, bright airy atmosphere, warm sand and terracotta tones, artisanal specialty coffee photography"
    }
}

async def generate_backgrounds():
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        print("Error: EMERGENT_LLM_KEY not found")
        return
    
    image_gen = OpenAIImageGeneration(api_key=api_key)
    output_dir = Path("/app/generated_backgrounds")
    output_dir.mkdir(exist_ok=True)
    
    for product_id, info in PRODUCT_BACKGROUNDS.items():
        print(f"\n🎨 Generating background for {info['name']}...")
        try:
            images = await image_gen.generate_images(
                prompt=info['prompt'],
                model="gpt-image-1",
                number_of_images=1
            )
            
            if images and len(images) > 0:
                output_path = output_dir / f"{product_id}_background.png"
                with open(output_path, "wb") as f:
                    f.write(images[0])
                print(f"   ✅ Saved to {output_path}")
                
                # Also save base64 for easy use
                b64 = base64.b64encode(images[0]).decode('utf-8')
                b64_path = output_dir / f"{product_id}_background.b64"
                with open(b64_path, "w") as f:
                    f.write(b64)
            else:
                print(f"   ❌ No image generated for {info['name']}")
                
        except Exception as e:
            print(f"   ❌ Error generating {info['name']}: {e}")

if __name__ == "__main__":
    asyncio.run(generate_backgrounds())
