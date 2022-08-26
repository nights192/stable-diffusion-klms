function Button({ onClick, children }: { onClick?: () => void, children: string }) {
    return <button
      onClick={ onClick }
      className='block bg-violet-600 text-2xl text-zinc-200 font-bold px-8 py-1 rounded-full align-middle text-center mx-auto md:mx-0'>
        { children }
    </button>;
  }

export default Button;