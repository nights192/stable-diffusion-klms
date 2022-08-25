import React from 'react';

function Button({ onClick, children }: { onClick?: () => void, children: string }) {
  return <button
    onClick={ onClick }
    className='block bg-violet-600 text-2xl font-bold px-8 py-1 rounded-full align-middle text-center mx-auto md:mx-0'>{ children }
  </button>;
}

function PromptForm() {
  return <>
    <form>

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
