import React from 'react';
import FreezableSeedInput from './freezable-seed-input';
import RangeInput from './range-input';

type PromptField = {
    class: "RangeInput",
    value: number,
    setValue: React.Dispatch<React.SetStateAction<number>>,
    min: number,
    max: number,
    step: number,
    label: string,
    description: string
} | {
    class: "FreezableSeedInput",
    value: number,
    setValue: React.Dispatch<React.SetStateAction<number>>,
    lock: boolean,
    setLock: React.Dispatch<React.SetStateAction<boolean>>,
    label: string,
    description: string
};

// Perhaps a use-case for contexts; however,
// given how shallow this code-base is, such architecture
// seems a tad wasteful.
function PromptForm({ fieldList }: { fieldList: Array<PromptField> }) {
    // Would prefer to generate our fields via map; however, we require a key.
    let fields = [];
    for (const [i, field] of fieldList.entries()) {
        const label = field.label;
        const desc = field.description;
        const value = field.value;
        const setValue = field.setValue;

        switch (field.class) {
            case "RangeInput":
                fields.push(
                <RangeInput
                    label={label}
                    value={value}
                    setValue={setValue}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    key={i}
                >
                    {desc}
                </RangeInput>
                );

                break;
            
            case "FreezableSeedInput":
                fields.push(
                <FreezableSeedInput
                    label={label}
                    value={value}
                    setValue={setValue}
                    locked={field.lock}
                    setLocked={field.setLock}
                    key={i}
                >
                    {desc}
                </FreezableSeedInput>
                );

                break;
        }
    }

    return <>
        <form className='mb-6'>
            {fields}
        </form>
    </>
}

export default PromptForm;