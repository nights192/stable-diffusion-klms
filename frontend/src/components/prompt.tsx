import { useRef, useEffect } from 'react';
import { textboxActive } from '../libs/styles';

function resizeTextArea(textArea: HTMLTextAreaElement | null) {
    if (textArea !== null) {
        textArea.style.height = '0px';
        textArea.style.height = `${textArea.scrollHeight}px`;
    }
}

function updatePrompt(newString: string, setValue: React.Dispatch<React.SetStateAction<string>>, ) {
    setValue(newString);
}

function Prompt({value, setValue} : { value: string, setValue: React.Dispatch<React.SetStateAction<string>> }) {
    const prompt = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const resizeEvent = () => resizeTextArea(prompt.current);
        window.addEventListener('resize', resizeEvent);
        resizeEvent();

        return () => window.removeEventListener('resize', resizeEvent);
    });

    return (
        <div className='flex grow items-center w-full px-4'>
            <textarea
            ref={prompt}
            maxLength={500}
            rows={1}
            className={`min-w-full w-full ${textboxActive} resize-none`}
            onChange={(e) => updatePrompt(e.target.value, setValue)}
            defaultValue={value}
        />
        </div>
    );
}

export default Prompt;