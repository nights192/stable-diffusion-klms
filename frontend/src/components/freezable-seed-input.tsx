import React from 'react';
import { Switch } from '@headlessui/react'
import { textboxActive, textboxInactive } from '../libs/styles';

const unlockedInputClass = `${textboxInactive} basis-5/6`
const lockedInputClass = `${textboxActive} basis-5/6`;

function updateUnsignedInteger(newInput: string, value: number, setValue: React.Dispatch<React.SetStateAction<number>>) {
    const seed = parseInt(newInput);

    if (seed !== undefined && seed >= 0)
        setValue(seed);
}

function FreezableSeedInput({ label, value, setValue, locked, setLocked, children }:
    {
        label: string, value: number, setValue: React.Dispatch<React.SetStateAction<number>>,
        locked: boolean, setLocked: React.Dispatch<React.SetStateAction<boolean>>
        children: string
    }) {

    return (
        <div className='flex flex-col pb-6'>
            <div className='flex flex-col pb-1'>
                <div className='pb-1'>
                    <label className='text-lg float-left'>{label}</label>
                </div>

                <p className='text-zinc-500'>{children}</p>
            </div>

            <div className='flex items-center space-x-3'>
                <input
                    type='text'
                    className={locked ? lockedInputClass : unlockedInputClass}
                    value={locked ? undefined : value}
                    onChange={(e) => updateUnsignedInteger(e.target.value, value, setValue)}
                />

                <Switch
                    checked={locked}
                    onChange={setLocked}
                    className={`${locked ? 'bg-blue-600' : 'bg-neutral-900'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                >
                    <span
                        className={
                            `${locked ? 'translate-x-6 bg-neutral-100' : 'translate-x-1 bg-neutral-300'
                            } inline-block h-4 w-4 transform rounded-full`
                        }
                    />
                </Switch>
            </div>
        </div>
    );
}

export default FreezableSeedInput;