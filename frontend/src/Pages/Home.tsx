import { useState, useEffect, ChangeEvent } from 'react';
import StoreFinderMap from '../components/StoreFinderMap';
import { Sparkles, Sliders, MapPin, Send, HelpCircle, RefreshCw, Star, ShoppingBag, Compass, Eye, AlertCircle, Settings2, RotateCcw } from 'lucide-react';

interface Store {
  name: string;
  distance_meters: number;
  estimated_price_rub: number;
  score: number;
  lat: number; 
  lon: number; 
}

export default function Home() {
  // --- Persistent & Onboarding State ---
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('foodmood_onboarded') === 'true';
  });
  const [slide, setSlide] = useState<number>(1);

  // Sliders and Slider Texts (values from -10 to 10)
  const [mobility, setMobility] = useState<number>(() => {
    const saved = localStorage.getItem('foodmood_mobility');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [solvency, setSolvency] = useState<number>(() => {
    const saved = localStorage.getItem('foodmood_solvency');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [mobilityText, setMobilityText] = useState<string>(String(mobility));
  const [solvencyText, setSolvencyText] = useState<string>(String(solvency));

  const [mobilityError, setMobilityError] = useState<string>('');
  const [solvencyError, setSolvencyError] = useState<string>('');

  // --- Main App Flow & Search Parameters ---
  const [lat, setLat] = useState<string>('55.755814'); // Capital Moscow
  const [lon, setLon] = useState<string>('37.617635');
  const [radius, setRadius] = useState<string>('1500'); // meters

  const [latError, setLatError] = useState<string>('');
  const [lonError, setLonError] = useState<string>('');
  const [radiusError, setRadiusError] = useState<string>('');

  const [isLocationConfirmed, setIsLocationConfirmed] = useState<boolean>(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);

  // --- API / Backend Connection ---
  const [backendUrl, setBackendUrl] = useState<string>(() => {
    return localStorage.getItem('foodmood_backend_url') || 'http://127.0.0.1:8000';
  });
  const [loadingStores, setLoadingStores] = useState<boolean>(false);
  const [storeError, setStoreError] = useState<string>('');
  const [recommendedStores, setRecommendedStores] = useState<Store[]>([]);

  // Validation routines for onboarding inputs
  const validateMobility = (valStr: string) => {
    setMobilityText(valStr);
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed) || !/^-?\d+$/.test(valStr.trim())) {
      setMobilityError('Введите целое число');
      return false;
    }
    if (parsed < -10 || parsed > 10) {
      setMobilityError('Значение от -10 до 10');
      return false;
    }
    setMobilityError('');
    setMobility(parsed);
    return true;
  };

  const validateSolvency = (valStr: string) => {
    setSolvencyText(valStr);
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed) || !/^-?\d+$/.test(valStr.trim())) {
      setSolvencyError('Введите целое число');
      return false;
    }
    if (parsed < -10 || parsed > 10) {
      setSolvencyError('Значение от -10 до 10');
      return false;
    }
    setSolvencyError('');
    setSolvency(parsed);
    return true;
  };

  // Sync range inputs with state
  const handleMobilitySliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMobility(val);
    setMobilityText(String(val));
    setMobilityError('');
  };

  const handleSolvencySliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSolvency(val);
    setSolvencyText(String(val));
    setSolvencyError('');
  };

  // Save priorities and finish onboarding
  const handleConfirmOnboarding = () => {
    const mValid = validateMobility(mobilityText);
    const sValid = validateSolvency(solvencyText);

    if (mValid && sValid) {
      localStorage.setItem('foodmood_mobility', String(mobility));
      localStorage.setItem('foodmood_solvency', String(solvency));
      localStorage.setItem('foodmood_onboarded', 'true');
      setIsOnboarded(true);
    }
  };

  // Map slider value (-10 to 10) to backend scale (1 to 5)
  // Higher slider mobility = less distance taken into account (multiplied by smaller value in score formula).
  // Slider +10 -> Weight 1 (distance matters least)
  // Slider -10 -> Weight 5 (distance matters most (very lazy))
  const mapValueToBackend = (sliderVal: number): number => {
    const mapped = Math.round(5 - (sliderVal - (-10)) * (4 / 20));
    return Math.max(1, Math.min(5, mapped));
  };

  // Click on map to select coordinates
  const handleLocationSelect = (selectedLat: number, selectedLon: number) => {
    if (isLocationConfirmed) return; // ignore clicks once coordinates are locks
    setLat(selectedLat.toFixed(6));
    setLon(selectedLon.toFixed(6));
    setLatError('');
    setLonError('');
  };

  // Validate coordinates during location confirmation
  const handleConfirmLocation = () => {
    let valid = true;

    const parsedLat = parseFloat(lat);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setLatError('Введите корректную широту (-90 до 90)');
      valid = false;
    } else {
      setLatError('');
    }

    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      setLonError('Введите корректную долготу (-180 до 180)');
      valid = false;
    } else {
      setLonError('');
    }

    const parsedRadius = parseInt(radius, 10);
    if (isNaN(parsedRadius) || parsedRadius < 100 || parsedRadius > 30000) { // Было 5000, стало 30000
      setRadiusError('Радиус должен быть от 100м до 30000м');
      valid = false;
    } else {
      setRadiusError('');
    }


    if (valid) {
      setIsLocationConfirmed(true);
      setStoreError('');
    }
  };

  // Change location settings to edit mode
  const handleResetLocation = () => {
    setIsLocationConfirmed(false);
    setRecommendedStores([]);
  };

  // Search API Call
  const handleSearchStores = async () => {
    setLoadingStores(true);
    setStoreError('');

    // Prepare mapped weights (1-5) matching backend schemas
    const finalMobility = mapValueToBackend(mobility);
    const finalSolvency = mapValueToBackend(solvency);

    const payload = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      radius_meters: parseInt(radius, 10),
      mobility: finalMobility,
      solvency: finalSolvency
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const response = await fetch(`${backendUrl}/api/v1/recommend-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Сервер ответил ошибкой (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.detail) errorMsg = errorMsg + ': ' + JSON.stringify(errData.detail);
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data: Store[] = await response.json();
      setRecommendedStores(data);

      if (data.length === 0) {
        setStoreError('Магазины в указанном радиусе не найдены. Попробуйте увеличить радиус поиска.');
      }
    } catch (err: any) {
      let friendlyError = 'Не удалось подключиться к бекенду по адресу ' + backendUrl;
      if (err.name === 'AbortError') {
        friendlyError = 'Превышено время ожидания ответа от сервера.';
      } else if (err.message) {
        friendlyError = err.message;
      }
      setStoreError(friendlyError);
      console.error(err);
    } finally {
      setLoadingStores(false);
    }
  };

  // Reset Onboarding/Priorities
  const handleResetOnboarding = () => {
    localStorage.removeItem('foodmood_onboarded');
    setIsOnboarded(false);
    setSlide(1);
    setIsLocationConfirmed(false);
    setRecommendedStores([]);
  };

  // Update localStorage when sliders change on active session
  useEffect(() => {
    if (isOnboarded) {
      localStorage.setItem('foodmood_mobility', String(mobility));
      localStorage.setItem('foodmood_solvency', String(solvency));
    }
  }, [mobility, solvency, isOnboarded]);

  // Sync API address update
  const handleSaveBackendUrl = (url: string) => {
    setBackendUrl(url);
    localStorage.setItem('foodmood_backend_url', url);
    setShowSettingsPanel(false);
  };

  // --- RENDERING ONBOARDING / WIZARD ---
  if (!isOnboarded) {
    return (
      <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="card shadow-lg border-0 bg-dark text-white rounded-4 overflow-hidden" style={{ maxWidth: '650px', width: '100%' }}>
          
          {/* Header */}
          <div className="card-header bg-gradient py-4 text-center border-bottom border-secondary" style={{ background: '#24303f' }}>
            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
              <Sparkles className="text-warning" size={32} />
              <h1 className="h3 font-weight-black m-0 tracking-tight text-white font-sans">FoodMood Onboarding</h1>
            </div>
            <p className="small text-muted mb-0">Еда под твой ритм и кошелек</p>
          </div>

          <div className="card-body p-4 p-md-5" style={{ background: '#17212b' }}>
            {slide === 1 ? (
              <div className="wizard-slide-1 animate-fade-in">
                <h4 className="text-warning mb-4 font-sans font-medium">Как приоритеты формируют ваш выбор?</h4>
                
                <div className="bg-dark p-4 rounded-3 mb-4 border border-secondary text-light">
                  <p className="mb-3 leading-relaxed">
                    <strong>FoodMood</strong> — это интеллектуальный ассистент, который подберет оптимальный магазин, идеально соответствующий вашему текущему настроению.
                  </p>
                  <p className="mb-3 leading-relaxed text-secondary-font">
                    Ваш выбор оптимизируют два главных рычага:
                  </p>
                  
                  <div className="d-flex gap-3 align-items-start mb-3">
                    <div className="p-2 rounded bg-primary text-white mt-1">
                      <Compass size={18} />
                    </div>
                    <div>
                      <h6 className="font-weight-bold text-white mb-1">Подвижность (Активность)</h6>
                      <p className="small text-muted mb-0">
                        Высокая подвижность — значит вы не против прогуляться. Фактор расстояния до магазина отходит на второй план. Низкая подвижность — ищем магазины исключительно в шаговой доступности.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <div className="p-2 rounded bg-success text-white mt-1">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <h6 className="font-weight-bold text-white mb-1">Платежеспособность (Бюджет)</h6>
                      <p className="small text-muted mb-0">
                        Высокая платежеспособность — вы готовы платить за премиальный ассортимент (например, Азбука Вкуса). Бюджетный приоритет — мы ранжируем магазины с более доступными ценами (Чижик, Магнит).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <button 
                    className="btn btn-primary px-4 py-2 font-weight-bold shadow rounded-pill d-inline-flex align-items-center gap-2"
                    onClick={() => setSlide(2)}
                  >
                    Далее настройка параметров
                    <Send size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="wizard-slide-2 animate-fade-in">
                <h4 className="text-warning mb-4 font-sans font-medium">Установите ваши текущие параметры</h4>
                
                <p className="small text-muted mb-4">
                  Введите целые числа от <b>-10</b> (минимальный приоритет) до <b>10</b> (максимальный приоритет).
                </p>

                {/* MOBILITY FIELD */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="font-weight-bold text-white">1. Подвижность (лень vs прогулка):</label>
                    <span className="badge bg-primary">[-10 до 10]</span>
                  </div>
                  
                  <div className="d-flex align-items-center gap-3">
                    <div className="flex-grow-1">
                      <input 
                        type="range" 
                        min="-10" 
                        max="10" 
                        step="1"
                        value={mobility} 
                        onChange={handleMobilitySliderChange}
                        className="form-range"
                      />
                      <div className="d-flex justify-content-between text-muted small mt-1">
                        <span>Очень лень (-10)</span>
                        <span>Активный (+10)</span>
                      </div>
                    </div>

                    <div style={{ width: '80px' }}>
                      <input 
                        type="text" 
                        value={mobilityText}
                        onChange={(e) => validateMobility(e.target.value)}
                        className={`form-control bg-dark text-white text-center font-weight-bold ${mobilityError ? 'border-danger text-danger' : 'border-secondary'}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {mobilityError && <p className="text-danger small mt-1 mb-0">{mobilityError}</p>}
                  <p className="text-secondary small mt-1 mb-0">
                    Вес для формулы на сервере: <span className="text-warning font-weight-bold">{mapValueToBackend(mobility)} / 5</span> 
                    <span className="text-muted ms-1">({mapValueToBackend(mobility) === 5 ? 'макс. влияние расстояния' : mapValueToBackend(mobility) === 1 ? 'миним. влияние расстояния' : 'умеренно'})</span>
                  </p>
                </div>

                {/* SOLVENCY FIELD */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="font-weight-bold text-white">2. Платежеспособность (бюджет vs премиум):</label>
                    <span className="badge bg-success">[-10 до 10]</span>
                  </div>
                  
                  <div className="d-flex align-items-center gap-3">
                    <div className="flex-grow-1">
                      <input 
                        type="range" 
                        min="-10" 
                        max="10" 
                        step="1"
                        value={solvency} 
                        onChange={handleSolvencySliderChange}
                        className="form-range"
                      />
                      <div className="d-flex justify-content-between text-muted small mt-1">
                        <span>Экономный (-10)</span>
                        <span>Люкс/Премиум (+10)</span>
                      </div>
                    </div>

                    <div style={{ width: '80px' }}>
                      <input 
                        type="text" 
                        value={solvencyText}
                        onChange={(e) => validateSolvency(e.target.value)}
                        className={`form-control bg-dark text-white text-center font-weight-bold ${solvencyError ? 'border-danger text-danger' : 'border-secondary'}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {solvencyError && <p className="text-danger small mt-1 mb-0">{solvencyError}</p>}
                  <p className="text-secondary small mt-1 mb-0">
                    Вес для формулы на сервере: <span className="text-warning font-weight-bold">{mapValueToBackend(solvency)} / 5</span> 
                    <span className="text-muted ms-1">({mapValueToBackend(solvency) === 5 ? 'макс. влияние цены' : mapValueToBackend(solvency) === 1 ? 'миним. влияние цены' : 'умеренно'})</span>
                  </p>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button 
                    className="btn btn-outline-secondary rounded-pill px-3"
                    onClick={() => setSlide(1)}
                  >
                    Вернуться
                  </button>

                  <button 
                    className="btn btn-success px-4 py-2 font-weight-bold shadow rounded-pill d-inline-flex align-items-center gap-2"
                    onClick={handleConfirmOnboarding}
                    disabled={!!mobilityError || !!solvencyError}
                  >
                    Поехали!
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING MAIN SERVICE WORKSPACE ---
  return (
    <div className="container-fluid py-4 min-vh-100 font-sans" style={{ backgroundColor: '#0e1621', color: '#f5f6f7' }}>
      
      {/* Dynamic Header Toolbar inside main UI page */}
      <div className="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-4 border-bottom border-dark">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-primary rounded text-white shadow-sm">
            <Compass className="animate-spin-slow" size={24} />
          </div>
          <div>
            <h4 className="m-0 font-weight-bold text-white font-mono">FoodMood <span className="text-primary">Workspace</span></h4>
            <p className="small text-muted mb-0">Среда поиска лучших цен и расстояния</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 mt-2 mt-sm-0">
          {/* Quick status of parameters */}
          <div className="d-none d-md-flex align-items-center gap-3 bg-dark px-3 py-2 rounded-pill border border-secondary text-light">
            <span className="small text-muted">Ваши приоритеты:</span>
            <span className="badge bg-primary">Активность: {mobility}</span>
            <span className="badge bg-success">Кошелек: {solvency}</span>
          </div>

          <button 
            type="button"
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 shadow-sm px-3 rounded-pill"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          >
            <Settings2 size={16} />
            Бекенд/Настройки
          </button>

          <button 
            type="button"
            className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 shadow-sm px-3 rounded-pill"
            onClick={handleResetOnboarding}
          >
            <RotateCcw size={16} />
            Сбросить приоритеты
          </button>
        </div>
      </div>

      {/* Backend endpoint setup modal overlay */}
      {showSettingsPanel && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title font-sans">Настройка подключения к FastAPI</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSettingsPanel(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label text-muted small">URL вашего локального Python FastAPI сервера:</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="http://127.0.0.1:8000"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                  />
                  <p className="text-secondary small mt-2">
                    Убедитесь, что ваш python скрипт запущен и проксирует CORS правильно (или запущен локально на том же ПК).
                  </p>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettingsPanel(false)}>Отмена</button>
                <button type="button" className="btn btn-primary" onClick={() => handleSaveBackendUrl(backendUrl)}>Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="row g-4 justify-content-center">
        
        {/* MAP COLUMN (Always centered, takes larger portion, with responsive gutters) */}
        <div className="col-12 col-xl-8">
          <div className="bg-dark p-3 rounded-4 shadow-lg border border-dark" style={{ height: '520px', minHeight: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <h5 className="m-0 fs-6 text-muted d-flex align-items-center gap-2">
                <MapPin size={16} className="text-danger" />
                Карта поиска (Нажмите, чтобы указать центр)
              </h5>
              <span className="small text-muted font-mono">{lat}, {lon}</span>
            </div>
            
            <StoreFinderMap 
              lat={parseFloat(lat)}
              lon={parseFloat(lon)}
              radius={parseInt(radius, 10)}
              onLocationSelect={handleLocationSelect}
              stores={recommendedStores}
            />
          </div>

          {/* DYNAMIC VIEW FOR CONFIRMED STAGE (Placed right below the map) */}
          {isLocationConfirmed && (
            <div className="bg-dark p-4 rounded-4 shadow-lg border border-dark mt-4 animate-fade-in text-center">
              
              {/* Dynamic sliders shown below map during search stage */}
              <h5 className="text-white text-center fw-bold mb-3 font-mono">ТЮНИНГ ПАРАМЕТРОВ ПЕРЕД ПОИСКОМ</h5>
              
              <div className="row g-3 text-start mb-4 max-w-2xl mx-auto">
                <div className="col-12 col-md-6 bg-dark p-3 rounded border border-secondary shadow-sm">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-white font-weight-black">Подвижность:</span>
                    <span className="badge bg-primary">{mobility}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-10" 
                    max="10" 
                    step="1"
                    value={mobility} 
                    onChange={handleMobilitySliderChange}
                    className="form-range"
                  />
                  <span className="text-secondary small font-mono block mt-1">
                    API вес: {mapValueToBackend(mobility)} / 5 ({mobility >= 5 ? 'пешком готов далеко' : mobility <= -5 ? 'рядом' : 'сбалансирован'})
                  </span>
                </div>

                <div className="col-12 col-md-6 bg-dark p-3 rounded border border-secondary shadow-sm">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-white font-weight-black">Платежеспособность:</span>
                    <span className="badge bg-success">{solvency}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-10" 
                    max="10" 
                    step="1"
                    value={solvency} 
                    onChange={handleSolvencySliderChange}
                    className="form-range"
                  />
                  <span className="text-secondary small font-mono block mt-1">
                    API вес: {mapValueToBackend(solvency)} / 5 ({solvency >= 5 ? 'премиальный выбор' : solvency <= -5 ? 'бюджетный' : 'сбалансирован'})
                  </span>
                </div>
              </div>

              {/* Large search trig button */}
              <div className="d-flex justify-content-center gap-3">
                <button 
                  className="btn btn-outline-danger px-4 rounded-pill d-inline-flex align-items-center gap-2"
                  onClick={handleResetLocation}
                  disabled={loadingStores}
                >
                  <RefreshCw size={16} />
                  Изменить координаты
                </button>

                <button 
                  className="btn btn-primary btn-lg px-5 font-weight-bold shadow rounded-pill d-inline-flex align-items-center gap-2 bg-gradient"
                  style={{ minWidth: '220px', background: '#2481cc', border: 'none' }}
                  onClick={handleSearchStores}
                  disabled={loadingStores}
                >
                  {loadingStores ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Поиск...
                    </>
                  ) : (
                    <>
                      НАЙТИ МАГАЗИНЫ
                      <Send size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS / RESULTS COLUMN */}
        <div className="col-12 col-xl-4 d-flex flex-column gap-3">
          
          {/* Phase 1: Inputs side form */}
          {!isLocationConfirmed ? (
            <div className="card bg-dark border-dark rounded-4 p-4 shadow-lg flex-grow-1 animate-fade-in text-light">
              <h5 className="card-title text-warning font-sans mb-3 font-weight-black d-flex align-items-center gap-2">
                <MapPin size={20} />
                Параметры локации
              </h5>
              
              <p className="small text-muted mb-4">
                Укажите координаты для поиска. Или просто <b>кликните по карте</b> слева, и значения обновятся автоматически!
              </p>

              {/* LATITUDE */}
              <div className="mb-3">
                <label className="form-label small text-secondary-font">Широта (Latitude):</label>
                <input 
                  type="text"
                  className={`form-control bg-dark text-white border-secondary ${latError ? 'border-danger' : ''}`}
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                    setLatError('');
                  }}
                  id="lat-input"
                />
                {latError && <p className="text-danger small mt-1 error">{latError}</p>}
              </div>

              {/* LONGITUDE */}
              <div className="mb-3">
                <label className="form-label small text-secondary-font">Долгота (Longitude):</label>
                <input 
                  type="text"
                  className={`form-control bg-dark text-white border-secondary ${lonError ? 'border-danger' : ''}`}
                  value={lon}
                  onChange={(e) => {
                    setLon(e.target.value);
                    setLonError('');
                  }}
                  id="lon-input"
                />
                {lonError && <p className="text-danger small mt-1 error">{lonError}</p>}
              </div>

              {/* RADIUS */}
              <div className="mb-4">
                <label className="form-label small text-secondary-font">Радиус поиска (метров):</label>
                <input 
                  type="text"
                  className={`form-control bg-dark text-white border-secondary ${radiusError ? 'border-danger' : ''}`}
                  value={radius}
                  onChange={(e) => {
                    setRadius(e.target.value);
                    setRadiusError('');
                  }}
                  id="radius-input"
                />
                {radiusError && <p className="text-danger small mt-1 error">{radiusError}</p>}
                <p className="text-muted small mt-1">Ограничение по FastAPI: от 100м до 30000м</p>
              </div>

              <button 
                className="btn btn-warning w-full py-2 font-weight-bold rounded-pill text-dark shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={handleConfirmLocation}
                id="btn-confirm-location"
              >
                Подтвердить локацию
                <Send size={16} />
              </button>
            </div>
          ) : (
            /* Phase 2: Show result of stores */
            <div className="card bg-dark border-dark rounded-4 p-4 shadow-lg flex-grow-1 animate-fade-in text-light">
              <h5 className="card-title text-success font-sans mb-3 font-weight-black d-flex align-items-center gap-2">
                <Star size={20} className="text-warning animate-pulse" />
                Лучшие магазины
              </h5>

              {/* Loading State */}
              {loadingStores && (
                <div className="d-flex flex-column align-items-center justify-content-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <p className="text-muted small">Опрашиваем Overpass API и рассчитываем оценки...</p>
                </div>
              )}

              {/* Error state */}
              {storeError && !loadingStores && (
                <div className="alert alert-danger border-0 bg-danger text-white mb-0" role="alert">
                  <div className="d-flex gap-2">
                    <AlertCircle size={20} />
                    <div className="small">
                      <p className="font-weight-bold mb-1">Ошибка рассчета рекомендаций:</p>
                      <p className="mb-2">{storeError}</p>
                      <hr className="my-2 border-white opacity-20" />
                      <p className="mb-0 text-white-50">Убедитесь, что ваш FastAPI backend запущен по адресу <code>{backendUrl}</code> и работает исправно.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ready state: Display list of stores */}
              {!loadingStores && !storeError && recommendedStores.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <ShoppingBag size={48} className="mx-auto mb-3 opacity-30 animate-bounce-slow" />
                  <p className="mb-0">Нажмите кнопку <b>НАЙТИ МАГАЗИНЫ</b> на карте, чтобы получить умные рекомендации от вашего FastAPI сервера.</p>
                </div>
              )}

              {!loadingStores && recommendedStores.length > 0 && (
                <div className="d-flex flex-column gap-3">
                  <p className="small text-muted mb-1">Топ-5 магазинов, упорядоченных по индексу соответствия (меньше — лучше):</p>
                  
                  {recommendedStores.map((store, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-3 bg-secondary-color border border-secondary hover-scale shadow-sm transition-all"
                      style={{ 
                        background: idx === 0 ? 'rgba(46, 196, 182, 0.12)' : '#182533', 
                        borderColor: idx === 0 ? '#2ec4b6' : '#202b36' 
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary font-mono d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', borderRadius: '50%' }}>
                            {idx + 1}
                          </span>
                          <h6 className="m-0 font-weight-bold text-white fs-6">{store.name}</h6>
                        </div>
                        {idx === 0 && <span className="small text-success font-mono font-weight-bold tracking-wider fs-9">ЛУЧШИЙ ВЫБОР!</span>}
                      </div>

                      <div className="row g-2 text-muted small font-mono mt-1 pt-1 border-top border-dark">
                        <div className="col-6 text-start">
                          <span className="text-secondary small">Расстояние</span>
                          <p className="m-0 text-white font-weight-bold">{store.distance_meters} м</p>
                        </div>
                        <div className="col-6 text-start">
                          <span className="text-secondary small">Корзина</span>
                          <p className="m-0 text-success font-weight-bold">{store.estimated_price_rub} ₽</p>
                        </div>
                        <div className="col-12 mt-2 bg-dark p-2 rounded text-center">
                          <span className="text-secondary-font text-xs">Индекс соответствия (Score):</span>
                          <span className="text-warning font-weight-bold ms-1">{store.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
