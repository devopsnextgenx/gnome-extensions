import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../../../pages/home/Home';
import Counter from '../../../pages/counter/Counter';
import About from '../../../pages/about/About';
import App from '../../../pages/app/App';

const Navbarx = () => {
    return (
        <Navbar bg="primary" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="/">GUI Test App</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="/">Home</Nav.Link>
            <Nav.Link href="counter">Counter</Nav.Link>
            <Nav.Link href="about">About</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    );
}

export const navbarxRouter = createBrowserRouter([
  {
      path: '/',
      element: <App />,
      children: [
          {
              path: '/',
              element: <Home />,
          },
          {
              path: '/counter',
              element: <Counter />,
          },
          {
              path: '/about',
              element: <About />,
          }
      ]
  }
]);

export default Navbarx;