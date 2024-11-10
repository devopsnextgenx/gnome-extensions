import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { createBrowserRouter } from 'react-router-dom';
import App from '../../../pages/app/App';
import { ChatPage } from '../../../pages/chat/ChatPage';

const Navbarx = () => {
    return (
        <Navbar bg="primary" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="/">GUI for Ollama with dev-container-manager GNOME extension</Navbar.Brand>
          <Nav className="me-auto">
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
              element: <ChatPage/>,
          }
      ]
  }
]);

export default Navbarx;