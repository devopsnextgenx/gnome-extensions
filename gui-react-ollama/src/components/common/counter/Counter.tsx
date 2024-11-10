import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import './Counter.css';

interface CounterProps {
    initialCount?: number;
}

let historyIValue = 0;

const Counter: React.FC<CounterProps> = ({ initialCount = 0 }) => {
    const [count, setCount] = useState(initialCount);
    const [inputValue, setInputValue] = useState(0);
    const [iValue, setIValue] = useState(false);

    const handleInputChange = (e: any) => {
        setInputValue(parseInt(e.target.value) || 0); // Parse to integer, default to 0 if invalid
    };

    const handleIValueChange = (e: any) => {
        setIValue(e.target.checked); // Parse to integer, default to 0 if invalid
        if(!e.target.checked) {
            historyIValue = inputValue;
        }
        setInputValue(e.target.checked ? historyIValue : 0)
    }

    const increment = () => {
        let value = iValue ? inputValue : 1;
        setCount(count + value);
    };
    const decrement = () => {
        let value = iValue ? inputValue : 1;
        setCount(count - value);
    };
    const reset = () => {
        setCount(initialCount);
        setInputValue(0);
        setIValue(false);
    };

    return (
        <div className='card bg-secondary text-dark' style={{ maxWidth: '60%' }}>
            <div className='card-header'>Counter Card</div>
            <div className='card-body'>
                <div>Counter Value: &nbsp;
                    <div id="counterx" style={{ display: 'inline' }}>{count}</div>
                </div>
                <br />
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text" id="iValue">Value</span>
                    </div>
                    <input type="text"
                        className="form-control"
                        aria-label="Default"
                        aria-describedby="iValue"
                        value={inputValue} onChange={handleInputChange} disabled={!iValue} />
                </div>
                <div className="form-check form-switch d-flex">
                    <input className="form-check-input form-check-inline" type="checkbox" id="inlineCheckbox1"
                        checked={iValue} onChange={handleIValueChange} />
                    <label className="form-check-label" >Enable Input Increment Value {iValue}</label>
                </div>
            </div>
            <div className='card-footer'>
                <Button className='abtn' variant="primary" id="increment" onClick={increment}>Increment</Button>
                <Button className='abtn' variant="primary" id="decrement" onClick={decrement}>Decrement</Button>
                <Button className='abtn' variant="danger"  id="reset" onClick={reset}>Reset</Button>
            </div>
        </div>
    );
};

export default Counter;