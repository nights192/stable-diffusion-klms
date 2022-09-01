import React, { useState } from 'react';
import Button from './components/button';
import FreezableSeedInput from './components/freezable-seed-input';
import Prompt from './components/prompt';
import RangeInput from './components/range-input';
import useSocket from './hooks/use-socket';

function openConnection(ws: WebSocket, event: Event) {
}

function receiveMessage(ws: WebSocket, event: MessageEvent) {
  const response = JSON.parse(event.data);

  console.log(response)
}

function send(
  ws: WebSocket, width: number, height: number, cfgScale: number,
  steps: number, numImages: number, seed: number, prompt: string
) {
  const imageRequest = { width, height, cfgScale, steps, numImages, seed, prompt };

  ws.send(JSON.stringify(imageRequest));
}

// Perhaps a use-case for contexts; however,
// given how shallow this code-base is, such architecture
// seems a tad wasteful.
function PromptForm({
  minDim, maxDim, maxCfg, maxSteps, maxImages,

  width, setWidth, height, setHeight, cfgScale, setCfgScale, steps,
  setSteps, numImages, setNumImages, seed, setSeed, seedLocked, setSeedLocked
}: {
  minDim: number, maxDim: number, maxCfg: number, maxSteps: number, maxImages: number,

  width: number, setWidth: React.Dispatch<React.SetStateAction<number>>,
  height: number, setHeight: React.Dispatch<React.SetStateAction<number>>,
  cfgScale: number, setCfgScale: React.Dispatch<React.SetStateAction<number>>,
  steps: number, setSteps: React.Dispatch<React.SetStateAction<number>>,
  numImages: number, setNumImages: React.Dispatch<React.SetStateAction<number>>,
  seed: number, setSeed: React.Dispatch<React.SetStateAction<number>>,
  seedLocked: boolean, setSeedLocked: React.Dispatch<React.SetStateAction<boolean>>,
}) {
  return <>
    <form className='mb-6'>
      <RangeInput label='Width' min={minDim} value={width} setValue={setWidth} max={maxDim} step={32}>
        The width of your image(s).
      </RangeInput>

      <RangeInput label='Height' min={minDim} value={height} setValue={setHeight} max={maxDim} step={32}>
        The height of your image(s).
      </RangeInput>

      <RangeInput label='CfgScale' min={0} value={cfgScale} setValue={setCfgScale} max={maxCfg} step={0.5}>
        Adjusts how closely should the AI adhere to your prompt; higher values are more precise.
      </RangeInput>

      <RangeInput label='Steps' min={1} value={steps} setValue={setSteps} max={maxSteps} step={1}>
        The amount of steps by which the AI will detail your art.
      </RangeInput>

      <RangeInput label='Number of Images' min={1} value={numImages} setValue={setNumImages} max={maxImages} step={1}>
        Adjusts how closely should the AI adhere to your prompt; higher values are more precise.
      </RangeInput>

      <FreezableSeedInput label='Seed' value={seed} setValue={setSeed} locked={seedLocked} setLocked={setSeedLocked}>
        The identifier for a given random generation. Unlock this to set or copy your own.
      </FreezableSeedInput>
    </form>
  </>
}

function App() {
  const minDim = 256;
  const maxDim = 512;
  const maxCfg = 20;
  const maxSteps = 150;
  const maxImages = 4;

  const [width, setWidth] = useState(maxDim);
  const [height, setHeight] = useState(maxDim);
  const [cfgScale, setCfgScale] = useState(7);
  const [steps, setSteps] = useState(50);
  const [numImages, setNumImages] = useState(1);
  const [seed, setSeed] = useState(43);
  const [seedLocked, setSeedLocked] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('/noimage.png');

  // For whatever 
  const [ws, connection] = useSocket('ws://127.0.0.1:8000/channel', openConnection, receiveMessage) as [React.MutableRefObject<WebSocket | null>, number];

  return (
    <>
      <div className='md:flex md:flex-row-reverse md:h-screen'>
        <div className='bg-neutral-800 flex-initial mx-auto md:mx-0 w-96 height-full px-6 my-4 md:my-0 py-4 md:w-1/4 rounded-lg md:rounded-none'>
          <h1 className='text-2xl text-violet-500 font-bold mb-4 text-center md:text-left'>txt2img</h1>

          <PromptForm
            minDim={minDim}
            maxDim={maxDim}
            maxCfg={maxCfg}
            maxSteps={maxSteps}
            maxImages={maxImages}

            width={width}
            setWidth={setWidth}

            height={height}
            setHeight={setHeight}

            cfgScale={cfgScale}
            setCfgScale={setCfgScale}

            steps={steps}
            setSteps={setSteps}

            numImages={numImages}
            setNumImages={setNumImages}

            seed={seed}
            setSeed={setSeed}

            seedLocked={seedLocked}
            setSeedLocked={setSeedLocked}
          />
        </div>

        <div className='flex flex-col place-items-center place-self-center w-full mb-2 md:mb-0'>
          <div className='bg-neutral-900 aspect-square w-1/2 w-1/2 mb-24'>
            <img className='w-full h-full' src={image} alt='The placeholder for our generated art.'/>
          </div>

          <div className='flex flex-col md:flex-row items-center w-full gap-y-2 md:px-24'>
            <Prompt value={prompt} setValue={setPrompt} />

            <Button
              onClick={() => {
                if (ws.current !== null)
                  send(ws.current, width, height, cfgScale, steps, numImages, seed, prompt);
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
