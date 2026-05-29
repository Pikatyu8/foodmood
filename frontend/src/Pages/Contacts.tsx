import { Component } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default class Contacts extends Component {
  override render() {
    return (
      <div className="container py-5 text-light animate-fade-in" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-5">
            <h2 className="display-5 font-weight-black text-warning">Контакты (Contacts)</h2>
            <p className="text-secondary-font text-muted">Свяжитесь с командой FoodMood по любым вопросам и предложениям</p>
          </div>

          <div className="row g-4 mt-3">
            <div className="col-12 col-md-5">
              <div className="p-4 rounded-4 bg-dark border border-secondary h-100 shadow-lg" style={{ background: '#182533' }}>
                <h4 className="text-white font-weight-bold mb-4 font-sans">Наш офис</h4>
                
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="p-2 bg-primary text-white rounded">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="small text-muted block">Адрес</span>
                    <p className="m-0 text-white font-weight-semibold">г. Москва, ул. Арбат, дом 10</p>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="p-2 bg-success text-white rounded">
                    <Phone size={20} />
                  </div>
                  <div>
                    <span className="small text-muted block">Телефон</span>
                    <p className="m-0 text-white font-weight-semibold">+7 (495) 123-45-67</p>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-warning text-dark rounded">
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="small text-muted block">Электронная почта</span>
                    <p className="m-0 text-white font-weight-semibold">support@foodmood.io</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-7">
              <div className="p-4 rounded-4 bg-dark border border-secondary shadow-lg" style={{ background: '#182533' }}>
                <h4 className="text-white font-weight-bold mb-3 font-sans">Отправьте нам сообщение</h4>
                
                <form onSubmit={(e) => { e.preventDefault(); alert('Сообщение успешно отправлено!'); }}>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Ваше имя</label>
                    <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Иван Иванов" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Электронная почта</label>
                    <input type="email" className="form-control bg-dark text-white border-secondary" placeholder="ivan@example.com" required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small text-muted">Сообщение</label>
                    <textarea rows={4} className="form-control bg-dark text-white border-secondary" placeholder="Введите ваш отзыв или вопрос..." required></textarea>
                  </div>

                  <button className="btn btn-primary w-full py-2 font-weight-bold rounded-pill shadow d-flex align-items-center justify-content-center gap-2" style={{ background: '#2481cc', border: 'none' }}>
                    <Send size={16} />
                    Отправить отзыв
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
