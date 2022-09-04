import React, { useState } from 'react';
import Button from './components/button';
import FreezableSeedInput from './components/freezable-seed-input';
import Prompt from './components/prompt';
import RangeInput from './components/range-input';
import PromptForm from './components/prompt-form';
import useSocket from './hooks/use-socket';
import { fetchHost, genRandomSeed } from './libs/utils';
import ImageDisplay from './components/image-display';

type ServerResponse = { success: true, images: Array<string> } | { success: false, reason: string }

function openConnection(ws: WebSocket, event: Event) {
}

function receiveMessage(ws: WebSocket, event: MessageEvent, setImage: React.Dispatch<React.SetStateAction<string[]>>) {
  const response: ServerResponse = JSON.parse(event.data);

  if (response.success) {
    setImage(response.images);
  }

  console.log(response)
}

function send(
  ws: WebSocket, width: number, height: number, cfgScale: number,
  steps: number, numImages: number, seed: number, prompt: string
) {
  const imageRequest = { width, height, cfgScale, steps, numImages, seed, prompt };

  ws.send(JSON.stringify(imageRequest));
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
  const [seed, setSeed] = useState(genRandomSeed());
  const [seedLocked, setSeedLocked] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState(['/noimg.png']);

  const [ws, connected] = useSocket(`ws://${fetchHost()}/channel`, openConnection, (ws: WebSocket, event: MessageEvent) => receiveMessage(ws, event, setImages)) as [React.MutableRefObject<WebSocket | null>, boolean];

  return (
    <>
      <div className='md:flex md:flex-row-reverse md:h-screen'>
        <div className='bg-neutral-800 flex-initial mx-auto md:mx-0 w-96 height-full px-6 my-4 md:my-0 py-4 md:w-1/4 rounded-lg md:rounded-none'>
          <h1 className='text-2xl text-violet-500 font-bold mb-4 text-center md:text-left'>txt2img</h1>

          <PromptForm
            fieldList={[
              {
                class: "RangeInput",
                label: "Width",
                description: "The width of your image(s).",
                value: width,
                setValue: setWidth,
                min: minDim,
                max: maxDim,
                step: 32
              },
              {
                class: "RangeInput",
                label: "Height",
                description: "The height of your image(s).",
                value: height,
                setValue: setHeight,
                min: minDim,
                max: maxDim,
                step: 32
              },
              {
                class: "RangeInput",
                label: "CfgScale",
                description: "Adjusts how closely should the AI adhere to your prompt; higher values are more precise.",
                value: cfgScale,
                setValue: setCfgScale,
                min: 0,
                max: maxCfg,
                step: 0.5
              },
              {
                class: "RangeInput",
                label: "Steps",
                description: "The amount of steps by which the AI will detail your art.",
                value: steps,
                setValue: setSteps,
                min: 1,
                max: maxSteps,
                step: 1
              },
              {
                class: "RangeInput",
                label: "Number of Images",
                description: "Adjusts how closely should the AI adhere to your prompt; higher values are more precise.",
                value: numImages,
                setValue: setNumImages,
                min: 1,
                max: maxImages,
                step: 1
              },
              {
                class: "FreezableSeedInput",
                label: "Seed",
                description: "The identifier for a given random generation. Unlock this to set or copy your own.",
                value: seed,
                setValue: setSeed,
                lock: seedLocked,
                setLock: setSeedLocked
              }
            ]}
          />
        </div>

        <div className='flex flex-col place-items-center place-self-center w-full h-full mb-2 md:mb-0 p-4'>
          <div className='aspect-square w-full mb-20'>
            <ImageDisplay images={images} />
          </div>

          <div className='flex flex-col md:flex-row items-center w-full gap-y-2 py-4 md:px-24'>
            <Prompt value={prompt} setValue={setPrompt} />

            <Button
              onClick={() => {
                if (ws.current !== null) {
                  if (!seedLocked)
                    setSeed(genRandomSeed());
                  
                  send(ws.current, width, height, cfgScale, steps, numImages, seed, prompt);
                }
              }}

              active={connected}
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
