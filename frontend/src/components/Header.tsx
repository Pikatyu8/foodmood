import { Component } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// High-fidelity fallback SVG logo as data URI (food theme) to ensure no missing image issues
const logoSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='30' height='30'><circle cx='50' cy='50' r='45' fill='%23e65c00'/><path d='M30,35 Q50,70 70,35 Z' fill='%23fff'/><circle cx='40' cy='45' r='5' fill='%23e65c00'/><circle cx='60' cy='45' r='5' fill='%23e65c00'/><path d='M42,58 Q50,65 58,58' stroke='%23e65c00' stroke-width='4' fill='none' stroke-linecap='round'/></svg>";

export default class Header extends Component {
  override render() {
    return (
      <Navbar fixed="top" collapseOnSelect expand="md" bg="dark" variant="dark" style={{ zIndex: 1040, minHeight: '60px' }}>
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center font-weight-bold">
            <img
              src={logoSvg}
              height="30"
              width="30"
              className="d-inline-block align-top me-2"
              alt="Logo"
            />
            <span className="font-weight-black tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>FoodMood</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-between">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Главная</Nav.Link>
              <Nav.Link as={Link} to="/about" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>О нас</Nav.Link>
              <Nav.Link as={Link} to="/contacts" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Контакты</Nav.Link>
              <Nav.Link as={Link} to="/blog" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Блог</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }
}
