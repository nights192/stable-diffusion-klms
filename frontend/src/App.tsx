import { useState } from 'react';
import Button from './components/button';
import RangeInput from './components/range-input';

function PromptForm({ minDim = 256, maxDim = 512, maxImages = 4 }) {
  const textboxStyle = 'bg-neutral-900 rounded ml-4 px-4 text-lg'
  const promptStyle = 'py-2';

  const [width, setWidth] = useState(maxDim);

  return <>
    <form className='mb-6'>
      <RangeInput min={minDim} value={width} setValue={setWidth} max={maxDim} step={32}>Width</RangeInput>

      <div className={promptStyle}>
        <label className='text-lg'>Height:</label>
        <input type='number' className={textboxStyle} min={minDim} max={maxDim} value={ minDim }/>
      </div>
    </form>

    <Button>Create</Button>
  </>
}

function App() {
  return (
    <>
      <div className='flex md:flex-row-reverse md:h-screen'>
        <div className='bg-neutral-800 flex-initial mx-auto md:mx-0 w-96 height-full px-6 my-4 md:my-0 py-4 rounded-lg md:rounded-none'>
          <h1 className='text-2xl text-violet-500 font-bold mb-4 text-center md:text-left'>txt2img</h1>

          <PromptForm />
        </div>
        <div></div>
      </div>
    </>
  );
}

export default App;
