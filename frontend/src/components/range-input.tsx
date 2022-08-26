import React, { useState } from 'react';

function validateChange(newInput: string, min: number, max: number, value: number, setValue: React.Dispatch<React.SetStateAction<number>>) {
    const res = parseInt(newInput)

    if (res !== undefined)
        setValue(res);
    else
        setValue(value);
}

// I'll leave the rest untyped for now, as the syntax for this particular destructuring exercise is 
// melting my brain.
function NumberText({ min, max, value, setValue, className }:
    { min: number, max: number, value: number, setValue: React.Dispatch<React.SetStateAction<number>>, className?: string }) {
    
    // We must track focus to trace edit status throughout the form.
    const [focused, setFocused] = useState(false);
    
    return (
        <input  
            type='text'
            defaultValue={value}
            value={(focused) ? undefined : value}
            onFocus={(_) => setFocused(true)}
            onBlur={(_) => setFocused(false)}
            onChange={(e) => validateChange(e.target.value, min, max, value, setValue)}
            className={className}
        />
    );
}

function RangeInput({ min, max, value, setValue, def, step, children }:
    { min: number, max: number, value: number, setValue: React.Dispatch<React.SetStateAction<number>>, def?: number, step?: number, children: string }) {
    return (
        <div className='flex flex-col'>
            <div className='flex flex-col'>
                <div>
                    <label className='text-lg float-left'>{children}</label>
                    <NumberText min={min} max={max} value={value} setValue={setValue} className='float-right' />
                </div>

                <p>Description</p>
            </div>

            <input type='range' min={min} max={max} step={step} value={value} onChange={(event) => setValue(event.target.valueAsNumber)} />
        </div>
    );
}

export default RangeInput;