import React from 'react';
import './Home.css';

interface HomeProps {
}

const Home: React.FC<HomeProps> = () => {
    return (
        <>
            <div>
                <h1>Home</h1>
                <div>Home page, navigate to any of the above menu items to start application testing!!!</div>
            </div>
        </>
    );
};

export default Home;