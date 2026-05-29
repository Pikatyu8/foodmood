import { Component } from 'react';
import { Calendar, User, ArrowRight, Eye } from 'lucide-react';

export default class Blog extends Component {
  override render() {
    const blogPosts = [
      {
        title: "Как экономить на продуктах в Москве: Сравнение торговых сетей",
        excerpt: "Разбираем реальные цены в магазинах 'Чижик', 'Магнит', 'ВкусВилл' и 'Азбука Вкуса'. Как не переплачивать за брендовую разметку.",
        date: "25 Мая, 2026",
        author: "Алексей Соколов",
        category: "Бюджет",
        color: "#ff9f1c"
      },
      {
        title: "Психология лени: Почему мы выбираем магазины у дома?",
        excerpt: "Индекс лени и подвижности. Как расстояние до магазина влияет на наше настроение и состав потребительской корзины.",
        date: "18 Мая, 2026",
        author: "Мария Волкова",
        category: "Стиль жизни",
        color: "#2ec4b6"
      },
      {
        title: "FastAPI + Overpass API: Как устроен поиск магазинов на карте",
        excerpt: "Технический разбор умных скоринг-аналитик. Опрашиваем OpenStreetMap базу данных и рассчитываем индексы приоритетов в миллисекундах.",
        date: "10 Мая, 2026",
        author: "Давид Девелопер",
        category: "Технологии",
        color: "#2481cc"
      }
    ];

    return (
      <div className="container py-5 text-light animate-fade-in" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-5">
            <h2 className="display-5 font-weight-black text-warning">Блог (Blog)</h2>
            <p className="text-secondary-font text-muted">Свежие советы по экономии, обзоры цен и урбанистические лайфхаки</p>
          </div>

          <div className="d-flex flex-column gap-4">
            {blogPosts.map((post, index) => (
              <div 
                key={index} 
                className="card bg-dark border-secondary overflow-hidden rounded-4 shadow-lg transition-all hover-scale"
                style={{ background: '#182533', borderColor: '#202b36' }}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge rounded-pill" style={{ backgroundColor: post.color, color: '#fff' }}>
                      {post.category}
                    </span>
                    <span className="text-muted small font-mono d-flex align-items-center gap-1">
                      <Calendar size={13} />
                      {post.date}
                    </span>
                    <span className="text-muted small">|</span>
                    <span className="text-muted small font-mono d-flex align-items-center gap-1">
                      <User size={13} />
                      {post.author}
                    </span>
                  </div>

                  <h3 className="h4 text-white font-weight-bold mb-3 font-sans">{post.title}</h3>
                  <p className="text-muted mb-4 fs-6 leading-relaxed">{post.excerpt}</p>

                  <div className="d-flex justify-content-between align-items-center">
                    <button onClick={() => alert(`Статья "${post.title}" находится в процессе написания!`)} className="btn btn-link text-warning p-0 font-weight-bold d-flex align-items-center gap-1 nav-link text-decoration-none">
                      Читать полностью
                      <ArrowRight size={16} />
                    </button>
                    <span className="text-muted small d-flex align-items-center gap-1 font-mono">
                      <Eye size={14} />
                      {Math.floor(Math.random() * 400) + 120} просмотров
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
