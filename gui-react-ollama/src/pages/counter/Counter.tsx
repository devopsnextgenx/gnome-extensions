import React from 'react';
import './Counter.css';
import Counter from '../../components/common/counter/Counter';

interface CounterProps {
}

const Home: React.FC<CounterProps> = () => {
    return (
        <>
            <div>
                <Counter initialCount={5}/>
            </div>
        </>
    );
};

export default Counter;