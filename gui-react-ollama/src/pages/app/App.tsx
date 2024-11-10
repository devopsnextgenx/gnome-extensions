import "./App.css";
import Header from "../../components/sections/header/Header";
import Footer from "../../components/sections/footer/Footer";
import Body from "../../components/sections/body/Body";

const App = () => {
    return (
        <>
            <div className="app">
                <Header />
                <Body />
                <Footer />
            </div>
        </>
    );
};

export default App;