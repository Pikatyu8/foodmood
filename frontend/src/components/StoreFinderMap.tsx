import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Store {
  name: string;
  distance_meters: number;
  estimated_price_rub: number;
  score: number;
  lat?: number;
  lon?: number;
}

interface StoreFinderMapProps {
  lat: number;
  lon: number;
  radius: number;
  onLocationSelect: (lat: number, lon: number) => void;
  stores?: Store[];
}

export default function StoreFinderMap({
  lat,
  lon,
  radius,
  onLocationSelect,
  stores = []
}: StoreFinderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const storeMarkersRef = useRef<L.Marker[]>([]);

  // Иконка пользователя с анимацией пульсации (исправлен fill с %23 на #)
  const createUserIcon = () => {
    return L.divIcon({
      html: `
        <div class="user-marker-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <div class="user-pulse" style="position: absolute; width: 30px; height: 30px; border-radius: 50%; animation: pulse 2s infinite; background: rgba(36, 129, 204, 0.455);"></div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2481cc" width="34" height="34" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4)); position: relative; z-index: 2;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      className: 'custom-user-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 34],
    });
  };

  // Цветные маркеры магазинов с порядковым номером соответствия
  const createStoreIcon = (index: number) => {
    const colors = ['#2ec4b6', '#3a86c8', '#ff9f1c', '#ffbf00', '#e71d36'];
    const color = colors[index % colors.length] || '#2ec4b6';
    return L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(color)}" width="30" height="30" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 12H9l1-4H8V7h5v2h-1.5l-1 4h1.5l-1 1h1zm4.5-5H13V7h2.5c.28 0 .5.22.5.5s-.22.5-.5.5z"/>
          </svg>
          <div style="position: absolute; top: 4px; background: white; color: black; font-size: 9px; font-weight: bold; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid ${color};">
            ${index + 1}
          </div>
        </div>
      `,
      className: 'custom-store-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 30],
    });
  };

  // 1. Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 14,
      zoomControl: true,
    });

    // Светлый, аккуратный и контрастный стиль карт CartoDB Voyager
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;

    // Смена центра кликом по карте
    map.on('click', (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    // Инъекция CSS анимации для пульсирующего маркера пользователя
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(0.6); opacity: 0.9; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.off();
      map.remove();
      mapInstanceRef.current = null;
      document.head.removeChild(style);
    };
  }, []);

  // 2. Синхронизация маркера пользователя и круга поиска
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([lat, lon], {
        icon: createUserIcon(),
        draggable: true
      }).addTo(map);

      // Перетаскивание синего маркера пользователем
      userMarkerRef.current.on('dragend', () => {
        const marker = userMarkerRef.current;
        if (marker) {
          const position = marker.getLatLng();
          onLocationSelect(position.lat, position.lng);
        }
      });
    } else {
      userMarkerRef.current.setLatLng([lat, lon]);
    }

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle([lat, lon], {
        radius: radius,
        color: '#2481cc',
        fillColor: '#2481cc',
        fillOpacity: 0.12,
        weight: 1.5
      }).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng([lat, lon]);
      radiusCircleRef.current.setRadius(radius);
    }

    const bounds = map.getBounds();
    if (!bounds.contains([lat, lon])) {
      map.panTo([lat, lon]);
    }
  }, [lat, lon, radius]);

  // 3. Расстановка пинов найденных магазинов
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Очищаем старые маркеры перед новым выводом
    storeMarkersRef.current.forEach(marker => marker.remove());
    storeMarkersRef.current = [];

    if (stores && stores.length > 0) {
      const markers: L.Marker[] = [];
      const storeCoordinates: L.LatLngExpression[] = [];

      stores.forEach((store, index) => {
        let storeLat: number;
        let storeLon: number;

        // Если в ответе бэкенда есть реальные координаты, используем их
        if (typeof store.lat === 'number' && typeof store.lon === 'number') {
          storeLat = store.lat;
          storeLon = store.lon;
        } else {
          // Иначе откатываемся на радиальное распределение вокруг пользователя
          const angle = (index * (2 * Math.PI)) / Math.max(stores.length, 1);
          const distanceDegrees = store.distance_meters / 111300;
          storeLat = lat + Math.sin(angle) * distanceDegrees;
          storeLon = lon + Math.cos(angle) * distanceDegrees;
        }

        const iconInstance = createStoreIcon(index);
        const marker = L.marker([storeLat, storeLon], { icon: iconInstance })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: 'Montserrat', sans-serif; min-width: 160px; padding: 2px; color: #17212b;">
              <h6 style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #17212b;">${store.name}</h6>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #555;">Расстояние: <b>${store.distance_meters} м</b></p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #2e7d32;">Корзина товаров: <b>${store.estimated_price_rub} ₽</b></p>
              <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 4px; padding: 4px; text-align: center; font-size: 11px; font-weight: bold; color: #b7791f;">
                Индекс (Score): ${store.score}
              </div>
            </div>
          `);

        markers.push(marker);
        storeCoordinates.push([storeLat, storeLon]);
      });

      storeMarkersRef.current = markers;

      // Корректируем зум и границы карты, чтобы поместились все маркеры и пользователь
      if (storeCoordinates.length > 0) {
        storeCoordinates.push([lat, lon]);
        const routeBounds = L.latLngBounds(storeCoordinates);
        map.fitBounds(routeBounds, { padding: [40, 40] });
      }
    }
  }, [stores, lat, lon]);

  return (
    <div 
      ref={mapContainerRef} 
      id="store-map-container"
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '12px',
        border: '3px solid #202b36',
        backgroundColor: '#1b242e',
        zIndex: 5
      }} 
    />
  );
}