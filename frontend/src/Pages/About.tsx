import { Component, ChangeEvent } from 'react';

interface AboutState {
  rangeValue: number;
}

export default class About extends Component<{}, AboutState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      rangeValue: 50
    };
  }

  handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ rangeValue: Number(event.target.value) });
  }

  override render() {
    const styles = {
      container: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '20px',
        fontFamily: 'Arial, sans-serif'
      },
      mapPlaceholder: {
        width: '100%',
        maxWidth: '600px',
        height: '300px',
        backgroundColor: '#202b36',
        border: '2px solid #2c3b4d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        color: '#98a5b3'
      },
      buttonContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        width: '200px'
      },
      sliderContainer: {
        textAlign: 'center' as const,
        width: '100%',
        maxWidth: '300px',
        color: '#f5f6f7'
      }
    };

    return (
      <div style={styles.container}>
        <h2 className="font-weight-bold text-white mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>О нас (About us)</h2>

        {/* Прямоугольник для карты */}
        <div style={styles.mapPlaceholder}>
          Место для карты (Map Placeholder)
        </div>

        {/* Контейнер с кнопками и ползунком */}
        <div style={styles.buttonContainer}>
          <button className="btn btn-outline-light" onClick={() => alert('Кнопка 1 нажата')}>Действие 1</button>
          <button className="btn btn-outline-light" onClick={() => alert('Кнопка 2 нажата')}>Действие 2</button>
        </div>

        {/* Range Slider (Ползунок) */}
        <div style={styles.sliderContainer}>
          <label htmlFor="range-slider">Масштаб: {this.state.rangeValue}</label>
          <input
            id="range-slider"
            type="range"
            min="0"
            max="100"
            value={this.state.rangeValue}
            onChange={this.handleRangeChange}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>
    );
  }
}
