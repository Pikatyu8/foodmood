import requests
import random
import math
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from geopy.distance import geodesic
from typing import List

app = FastAPI(
    title="Store Finder API",
    description="API для поиска оптимальных магазинов с учетом лени и бюджета пользователя",
    version="1.2.4"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_BASKET_PRICE = 1000 
PRICE_MULTIPLIERS = {
    "азбука вкуса": 1.8,
    "вкусвилл": 1.4,
    "перекресток": 1.2,
    "спар": 1.2,
    "spar": 1.2,
    "пятерочка": 0.9,
    "магнит": 0.9,
    "дикси": 0.85,
    "чижик": 0.7
}

# Меняем приоритет: ставим самые быстрые серверы первыми
OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",          # Основной сервер FOSSGIS (самый мощный)
    "https://lz4.overpass-api.de/api/interpreter",      # Первое официальное зеркало
    "https://z.overpass-api.de/api/interpreter",        # Второе официальное зеркало
    "https://overpass.private.coffee/api/interpreter"   # Альтернативный сервер (бывший kumi.systems)
]

class SearchRequest(BaseModel):
    lat: float = Field(..., description="Широта пользователя", example=55.753630)
    lon: float = Field(..., description="Долгота пользователя", example=37.620070)
    radius_meters: int = Field(1500, description="Радиус поиска в метрах", ge=100, le=30000)
    mobility: int = Field(..., description="Насколько лень идти (от 1 до 5)", ge=1, le=5)
    solvency: int = Field(..., description="Насколько вы богаты (от 1 до 5)", ge=1, le=5)

class StoreResponse(BaseModel):
    name: str
    distance_meters: int
    estimated_price_rub: int
    score: float
    lat: float
    lon: float

def generate_mock_stores(lat: float, lon: float, radius_meters: int) -> List[dict]:
    mock_brands = [
        ("Пятерочка", 0.9),
        ("Магнит", 0.9),
        ("Дикси", 0.85),
        ("ВкусВилл", 1.4),
        ("Перекресток", 1.2),
        ("Азбука Вкуса", 1.8),
        ("Чижик", 0.7)
    ]
    stores = []
    for i in range(random.randint(5, 8)):
        brand, multiplier = random.choice(mock_brands)
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(150, radius_meters)
        
        offset_lat = (dist * math.cos(angle)) / 111000.0
        offset_lon = (dist * math.sin(angle)) / (111000.0 * math.cos(math.radians(lat)))
        
        store_lat = lat + offset_lat
        store_lon = lon + offset_lon
        
        stores.append({
            "name": f"{brand} (Резервный режим)",
            "distance": dist,
            "estimated_price": BASE_BASKET_PRICE * multiplier,
            "lat": store_lat,
            "lon": store_lon
        })
    return stores

@app.post("/api/v1/recommend-stores", response_model=List[StoreResponse])
def recommend_stores(request: SearchRequest):
    user_coords = (request.lat, request.lon)
    
    print(f"\n[START] Получен запрос на подбор магазинов.")
    print(f"  -> Координаты пользователя: {request.lat}, {request.lon}")
    print(f"  -> Параметры: радиус={request.radius_meters}м, лень={request.mobility}, бюджет={request.solvency}")
    
    if request.radius_meters > 5000:
        shop_targets = f'nwr["shop"="supermarket"](around:{request.radius_meters},{request.lat},{request.lon});'
    else:
        shop_targets = f"""
        nwr["shop"="supermarket"](around:{request.radius_meters},{request.lat},{request.lon});
        nwr["shop"="convenience"](around:{request.radius_meters},{request.lat},{request.lon});
        """

    overpass_query = f"""
    [out:json][timeout:5];
    (
      {shop_targets}
    );
    out center;
    """
    
    # Заголовки, полностью удовлетворяющие новым требованиям Overpass API.
    # Реалистичный почтовый адрес и отсутствие фраз вроде 'example.com' защищают от бана.
    headers = {
        'Accept': 'application/json, */*',
        'User-Agent': 'DavidFoodMoodSearchApp/1.3 (contact: david.polyakov.dev@yandex.ru)',
        'Referer': 'http://localhost:5173'
    }
    data = None
    
    print("  -> Начинаем опрос серверов Overpass API...")
    for i, server_url in enumerate(OVERPASS_SERVERS, start=1):
        print(f"     [{i}/{len(OVERPASS_SERVERS)}] Отправка запроса к {server_url} ...")
        start_time = time.time()
        try:
            response = requests.post(server_url, data={'data': overpass_query}, headers=headers, timeout=5.0)
            duration = time.time() - start_time
            print(f"     <- Ответ от {server_url} получен за {duration:.2f} сек. Статус: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                break
            else:
                print(f"     ! Сервер вернул некорректный статус-код: {response.status_code}")
        except requests.Timeout:
            duration = time.time() - start_time
            print(f"     x Превышен таймаут (5.0s) для {server_url} за {duration:.2f} сек.")
        except requests.RequestException as e:
            duration = time.time() - start_time
            print(f"     x Сетевая ошибка при запросе к {server_url} за {duration:.2f} сек: {e}")
            
    raw_candidates = []
    
    if data is None:
        print("  [INFO] Все внешние API недоступны. Переход на генерацию mock-данных.")
        raw_candidates = generate_mock_stores(request.lat, request.lon, request.radius_meters)
    elif not data.get('elements'):
        print("  [INFO] API ответило успешно, но в данном радиусе нет магазинов. Переход на mock-данные.")
        raw_candidates = generate_mock_stores(request.lat, request.lon, request.radius_meters)
    else:
        print(f"  [SUCCESS] Найдено реальных объектов в OSM: {len(data['elements'])}")
        for element in data.get('elements', []):
            tags = element.get('tags', {})
            original_name = tags.get('name', 'Продуктовый магазин')
            
            store_lat = element.get('lat') or element.get('center', {}).get('lat')
            store_lon = element.get('lon') or element.get('center', {}).get('lon')
            if not store_lat or not store_lon:
                continue
                
            distance_meters = geodesic(user_coords, (store_lat, store_lon)).meters
            
            raw_candidates.append({
                "name": original_name,
                "distance": distance_meters,
                "lat": store_lat,
                "lon": store_lon
            })
            
    if not raw_candidates:
        print("  [END] Список кандидатов пуст. Возвращаем пустой результат.")
        return []
        
    raw_candidates = sorted(raw_candidates, key=lambda x: x['distance'])
    closest_candidates = raw_candidates[:30]
    
    found_stores = []
    for store in closest_candidates:
        lower_name = store["name"].lower()
        
        current_multiplier = 1.0
        for brand, multiplier in PRICE_MULTIPLIERS.items():
            if brand in lower_name:
                current_multiplier = multiplier
                break
                
        estimated_price = BASE_BASKET_PRICE * current_multiplier
        
        found_stores.append({
            "name": store["name"],
            "distance": store["distance"],
            "estimated_price": estimated_price,
            "lat": store["lat"],
            "lon": store["lon"]
        })
        
    candidate_stores = found_stores[:15]
    
# Нормируем расстояние по максимальному радиусу поиска
    max_distance = float(request.radius_meters)
    if max_distance == 0: max_distance = 1.0
    
    # Рассчитываем целевой мультипликатор цены для пользователя (от 0.7 до 1.8)
    ideal_multiplier = 0.7 + (5 - request.solvency) * 0.275
    
    scored_stores = []
    for store in candidate_stores:
        dist = store["distance"]
        price = store["estimated_price"]
        
        # Определяем мультипликатор текущего магазина
        current_multiplier = price / BASE_BASKET_PRICE
        
        # Умножаем штраф цены на динамический вес request.solvency (от 1 до 5)
        price_penalty = abs(current_multiplier - ideal_multiplier) * float(request.solvency)
        
        # Штраф за расстояние (от 0 до 5.0)
        distance_penalty = (dist * request.mobility) / max_distance
        
        # Итоговая оценка — сумма двух штрафов
        score = distance_penalty + price_penalty
        
        scored_stores.append(StoreResponse(
            name=store["name"],
            distance_meters=int(dist),
            estimated_price_rub=int(price),
            score=round(score, 2),
            lat=store["lat"],
            lon=store["lon"]
        ))
        
    scored_stores = sorted(scored_stores, key=lambda x: x.score)
    result = scored_stores[:5]
    print(f"[END] Обработка завершена. Возвращаем {len(result)} лучших результатов.\n")
    return result