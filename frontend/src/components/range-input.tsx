import React from 'react';

function RangeInput({ label, min, max, value, setValue, step, children }:
    {
        label: string, min: number, max: number, value: number, setValue: React.Dispatch<React.SetStateAction<number>>,
        def?: number, step?: number, children: string
    }) {
    return (
        <div className='flex flex-col pb-6'>
            <div className='flex flex-col pb-1'>
                <div className='pb-1'>
                    <label className='text-lg float-left'>{label}</label>
                    <span className='text-sm float-right bg-neutral-900 text-zinc-500 p-1'>{value}</span>
                </div>

                <p className='text-zinc-500'>{children}</p>
            </div>

            <input type='range' min={min} max={max} step={step} value={value} onChange={(event) => setValue(event.target.valueAsNumber)} />
        </div>
    );
}

export default RangeInput;